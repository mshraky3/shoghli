const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT * FROM job_categories WHERE is_active = true ORDER BY sort_order'
        );
        res.json({ categories: rows });
    } catch (err) {
        console.error('get categories error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
