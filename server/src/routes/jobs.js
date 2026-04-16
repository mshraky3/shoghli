const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/jobs — Create job post
router.post('/', auth, requireRole('employer'),
    body('category_id').isInt().withMessage('الفئة مطلوبة'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { category_id, title, description, salary_min, salary_max, lat, lng, search_radius } = req.body;

            const { rows } = await query(
                `INSERT INTO job_posts (employer_id, category_id, title, description, salary_min, salary_max, lat, lng, search_radius)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
                [req.user.id, category_id, title || null, description || null, salary_min || null, salary_max || null, lat || null, lng || null, search_radius || 'district']
            );

            res.status(201).json({ job: rows[0] });
        } catch (err) {
            console.error('create job error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// GET /api/jobs — List employer's own jobs
router.get('/', auth, requireRole('employer'), async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT jp.*, jc.name_ar as category_name, jc.icon as category_icon
       FROM job_posts jp
       JOIN job_categories jc ON jp.category_id = jc.id
       WHERE jp.employer_id = $1
       ORDER BY jp.created_at DESC`,
            [req.user.id]
        );
        res.json({ jobs: rows });
    } catch (err) {
        console.error('list jobs error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/jobs/browse — Browse active job posts (for workers marketplace)
router.get('/browse', auth, async (req, res) => {
    try {
        const { lat, lng, radius, category_id, page = 1, limit = 20 } = req.query;

        const RADIUS_MAP = {
            village: 3000,
            subdistrict: 15000,
            district: 40000,
            governorate: 100000,
        };

        const offset = (parseInt(page) - 1) * parseInt(limit);
        let distanceSelect = "'0'";
        let distanceFilter = '';
        let orderBy = 'jp.created_at DESC';
        const params = [];
        let paramIndex = 1;

        if (lat && lng) {
            const radiusMeters = RADIUS_MAP[radius] || RADIUS_MAP.district;
            params.push(parseFloat(lat), parseFloat(lng), radiusMeters);
            distanceSelect = `(6371000 * acos(
                cos(radians($1)) * cos(radians(jp.lat)) * cos(radians(jp.lng) - radians($2)) +
                sin(radians($1)) * sin(radians(jp.lat))
            ))`;
            distanceFilter = `AND jp.lat IS NOT NULL AND jp.lng IS NOT NULL
                AND (6371000 * acos(
                    cos(radians($1)) * cos(radians(jp.lat)) * cos(radians(jp.lng) - radians($2)) +
                    sin(radians($1)) * sin(radians(jp.lat))
                )) <= $3`;
            orderBy = 'distance_meters ASC';
            paramIndex = 4;
        }

        let categoryFilter = '';
        if (category_id) {
            categoryFilter = `AND jp.category_id = $${paramIndex}`;
            params.push(parseInt(category_id));
            paramIndex++;
        }

        params.push(parseInt(limit), offset);

        const { rows } = await query(
            `SELECT jp.*, jc.name_ar as category_name, jc.icon as category_icon,
                    u.name as employer_name, u.avatar_url as employer_avatar,
                    ${distanceSelect} as distance_meters
             FROM job_posts jp
             JOIN job_categories jc ON jp.category_id = jc.id
             JOIN users u ON jp.employer_id = u.id
             WHERE jp.status = 'active'
             ${distanceFilter}
             ${categoryFilter}
             ORDER BY ${orderBy}
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            params
        );

        const jobs = rows.map(j => ({
            ...j,
            distance_km: j.distance_meters ? Math.round(j.distance_meters / 100) / 10 : null,
        }));

        res.json({ jobs, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error('browse jobs error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/jobs/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT jp.*, jc.name_ar as category_name, jc.icon as category_icon,
        u.name as employer_name
       FROM job_posts jp
       JOIN job_categories jc ON jp.category_id = jc.id
       JOIN users u ON jp.employer_id = u.id
       WHERE jp.id = $1`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'الإعلان غير موجود' });
        }

        res.json({ job: rows[0] });
    } catch (err) {
        console.error('get job error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/jobs/:id
router.put('/:id', auth, requireRole('employer'), async (req, res) => {
    try {
        // Verify ownership
        const { rows: existing } = await query(
            'SELECT id FROM job_posts WHERE id = $1 AND employer_id = $2',
            [req.params.id, req.user.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ error: 'الإعلان غير موجود' });
        }

        const { title, description, salary_min, salary_max, status, search_radius } = req.body;
        const updates = [];
        const values = [];
        let i = 1;

        if (title !== undefined) { updates.push(`title = $${i++}`); values.push(title); }
        if (description !== undefined) { updates.push(`description = $${i++}`); values.push(description); }
        if (salary_min !== undefined) { updates.push(`salary_min = $${i++}`); values.push(salary_min); }
        if (salary_max !== undefined) { updates.push(`salary_max = $${i++}`); values.push(salary_max); }
        if (status && ['active', 'filled', 'cancelled'].includes(status)) {
            updates.push(`status = $${i++}`); values.push(status);
        }
        if (search_radius && ['village', 'subdistrict', 'district', 'governorate'].includes(search_radius)) {
            updates.push(`search_radius = $${i++}`); values.push(search_radius);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(req.params.id);

        await query(
            `UPDATE job_posts SET ${updates.join(', ')} WHERE id = $${i}`,
            values
        );

        res.json({ message: 'تم تحديث الإعلان' });
    } catch (err) {
        console.error('update job error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// DELETE /api/jobs/:id
router.delete('/:id', auth, requireRole('employer'), async (req, res) => {
    try {
        const { rowCount } = await query(
            'DELETE FROM job_posts WHERE id = $1 AND employer_id = $2',
            [req.params.id, req.user.id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'الإعلان غير موجود' });
        }

        res.json({ message: 'تم حذف الإعلان' });
    } catch (err) {
        console.error('delete job error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
