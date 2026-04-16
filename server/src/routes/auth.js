const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { verifyFirebaseToken } = require('../services/firebaseAdmin');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/refresh
router.post('/refresh',
    body('refreshToken').notEmpty(),
    async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            if (decoded.type !== 'refresh') {
                return res.status(400).json({ error: 'رمز تجديد غير صحيح' });
            }

            const { rows } = await query('SELECT id, phone, role, name FROM users WHERE id = $1', [decoded.userId]);
            if (rows.length === 0) {
                return res.status(401).json({ error: 'المستخدم غير موجود' });
            }

            const token = jwt.sign(
                { userId: decoded.userId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({ token });
        } catch (err) {
            return res.status(401).json({ error: 'رمز تجديد غير صحيح' });
        }
    }
);

// POST /api/auth/firebase-verify
router.post('/firebase-verify',
    body('idToken').notEmpty().withMessage('Firebase token is required'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { idToken } = req.body;

            // Verify the Firebase ID token
            const decoded = await verifyFirebaseToken(idToken);
            const phone = decoded.phone_number;

            if (!phone) {
                return res.status(400).json({ error: 'رقم الهاتف غير موجود في التوكن' });
            }

            // Find or create user
            let { rows: userRows } = await query(
                'SELECT * FROM users WHERE phone = $1', [phone]
            );

            let isNewUser = false;
            if (userRows.length === 0) {
                isNewUser = true;
                const { rows: newUser } = await query(
                    'INSERT INTO users (phone) VALUES ($1) RETURNING *',
                    [phone]
                );
                userRows = newUser;
            }

            const user = userRows[0];

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            const refreshToken = jwt.sign(
                { userId: user.id, type: 'refresh' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
            );

            res.json({
                token,
                refreshToken,
                user: {
                    id: user.id,
                    phone: user.phone,
                    role: user.role,
                    name: user.name,
                    avatar_url: user.avatar_url,
                    onboarding_completed: user.onboarding_completed,
                },
                isNewUser,
            });
        } catch (err) {
            console.error('firebase-verify error:', err);
            if (err.code === 'auth/id-token-expired') {
                return res.status(401).json({ error: 'انتهت صلاحية التوكن' });
            }
            if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-revoked') {
                return res.status(401).json({ error: 'توكن غير صالح' });
            }
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT u.*, 
        wp.category_ids, wp.experience_years, wp.available_hours, 
        wp.available_from, wp.available_to, wp.search_radius as worker_search_radius, wp.bio,
        ep.company_name
       FROM users u
       LEFT JOIN worker_profiles wp ON u.id = wp.user_id
       LEFT JOIN employer_profiles ep ON u.id = ep.user_id
       WHERE u.id = $1`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        const user = rows[0];
        // Never expose password/sensitive fields
        delete user.code_hash;

        res.json({ user });
    } catch (err) {
        console.error('auth/me error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
