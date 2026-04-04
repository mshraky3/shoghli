const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { auth } = require('../middleware/auth');
const { sendSMS } = require('../services/sms');

const router = express.Router();

// POST /api/call-requests — Create call request
router.post('/', auth,
    body('to_user_id').isUUID().withMessage('معرف المستخدم غير صحيح'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { to_user_id, job_post_id, message } = req.body;

            // Can't request yourself
            if (to_user_id === req.user.id) {
                return res.status(400).json({ error: 'لا يمكنك إرسال طلب لنفسك' });
            }

            // Check if target user exists
            const { rows: targetRows } = await query(
                'SELECT id, phone, name, phone_visibility FROM users WHERE id = $1',
                [to_user_id]
            );
            if (targetRows.length === 0) {
                return res.status(404).json({ error: 'المستخدم غير موجود' });
            }

            const target = targetRows[0];

            // If phone is public, no need for call request
            if (target.phone_visibility === 'public') {
                return res.json({
                    phone: target.phone,
                    message: 'الرقم متاح مباشرة',
                    direct: true,
                });
            }

            // Check for existing pending request
            const { rows: existingRows } = await query(
                `SELECT id FROM call_requests 
         WHERE from_user_id = $1 AND to_user_id = $2 AND status = 'pending'`,
                [req.user.id, to_user_id]
            );
            if (existingRows.length > 0) {
                return res.status(400).json({ error: 'لديك طلب قائم بالفعل لهذا المستخدم' });
            }

            // Create call request
            const { rows } = await query(
                `INSERT INTO call_requests (from_user_id, to_user_id, job_post_id, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [req.user.id, to_user_id, job_post_id || null, message || null]
            );

            // Create notification for target user
            const fromName = req.user.name || 'مستخدم';
            await query(
                `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'call_request_received', $2, $3, $4)`,
                [
                    to_user_id,
                    'طلب اتصال جديد',
                    `يريد ${fromName} الاتصال بك`,
                    JSON.stringify({ call_request_id: rows[0].id, from_user_id: req.user.id }),
                ]
            );

            // Send SMS notification
            try {
                await sendSMS(target.phone, `شغل: لديك طلب اتصال جديد من ${fromName}. افتح التطبيق للرد.`);
            } catch (smsErr) {
                console.error('SMS failed:', smsErr);
            }

            res.status(201).json({ callRequest: rows[0] });
        } catch (err) {
            console.error('create call request error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

// GET /api/call-requests — List my call requests
router.get('/', auth, async (req, res) => {
    try {
        const { type = 'all' } = req.query;

        let whereClause = '(cr.from_user_id = $1 OR cr.to_user_id = $1)';
        if (type === 'incoming') whereClause = 'cr.to_user_id = $1';
        if (type === 'outgoing') whereClause = 'cr.from_user_id = $1';

        const { rows } = await query(
            `SELECT cr.*,
        fu.name as from_name, fu.phone_visibility as from_phone_vis,
        fu.avatar_url as from_avatar_url,
        tu.name as to_name, tu.phone_visibility as to_phone_vis,
        tu.avatar_url as to_avatar_url
       FROM call_requests cr
       JOIN users fu ON cr.from_user_id = fu.id
       JOIN users tu ON cr.to_user_id = tu.id
       WHERE ${whereClause}
       ORDER BY cr.created_at DESC
       LIMIT 50`,
            [req.user.id]
        );

        // Only include phone numbers for accepted requests
        const requests = rows.map(r => {
            const req_item = { ...r };
            if (r.status === 'accepted') {
                // The requester can see the target's phone
                // handled on accept
            }
            return req_item;
        });

        res.json({ requests });
    } catch (err) {
        console.error('list call requests error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/call-requests/:id/accept
router.put('/:id/accept', auth, async (req, res) => {
    try {
        const { rows } = await query(
            `UPDATE call_requests SET status = 'accepted', responded_at = NOW()
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING *`,
            [req.params.id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'الطلب غير موجود' });
        }

        const callRequest = rows[0];

        // Get the worker's phone to reveal to employer
        const { rows: workerRows } = await query(
            'SELECT phone, name FROM users WHERE id = $1', [req.user.id]
        );

        // Notify the requester
        const myName = workerRows[0].name || 'المستخدم';
        await query(
            `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'call_request_accepted', $2, $3, $4)`,
            [
                callRequest.from_user_id,
                'تم قبول طلب الاتصال',
                `قبل ${myName} طلب الاتصال. رقمه: ${workerRows[0].phone}`,
                JSON.stringify({ call_request_id: callRequest.id, phone: workerRows[0].phone }),
            ]
        );

        // SMS to requester
        try {
            const { rows: requesterRows } = await query(
                'SELECT phone FROM users WHERE id = $1', [callRequest.from_user_id]
            );
            await sendSMS(
                requesterRows[0].phone,
                `شغل: قبل ${myName} طلب الاتصال. رقمه: ${workerRows[0].phone}`
            );
        } catch (smsErr) {
            console.error('SMS failed:', smsErr);
        }

        res.json({
            message: 'تم قبول الطلب',
            callRequest: rows[0],
            phone: workerRows[0].phone,
        });
    } catch (err) {
        console.error('accept call request error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// PUT /api/call-requests/:id/reject
router.put('/:id/reject', auth, async (req, res) => {
    try {
        const { rows } = await query(
            `UPDATE call_requests SET status = 'rejected', responded_at = NOW()
       WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
       RETURNING *`,
            [req.params.id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'الطلب غير موجود' });
        }

        // Notify requester
        await query(
            `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'call_request_rejected', $2, $3, $4)`,
            [
                rows[0].from_user_id,
                'تم رفض طلب الاتصال',
                'تم رفض طلب الاتصال الخاص بك',
                JSON.stringify({ call_request_id: rows[0].id }),
            ]
        );

        res.json({ message: 'تم رفض الطلب' });
    } catch (err) {
        console.error('reject call request error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
