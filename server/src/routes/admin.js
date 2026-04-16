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
        const [users, workers, employers, jobs, reports, requests, blocked, newThisWeek, byGovernorate, topCategories] = await Promise.all([
            query('SELECT COUNT(*) as count FROM users'),
            query("SELECT COUNT(*) as count FROM users WHERE role = 'worker'"),
            query("SELECT COUNT(*) as count FROM users WHERE role = 'employer'"),
            query("SELECT COUNT(*) as count FROM job_posts WHERE status = 'active'"),
            query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"),
            query('SELECT COUNT(*) as count FROM call_requests'),
            query('SELECT COUNT(*) as count FROM users WHERE is_blocked = true'),
            query("SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"),
            query(`SELECT g.name_ar as governorate, COUNT(u.id) as count
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
            byGovernorate: byGovernorate.rows,
            topCategories: topCategories.rows,
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

module.exports = router;
