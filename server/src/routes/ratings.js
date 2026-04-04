const express = require('express');
const { query } = require('../db/pool');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/ratings — Rate a user (after accepted call request)
router.post('/', auth, async (req, res) => {
    try {
        const { to_user_id, call_request_id, score, comment } = req.body;

        if (!to_user_id || !score || score < 1 || score > 5) {
            return res.status(400).json({ error: 'التقييم يجب أن يكون بين 1 و 5' });
        }

        if (to_user_id === req.user.id) {
            return res.status(400).json({ error: 'لا يمكنك تقييم نفسك' });
        }

        // If call_request_id provided, verify it's accepted and involves both users
        if (call_request_id) {
            const { rows } = await query(
                `SELECT id FROM call_requests 
                 WHERE id = $1 AND status = 'accepted' 
                 AND (from_user_id = $2 OR to_user_id = $2)
                 AND (from_user_id = $3 OR to_user_id = $3)`,
                [call_request_id, req.user.id, to_user_id]
            );
            if (rows.length === 0) {
                return res.status(400).json({ error: 'طلب الاتصال غير صالح' });
            }
        }

        await query(
            `INSERT INTO ratings (from_user_id, to_user_id, call_request_id, score, comment)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (from_user_id, to_user_id, call_request_id) 
             DO UPDATE SET score = $4, comment = $5`,
            [req.user.id, to_user_id, call_request_id || null, score, comment?.substring(0, 500) || null]
        );

        // Update cached avg rating
        const { rows: stats } = await query(
            `SELECT ROUND(AVG(score)::numeric, 1) as avg, COUNT(*) as cnt FROM ratings WHERE to_user_id = $1`,
            [to_user_id]
        );
        await query(
            `UPDATE users SET avg_rating = $1, rating_count = $2 WHERE id = $3`,
            [stats[0].avg || 0, stats[0].cnt || 0, to_user_id]
        );

        res.json({ message: 'تم التقييم بنجاح' });
    } catch (err) {
        console.error('create rating error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/ratings/:userId — Get ratings for a user
router.get('/:userId', async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT r.id, r.score, r.comment, r.created_at,
                    u.name as from_name
             FROM ratings r
             JOIN users u ON u.id = r.from_user_id
             WHERE r.to_user_id = $1
             ORDER BY r.created_at DESC
             LIMIT 50`,
            [req.params.userId]
        );

        const { rows: stats } = await query(
            `SELECT ROUND(AVG(score)::numeric, 1) as avg_score, COUNT(*) as total
             FROM ratings WHERE to_user_id = $1`,
            [req.params.userId]
        );

        res.json({
            ratings: rows,
            avg_score: parseFloat(stats[0]?.avg_score) || 0,
            total: parseInt(stats[0]?.total) || 0,
        });
    } catch (err) {
        console.error('get ratings error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
