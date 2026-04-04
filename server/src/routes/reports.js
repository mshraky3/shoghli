const express = require('express');
const { query } = require('../db/pool');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/reports — Report a user
router.post('/', auth, async (req, res) => {
    try {
        const { reported_user_id, reason, details } = req.body;

        const validReasons = ['inappropriate', 'fake', 'dating', 'spam', 'harassment', 'other'];
        if (!reported_user_id || !reason || !validReasons.includes(reason)) {
            return res.status(400).json({ error: 'بيانات البلاغ غير صحيحة' });
        }

        if (reported_user_id === req.user.id) {
            return res.status(400).json({ error: 'لا يمكنك الإبلاغ عن نفسك' });
        }

        // Check for duplicate recent report
        const { rows: existing } = await query(
            `SELECT id FROM reports 
             WHERE reporter_id = $1 AND reported_user_id = $2 
             AND created_at > NOW() - INTERVAL '24 hours'`,
            [req.user.id, reported_user_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'لقد أرسلت بلاغاً عن هذا المستخدم مؤخراً' });
        }

        await query(
            `INSERT INTO reports (reporter_id, reported_user_id, reason, details)
             VALUES ($1, $2, $3, $4)`,
            [req.user.id, reported_user_id, reason, details?.substring(0, 1000) || null]
        );

        // Auto-block if 3+ reports from different users
        const { rows: reportCount } = await query(
            `SELECT COUNT(DISTINCT reporter_id) as cnt FROM reports 
             WHERE reported_user_id = $1 AND status = 'pending'`,
            [reported_user_id]
        );

        if (parseInt(reportCount[0].cnt) >= 3) {
            await query(
                `UPDATE users SET is_blocked = true, is_active = false, 
                 block_reason = 'تم الحظر تلقائياً بسبب بلاغات متعددة'
                 WHERE id = $1`,
                [reported_user_id]
            );
        }

        res.json({ message: 'تم إرسال البلاغ بنجاح. شكراً لمساعدتنا في الحفاظ على مجتمع آمن.' });
    } catch (err) {
        console.error('create report error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
