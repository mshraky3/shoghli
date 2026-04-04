const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');
const { moderateAndNormalizeAvatar } = require('../services/imageModeration');

const router = express.Router();

// PUT /api/users/role — Set role (first step of onboarding)
router.put('/role', auth,
    body('role').isIn(['worker', 'employer']).withMessage('الدور يجب أن يكون عامل أو صاحب عمل'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { role } = req.body;

            await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, req.user.id]);

            // Create corresponding profile
            if (role === 'worker') {
                await query(
                    'INSERT INTO worker_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                    [req.user.id]
                );
            } else {
                await query(
                    'INSERT INTO employer_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                    [req.user.id]
                );
            }

            res.json({ message: 'تم تحديث الدور', role });
        } catch (err) {
            console.error('set role error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// PUT /api/users/location — Update location
router.put('/location', auth,
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صحيح'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صحيح'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { lat, lng, governorate_id, district_id, subdistrict_id, village_id } = req.body;

            await query(
                `UPDATE users SET 
          lat = $1, lng = $2,
          governorate_id = $3, district_id = $4, 
          subdistrict_id = $5, village_id = $6,
          updated_at = NOW()
         WHERE id = $7`,
                [lat, lng, governorate_id || null, district_id || null, subdistrict_id || null, village_id || null, req.user.id]
            );

            res.json({ message: 'تم تحديث الموقع' });
        } catch (err) {
            console.error('update location error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// PUT /api/users/profile — Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone_visibility } = req.body;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name.substring(0, 100));
        }
        if (phone_visibility && ['public', 'request_only'].includes(phone_visibility)) {
            updates.push(`phone_visibility = $${paramIndex++}`);
            values.push(phone_visibility);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(req.user.id);

        await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
        );

        res.json({ message: 'تم تحديث الملف الشخصي' });
    } catch (err) {
        console.error('update profile error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/users/avatar — Upload profile avatar (base64 data URL)
router.put('/avatar', auth,
    body('imageData').isString().isLength({ min: 50 }).withMessage('الصورة مطلوبة'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { imageData } = req.body;
            const result = await moderateAndNormalizeAvatar(imageData);

            if (!result.ok) {
                return res.status(400).json({ error: result.error });
            }

            await query(
                'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
                [result.imageDataUrl, req.user.id]
            );

            res.json({
                message: 'تم تحديث صورة الملف الشخصي',
                avatar_url: result.imageDataUrl,
                moderation: result.moderation,
            });
        } catch (err) {
            console.error('update avatar error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// PUT /api/users/onboarding-complete
router.put('/onboarding-complete', auth, async (req, res) => {
    try {
        await query(
            'UPDATE users SET onboarding_completed = true, updated_at = NOW() WHERE id = $1',
            [req.user.id]
        );
        res.json({ message: 'تم إكمال الإعداد' });
    } catch (err) {
        console.error('onboarding complete error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/users/:id — Public profile
router.get('/:id', auth, async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT u.id, u.name, u.role, u.lat, u.lng, u.phone_visibility, u.is_active,
        u.avatar_url,
        u.governorate_id, u.district_id, u.avg_rating, u.rating_count,
        g.name_ar as governorate_name, d.name_ar as district_name,
        wp.category_ids, wp.experience_years, wp.available_hours, wp.bio,
        wp.clinic_name, wp.specialty, wp.work_days,
        ep.company_name
       FROM users u
       LEFT JOIN governorates g ON u.governorate_id = g.id
       LEFT JOIN districts d ON u.district_id = d.id
       LEFT JOIN worker_profiles wp ON u.id = wp.user_id
       LEFT JOIN employer_profiles ep ON u.id = ep.user_id
       WHERE u.id = $1`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        const profile = rows[0];

        // Only show phone if visibility is public or if viewing own profile
        if (profile.phone_visibility === 'public' || profile.id === req.user.id) {
            const { rows: phoneRows } = await query('SELECT phone FROM users WHERE id = $1', [req.params.id]);
            profile.phone = phoneRows[0].phone;
        }

        res.json({ user: profile });
    } catch (err) {
        console.error('get user error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/users/accept-terms
router.put('/accept-terms', auth, async (req, res) => {
    try {
        await query(
            'UPDATE users SET terms_accepted_at = NOW(), updated_at = NOW() WHERE id = $1',
            [req.user.id]
        );
        res.json({ message: 'تم قبول الشروط والأحكام' });
    } catch (err) {
        console.error('accept terms error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
