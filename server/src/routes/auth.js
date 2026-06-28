const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { auth } = require('../middleware/auth');
const { sendWelcomeEmail, sendOtpEmail } = require('../services/emailService');
const { sendWhatsAppOtp } = require('../services/whatsappService');

const router = express.Router();

// In-memory OTP store: email -> { otp, expiresAt }
const otpStore = new Map();
const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

// ── WhatsApp OTP store: normalizedPhone -> { otp, expiresAt, sentAt, attempts }
const waOtpStore = new Map();
const generateOtp6 = () => String(Math.floor(100000 + Math.random() * 900000));

// POST /api/auth/send-wa-otp
router.post('/send-wa-otp',
    body('phone').notEmpty().trim(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ error: 'رقم الهاتف مطلوب' });

            const { phone } = req.body;
            const normalized = phone.replace(/\D/g, '');
            if (normalized.length < 9) return res.status(400).json({ error: 'رقم الهاتف غير صحيح' });

            // Rate-limit: block if sent within the last 60 s
            const existing = waOtpStore.get(normalized);
            if (existing && Date.now() - existing.sentAt < 60_000) {
                const wait = Math.ceil((60_000 - (Date.now() - existing.sentAt)) / 1000);
                return res.status(429).json({ error: `انتظر ${wait} ثانية قبل إعادة الإرسال` });
            }

            const otp = generateOtp6();
            waOtpStore.set(normalized, { otp, expiresAt: Date.now() + 10 * 60_000, sentAt: Date.now(), attempts: 0 });

            await sendWhatsAppOtp(phone, otp);
            res.json({ message: 'تم إرسال رمز التحقق عبر واتساب' });
        } catch (err) {
            console.error('send-wa-otp error:', err);
            res.status(500).json({ error: 'تعذر إرسال الرمز، تحقق من رقم الهاتف أو حاول لاحقاً' });
        }
    }
);

// POST /api/auth/verify-wa-otp
router.post('/verify-wa-otp',
    body('phone').notEmpty().trim(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ error: 'بيانات غير صحيحة' });

            const { phone, otp } = req.body;
            const normalized = phone.replace(/\D/g, '');

            const stored = waOtpStore.get(normalized);
            if (!stored) return res.status(400).json({ error: 'لا يوجد رمز تحقق لهذا الرقم، أعد الإرسال' });
            if (Date.now() > stored.expiresAt) {
                waOtpStore.delete(normalized);
                return res.status(400).json({ error: 'انتهت صلاحية الرمز، أعد الإرسال' });
            }
            if (stored.attempts >= 5) {
                waOtpStore.delete(normalized);
                return res.status(429).json({ error: 'تجاوزت عدد المحاولات، أعد إرسال رمز جديد' });
            }
            if (stored.otp !== otp) {
                stored.attempts++;
                const left = 5 - stored.attempts;
                return res.status(400).json({ error: `رمز خاطئ، تبقّى ${left} محاولة` });
            }

            waOtpStore.delete(normalized);

            // Find or create user by phone (try with and without + prefix)
            const fullPhone = '+' + normalized;
            const { rows } = await query(
                'SELECT * FROM users WHERE phone = $1 OR phone = $2 LIMIT 1',
                [fullPhone, normalized]
            );

            let user;
            let isNewUser = false;
            if (rows.length > 0) {
                user = rows[0];
                if (user.is_blocked) {
                    return res.status(403).json({ error: 'هذا الحساب محظور' + (user.block_reason ? ': ' + user.block_reason : '') });
                }
            } else {
                const { rows: newRows } = await query(
                    'INSERT INTO users (phone) VALUES ($1) RETURNING *',
                    [fullPhone]
                );
                user = newRows[0];
                isNewUser = true;
            }

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
            const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

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
                    lat: user.lat,
                    lng: user.lng,
                    whatsapp_opt_in: user.whatsapp_opt_in,
                    employer_status: user.employer_status,
                },
                isNewUser,
            });
        } catch (err) {
            console.error('verify-wa-otp error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// POST /api/auth/send-otp
router.post('/send-otp',
    body('email').isEmail().normalizeEmail().withMessage('البريد الإلكتروني غير صحيح'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });
            const { email } = req.body;
            const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (emailCheck.rows.length > 0) return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
            const otp = generateOtp();
            otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
            await sendOtpEmail(email, otp);
            res.json({ message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
        } catch (err) { console.error('send-otp error:', err); res.status(500).json({ error: 'تعذر إرسال البريد الإلكتروني، حاول مجدداً' }); }
    }
);

// POST /api/auth/register
router.post('/register',
    body('email').isEmail().normalizeEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('phone').notEmpty().trim().withMessage('رقم الهاتف مطلوب'),
    body('password').isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    body('otp').isLength({ min: 4, max: 4 }).isNumeric().withMessage('رمز التحقق غير صحيح'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
            const { email, phone, password, name, otp, company_name, role: reqRole } = req.body;
            // Mobile app registers workers; website registers employers (default).
            const role = reqRole === 'worker' ? 'worker' : 'employer';
            // Verify OTP
            const stored = otpStore.get(email);
            if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
                return res.status(400).json({ error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
            }
            otpStore.delete(email);
            const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (emailCheck.rows.length > 0) return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
            const phoneCheck = await query('SELECT id FROM users WHERE phone = $1', [phone]);
            if (phoneCheck.rows.length > 0) return res.status(409).json({ error: 'رقم الهاتف مستخدم بالفعل' });
            const password_hash = await bcrypt.hash(password, 12);
            let user;
            if (role === 'worker') {
                // Workers (mobile) are free — no payment/approval.
                const { rows: newUser } = await query(
                    "INSERT INTO users (email, phone, name, password_hash, role) VALUES ($1, $2, $3, $4, 'worker') RETURNING *",
                    [email, phone, name || null, password_hash]
                );
                user = newUser[0];
                await query('INSERT INTO worker_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [user.id]);
            } else {
                // Employers (website) start as 'pending_payment' until they pay via Sham Cash and get approved.
                const { rows: newUser } = await query(
                    "INSERT INTO users (email, phone, name, password_hash, role, employer_status) VALUES ($1, $2, $3, $4, 'employer', 'pending_payment') RETURNING *",
                    [email, phone, name || null, password_hash]
                );
                user = newUser[0];
                await query(
                    'INSERT INTO employer_profiles (user_id, company_name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
                    [user.id, company_name ? company_name.substring(0, 100) : null]
                );
            }
            sendWelcomeEmail(email, name).catch(e => console.error('email fail:', e.message));
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
            const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });
            res.status(201).json({ token, refreshToken, user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, avatar_url: user.avatar_url, whatsapp_opt_in: user.whatsapp_opt_in, onboarding_completed: user.onboarding_completed, lat: user.lat, lng: user.lng, employer_status: user.employer_status }, isNewUser: true });
        } catch (err) { console.error('register error:', err); res.status(500).json({ error: 'حدث خطأ في الخادم' }); }
    }
);

// POST /api/auth/login
router.post('/login',
    body('identifier').notEmpty().trim(),
    body('password').notEmpty(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
            const { identifier, password } = req.body;
            // Normalize phone: strip non-digits and leading zeros for suffix match
            const phoneDigits = identifier.replace(/\D/g, '').replace(/^0+/, '');
            const { rows } = await query(
                'SELECT * FROM users WHERE email = $1 OR phone = $1 OR (phone IS NOT NULL AND $2 != \'\' AND phone LIKE $3) LIMIT 1',
                [identifier, phoneDigits, '%' + phoneDigits]
            );
            if (rows.length === 0) { await bcrypt.hash('dummy', 12); return res.status(401).json({ error: 'البيانات غير صحيحة' }); }
            const user = rows[0];
            if (!user.password_hash) return res.status(401).json({ error: 'البيانات غير صحيحة' });
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) return res.status(401).json({ error: 'البيانات غير صحيحة' });
            if (user.is_blocked) return res.status(403).json({ error: 'هذا الحساب محظور' + (user.block_reason ? ': ' + user.block_reason : '') });
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
            const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });
            res.json({ token, refreshToken, user: { id: user.id, email: user.email, phone: user.phone, role: user.role, name: user.name, avatar_url: user.avatar_url, whatsapp_opt_in: user.whatsapp_opt_in, onboarding_completed: user.onboarding_completed, lat: user.lat, lng: user.lng, employer_status: user.employer_status } });
        } catch (err) { console.error('login error:', err); res.status(500).json({ error: 'حدث خطأ في الخادم' }); }
    }
);

// POST /api/auth/refresh
router.post('/refresh', body('refreshToken').notEmpty(), async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        if (decoded.type !== 'refresh') return res.status(400).json({ error: 'رمز تجديد غير صحيح' });
        const { rows } = await query('SELECT id, phone, role, name FROM users WHERE id = $1', [decoded.userId]);
        if (rows.length === 0) return res.status(401).json({ error: 'المستخدم غير موجود' });
        const token = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        res.json({ token });
    } catch (err) { return res.status(401).json({ error: 'رمز تجديد غير صحيح' }); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const { rows } = await query(`SELECT u.*, g.name_ar as governorate_name, d.name_ar as district_name, wp.category_ids, wp.experience_years, wp.available_hours, wp.available_from, wp.available_to, wp.search_radius as worker_search_radius, wp.bio, wp.work_days, wp.clinic_name, wp.specialty, (SELECT string_agg(jc.name_ar, ', ') FROM job_categories jc WHERE jc.id = ANY(wp.category_ids)) as categories_text, ep.company_name FROM users u LEFT JOIN governorates g ON u.governorate_id = g.id LEFT JOIN districts d ON u.district_id = d.id LEFT JOIN worker_profiles wp ON u.id = wp.user_id LEFT JOIN employer_profiles ep ON u.id = ep.user_id WHERE u.id = $1`, [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
        const user = rows[0];
        delete user.code_hash;
        delete user.password_hash;
        res.json({ user });
    } catch (err) { console.error('auth/me error:', err); res.status(500).json({ error: 'حدث خطأ في الخادم' }); }
});

module.exports = router;
