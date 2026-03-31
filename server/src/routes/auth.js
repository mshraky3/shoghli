const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { sendSMS } = require('../services/sms');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Rate limit check: max 3 OTPs per phone per hour
const checkOTPRateLimit = async (phone) => {
    const { rows } = await query(
        `SELECT COUNT(*) as count FROM otp_codes 
     WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [phone]
    );
    return parseInt(rows[0].count) < 3;
};

// POST /api/auth/send-otp
router.post('/send-otp',
    body('phone').matches(/^\+963\d{8,9}$/).withMessage('رقم هاتف سوري غير صحيح'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { phone } = req.body;

            // TEST MODE: skip OTP entirely
            if (process.env.SMS_PROVIDER === 'test') {
                console.log(`🧪 [Test Mode] OTP skipped for ${phone}`);
                return res.json({ message: 'تم إرسال رمز التحقق', testMode: true, otp: '000000' });
            }

            // Rate limit
            const allowed = await checkOTPRateLimit(phone);
            if (!allowed) {
                return res.status(429).json({ error: 'تم تجاوز الحد الأقصى لمحاولات الإرسال. حاول بعد ساعة.' });
            }

            // Generate and hash OTP
            const otp = generateOTP();
            const codeHash = await bcrypt.hash(otp, 10);

            // Invalidate previous codes
            await query(
                'UPDATE otp_codes SET used = true WHERE phone = $1 AND used = false',
                [phone]
            );

            // Store new OTP
            await query(
                `INSERT INTO otp_codes (phone, code_hash, expires_at) 
         VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
                [phone, codeHash]
            );

            // Send SMS
            await sendSMS(phone, `رمز التحقق الخاص بك في شغل: ${otp}`);

            // In dev mode, include OTP in response
            const response = { message: 'تم إرسال رمز التحقق' };
            if (process.env.SMS_PROVIDER === 'mock') {
                response.otp = otp; // Remove in production!
            }

            res.json(response);
        } catch (err) {
            console.error('send-otp error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// POST /api/auth/verify-otp
router.post('/verify-otp',
    body('phone').matches(/^\+963\d{8,9}$/).withMessage('رقم هاتف سوري غير صحيح'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('رمز التحقق يجب أن يكون 6 أرقام'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { phone, code } = req.body;

            // TEST MODE: skip OTP verification, accept any code
            if (process.env.SMS_PROVIDER === 'test') {
                console.log(`🧪 [Test Mode] OTP verification skipped for ${phone}`);
            } else {
                // Get latest unused OTP
                const { rows: otpRows } = await query(
                    `SELECT * FROM otp_codes 
           WHERE phone = $1 AND used = false AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1`,
                    [phone]
                );

                if (otpRows.length === 0) {
                    return res.status(400).json({ error: 'رمز التحقق منتهي الصلاحية أو غير موجود' });
                }

                const otpRecord = otpRows[0];

                // Check attempts
                if (otpRecord.attempts >= 5) {
                    await query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRecord.id]);
                    return res.status(400).json({ error: 'تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.' });
                }

                // Verify OTP
                const isValid = await bcrypt.compare(code, otpRecord.code_hash);
                if (!isValid) {
                    await query(
                        'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
                        [otpRecord.id]
                    );
                    return res.status(400).json({ error: 'رمز التحقق غير صحيح' });
                }

                // Mark OTP as used
                await query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRecord.id]);
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
                    onboarding_completed: user.onboarding_completed,
                },
                isNewUser,
            });
        } catch (err) {
            console.error('verify-otp error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

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
