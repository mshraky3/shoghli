const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/login
router.post('/login',
    body('username').notEmpty().trim(),
    body('password').notEmpty(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, password } = req.body;

            const { rows } = await query(
                'SELECT * FROM admins WHERE username = $1',
                [username]
            );

            if (rows.length === 0) {
                return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
            }

            const admin = rows[0];
            const isValid = await bcrypt.compare(password, admin.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
            }

            const token = jwt.sign(
                { adminId: admin.id, username: admin.username, isAdmin: true },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({ token, admin: { id: admin.id, username: admin.username } });
        } catch (err) {
            console.error('admin login error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const [
            users,
            workers,
            employers,
            jobs,
            reports,
            requests,
            blocked,
            newThisWeek,
            onboardingCompleted,
            newThisMonth,
            byGovernorate,
            topCategories,
            jobsByStatus,
            requestsByStatus,
            reportsByStatus,
            recentSignups,
        ] = await Promise.all([
            query('SELECT COUNT(*) as count FROM users'),
            query("SELECT COUNT(*) as count FROM users WHERE role = 'worker'"),
            query("SELECT COUNT(*) as count FROM users WHERE role = 'employer'"),
            query("SELECT COUNT(*) as count FROM job_posts WHERE status = 'active'"),
            query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"),
            query('SELECT COUNT(*) as count FROM call_requests'),
            query('SELECT COUNT(*) as count FROM users WHERE is_blocked = true'),
            query("SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"),
            query("SELECT COUNT(*) as count FROM users WHERE onboarding_completed = true"),
            query("SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"),
            query(`SELECT g.name_ar as name, COUNT(u.id) as count
                   FROM users u
                   JOIN governorates g ON u.governorate_id = g.id
                   GROUP BY g.name_ar
                   ORDER BY count DESC
                   LIMIT 10`),
            query(`SELECT jc.name_ar as category, COUNT(*) as count
                   FROM worker_profiles wp, unnest(wp.category_ids) AS cat_id
                   JOIN job_categories jc ON jc.id = cat_id
                   GROUP BY jc.id, jc.name_ar
                   ORDER BY count DESC
                   LIMIT 10`),
            query(`SELECT status::text as status, COUNT(*) as count
                   FROM job_posts
                   GROUP BY status
                   ORDER BY count DESC`),
            query(`SELECT status::text as status, COUNT(*) as count
                   FROM call_requests
                   GROUP BY status
                   ORDER BY count DESC`),
            query(`SELECT status::text as status, COUNT(*) as count
                   FROM reports
                   GROUP BY status
                   ORDER BY count DESC`),
            query(`SELECT TO_CHAR(d.day, 'YYYY-MM-DD') as day, COALESCE(COUNT(u.id), 0) as count
                   FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS d(day)
                   LEFT JOIN users u ON DATE(u.created_at) = d.day::date
                   GROUP BY d.day
                   ORDER BY d.day ASC`),
        ]);

        res.json({
            totalUsers: parseInt(users.rows[0].count),
            totalWorkers: parseInt(workers.rows[0].count),
            totalEmployers: parseInt(employers.rows[0].count),
            activeJobs: parseInt(jobs.rows[0].count),
            pendingReports: parseInt(reports.rows[0].count),
            totalRequests: parseInt(requests.rows[0].count),
            blockedUsers: parseInt(blocked.rows[0].count),
            newThisWeek: parseInt(newThisWeek.rows[0].count),
            onboardingCompleted: parseInt(onboardingCompleted.rows[0].count),
            newThisMonth: parseInt(newThisMonth.rows[0].count),
            byGovernorate: byGovernorate.rows.map((row) => ({
                name: row.name,
                count: parseInt(row.count),
            })),
            topCategories: topCategories.rows.map((row) => ({
                category: row.category,
                count: parseInt(row.count),
            })),
            jobsByStatus: jobsByStatus.rows.map((row) => ({
                status: row.status,
                count: parseInt(row.count),
            })),
            requestsByStatus: requestsByStatus.rows.map((row) => ({
                status: row.status,
                count: parseInt(row.count),
            })),
            reportsByStatus: reportsByStatus.rows.map((row) => ({
                status: row.status,
                count: parseInt(row.count),
            })),
            recentSignups: recentSignups.rows.map((row) => ({
                day: row.day,
                count: parseInt(row.count),
            })),
        });
    } catch (err) {
        console.error('admin stats error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const blocked = req.query.blocked;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (role && ['worker', 'employer'].includes(role)) {
            whereClause += ` AND u.role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (blocked === 'true') {
            whereClause += ' AND u.is_blocked = true';
        } else if (blocked === 'false') {
            whereClause += ' AND u.is_blocked = false';
        }

        const countResult = await query(
            `SELECT COUNT(*) as count FROM users u ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const usersResult = await query(
            `SELECT u.id, u.phone, u.role, u.name, u.avatar_url, u.is_active, 
                    u.is_blocked, u.block_reason, u.onboarding_completed,
                    u.avg_rating, u.rating_count, u.created_at,
                    g.name_ar as governorate
             FROM users u
             LEFT JOIN governorates g ON u.governorate_id = g.id
             ${whereClause}
             ORDER BY u.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            users: usersResult.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('admin users error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', requireAdmin,
    body('reason').optional().trim(),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            await query(
                'UPDATE users SET is_blocked = true, block_reason = $2, updated_at = NOW() WHERE id = $1',
                [id, reason || 'محظور بواسطة المدير']
            );

            res.json({ message: 'تم حظر المستخدم' });
        } catch (err) {
            console.error('admin block error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// PUT /api/admin/users/:id/unblock
router.put('/users/:id/unblock', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await query(
            'UPDATE users SET is_blocked = false, block_reason = NULL, updated_at = NOW() WHERE id = $1',
            [id]
        );

        res.json({ message: 'تم إلغاء حظر المستخدم' });
    } catch (err) {
        console.error('admin unblock error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/admin/reports
router.get('/reports', requireAdmin, async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const offset = (page - 1) * limit;

        const countResult = await query(
            'SELECT COUNT(*) as count FROM reports WHERE status = $1',
            [status]
        );
        const total = parseInt(countResult.rows[0].count);

        const reportsResult = await query(
            `SELECT r.*, 
                    reporter.name as reporter_name, reporter.phone as reporter_phone,
                    reported.name as reported_name, reported.phone as reported_phone
             FROM reports r
             JOIN users reporter ON r.reporter_id = reporter.id
             JOIN users reported ON r.reported_user_id = reported.id
             WHERE r.status = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [status, limit, offset]
        );

        res.json({
            reports: reportsResult.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('admin reports error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/admin/reports/:id/status
router.put('/reports/:id/status', requireAdmin,
    body('status').isIn(['pending', 'reviewed', 'resolved', 'dismissed']),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { status } = req.body;

            await query(
                'UPDATE reports SET status = $2, reviewed_at = NOW() WHERE id = $1',
                [id, status]
            );

            res.json({ message: 'تم تحديث حالة البلاغ' });
        } catch (err) {
            console.error('admin report status error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete related data first
        await query('DELETE FROM otp_codes WHERE phone = (SELECT phone FROM users WHERE id = $1)', [id]);
        await query('DELETE FROM reports WHERE reporter_id = $1 OR reported_user_id = $1', [id]);
        await query('DELETE FROM ratings WHERE from_user_id = $1 OR to_user_id = $1', [id]);
        await query('DELETE FROM call_requests WHERE from_user_id = $1 OR to_user_id = $1', [id]);
        await query('DELETE FROM notifications WHERE user_id = $1', [id]);
        await query('DELETE FROM job_posts WHERE employer_id = $1', [id]);
        await query('DELETE FROM worker_profiles WHERE user_id = $1', [id]);
        await query('DELETE FROM employer_profiles WHERE user_id = $1', [id]);
        await query('DELETE FROM users WHERE id = $1', [id]);

        res.json({ message: 'تم حذف المستخدم' });
    } catch (err) {
        console.error('admin delete user error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// ============================================
// Employer applications (payment review)
// ============================================

// GET /api/admin/employer-applications?status=pending_review
router.get('/employer-applications', requireAdmin, async (req, res) => {
    try {
        const status = req.query.status || 'pending_review';
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const offset = (page - 1) * limit;

        const countResult = await query(
            'SELECT COUNT(*) as count FROM employer_applications WHERE status = $1',
            [status]
        );
        const total = parseInt(countResult.rows[0].count);

        const { rows } = await query(
            `SELECT ea.id, ea.user_id, ea.payment_screenshot, ea.status, ea.rejection_reason,
                    ea.created_at, ea.updated_at, ea.reviewed_at,
                    u.name, u.phone, u.email,
                    ep.company_name
             FROM employer_applications ea
             JOIN users u ON ea.user_id = u.id
             LEFT JOIN employer_profiles ep ON ea.user_id = ep.user_id
             WHERE ea.status = $1
             ORDER BY ea.created_at ASC
             LIMIT $2 OFFSET $3`,
            [status, limit, offset]
        );

        res.json({
            applications: rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('admin employer applications error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/admin/employer-applications/:id/approve
router.put('/employer-applications/:id/approve', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await query('SELECT user_id FROM employer_applications WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'الطلب غير موجود' });
        const userId = rows[0].user_id;

        await query(
            `UPDATE employer_applications
             SET status = 'approved', rejection_reason = NULL, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [id, req.admin.adminId]
        );
        await query(
            "UPDATE users SET employer_status = 'approved', updated_at = NOW() WHERE id = $1",
            [userId]
        );

        res.json({ message: 'تمت الموافقة على الحساب' });
    } catch (err) {
        console.error('admin approve employer error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/admin/employer-applications/:id/reject
router.put('/employer-applications/:id/reject', requireAdmin,
    body('reason').optional().trim(),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const { rows } = await query('SELECT user_id FROM employer_applications WHERE id = $1', [id]);
            if (rows.length === 0) return res.status(404).json({ error: 'الطلب غير موجود' });
            const userId = rows[0].user_id;

            await query(
                `UPDATE employer_applications
                 SET status = 'rejected', rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
                 WHERE id = $1`,
                [id, reason || 'تم رفض الطلب', req.admin.adminId]
            );
            await query(
                "UPDATE users SET employer_status = 'rejected', updated_at = NOW() WHERE id = $1",
                [userId]
            );

            res.json({ message: 'تم رفض الطلب' });
        } catch (err) {
            console.error('admin reject employer error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// ============================================
// App settings (Sham Cash number + fee)
// ============================================

// GET /api/admin/settings
router.get('/settings', requireAdmin, async (req, res) => {
    try {
        const { rows } = await query('SELECT key, value FROM app_settings');
        res.json({ settings: Object.fromEntries(rows.map(r => [r.key, r.value])) });
    } catch (err) {
        console.error('admin get settings error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/admin/settings
router.put('/settings', requireAdmin, async (req, res) => {
    try {
        const allowed = ['sham_cash_phone', 'employer_fee_amount', 'employer_fee_currency'];
        const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));
        for (const [key, value] of entries) {
            await query(
                `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                [key, value == null ? '' : String(value)]
            );
        }
        res.json({ message: 'تم حفظ الإعدادات' });
    } catch (err) {
        console.error('admin put settings error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
