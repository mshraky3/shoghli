const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Radius in meters for search
const RADIUS_MAP = {
    village: 3000,
    subdistrict: 15000,
    district: 40000,
    governorate: 100000,
};

// PUT /api/workers/profile — Update worker-specific profile
router.put('/profile', auth, requireRole('worker'), async (req, res) => {
    try {
        const { category_ids, experience_years, available_hours, available_from, available_to, search_radius, bio, clinic_name, specialty, work_days } = req.body;

        const updates = [];
        const values = [];
        let i = 1;

        if (category_ids !== undefined) {
            updates.push(`category_ids = $${i++}`);
            values.push(category_ids);
        }
        if (experience_years !== undefined) {
            updates.push(`experience_years = $${i++}`);
            values.push(experience_years);
        }
        if (available_hours !== undefined) {
            updates.push(`available_hours = $${i++}`);
            values.push(available_hours);
        }
        if (available_from !== undefined) {
            updates.push(`available_from = $${i++}`);
            values.push(available_from);
        }
        if (available_to !== undefined) {
            updates.push(`available_to = $${i++}`);
            values.push(available_to);
        }
        if (search_radius && ['village', 'subdistrict', 'district', 'governorate'].includes(search_radius)) {
            updates.push(`search_radius = $${i++}`);
            values.push(search_radius);
        }
        if (bio !== undefined) {
            updates.push(`bio = $${i++}`);
            values.push(bio.substring(0, 500));
        }
        if (clinic_name !== undefined) {
            updates.push(`clinic_name = $${i++}`);
            values.push(clinic_name.substring(0, 150));
        }
        if (specialty !== undefined) {
            updates.push(`specialty = $${i++}`);
            values.push(specialty.substring(0, 150));
        }
        if (work_days !== undefined) {
            updates.push(`work_days = $${i++}`);
            values.push(work_days);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(req.user.id);

        await query(
            `UPDATE worker_profiles SET ${updates.join(', ')} WHERE user_id = $${i}`,
            values
        );

        res.json({ message: 'تم تحديث ملف العامل' });
    } catch (err) {
        console.error('update worker profile error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/workers/availability — Toggle availability
router.put('/availability', auth, requireRole('worker'), async (req, res) => {
    try {
        const { is_active } = req.body;
        await query(
            'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
            [!!is_active, req.user.id]
        );
        res.json({ message: is_active ? 'أنت متاح الآن' : 'أنت غير متاح الآن', is_active: !!is_active });
    } catch (err) {
        console.error('toggle availability error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/workers/nearby — Search nearby workers (for employers)
router.get('/nearby', auth, async (req, res) => {
    try {
        const { lat, lng, radius, category_id, page = 1, limit = 20 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'الموقع مطلوب' });
        }

        const radiusMeters = RADIUS_MAP[radius] || RADIUS_MAP.district;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Calculate distance using Haversine formula in SQL
        // Since PostGIS might not be available on all hosts, use plain lat/lng math
        let categoryFilter = '';
        const params = [parseFloat(lat), parseFloat(lng), radiusMeters, parseInt(limit), offset];

        if (category_id) {
            categoryFilter = `AND $6 = ANY(wp.category_ids)`;
            params.push(parseInt(category_id));
        }

        const { rows } = await query(
            `SELECT 
        u.id, u.name, u.avatar_url, u.lat, u.lng, u.phone_visibility, u.is_active,
        u.governorate_id, u.district_id, u.avg_rating, u.rating_count,
        g.name_ar as governorate_name, d.name_ar as district_name,
        wp.category_ids, wp.experience_years, wp.available_hours, wp.bio,
        (6371000 * acos(
          cos(radians($1)) * cos(radians(u.lat)) * cos(radians(u.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(u.lat))
        )) as distance_meters
       FROM users u
       JOIN worker_profiles wp ON u.id = wp.user_id
       LEFT JOIN governorates g ON u.governorate_id = g.id
       LEFT JOIN districts d ON u.district_id = d.id
       WHERE u.role = 'worker'
         AND u.is_active = true
         AND u.onboarding_completed = true
         AND u.lat IS NOT NULL
         AND u.lng IS NOT NULL
         AND (6371000 * acos(
           cos(radians($1)) * cos(radians(u.lat)) * cos(radians(u.lng) - radians($2)) +
           sin(radians($1)) * sin(radians(u.lat))
         )) <= $3
         ${categoryFilter}
       ORDER BY distance_meters ASC
       LIMIT $4 OFFSET $5`,
            params
        );

        // Never expose phone numbers in list view
        const workers = rows.map(w => {
            const worker = { ...w };
            delete worker.phone;
            worker.distance_km = Math.round(worker.distance_meters / 100) / 10;
            return worker;
        });

        res.json({ workers, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error('nearby workers error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
