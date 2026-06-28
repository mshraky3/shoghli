const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');
const { normalizePaymentScreenshot } = require('../services/imageModeration');

const router = express.Router();

// GET /api/employer-applications/me — own application (or null)
router.get('/me', auth, requireRole('employer'), async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT id, status, rejection_reason, payment_screenshot, created_at, updated_at, reviewed_at
             FROM employer_applications WHERE user_id = $1`,
            [req.user.id]
        );
        res.json({ application: rows[0] || null, employer_status: req.user.employer_status });
    } catch (err) {
        console.error('get employer application error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// POST /api/employer-applications — submit/resubmit payment screenshot
router.post('/', auth, requireRole('employer'),
    body('screenshot').isString().isLength({ min: 50 }).withMessage('صورة الإيصال مطلوبة'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: errors.array()[0].msg });
            }

            // Only allow (re)submission while not already under review or approved.
            if (req.user.employer_status === 'pending_review') {
                return res.status(409).json({ error: 'طلبك قيد المراجعة بالفعل' });
            }
            if (req.user.employer_status === 'approved') {
                return res.status(409).json({ error: 'تمت الموافقة على حسابك بالفعل' });
            }

            const { screenshot, company_name } = req.body;
            const result = await normalizePaymentScreenshot(screenshot);
            if (!result.ok) {
                return res.status(400).json({ error: result.error });
            }

            await query(
                `INSERT INTO employer_applications (user_id, payment_screenshot, status, rejection_reason, reviewed_by, reviewed_at, updated_at)
                 VALUES ($1, $2, 'pending_review', NULL, NULL, NULL, NOW())
                 ON CONFLICT (user_id) DO UPDATE SET
                    payment_screenshot = EXCLUDED.payment_screenshot,
                    status = 'pending_review',
                    rejection_reason = NULL,
                    reviewed_by = NULL,
                    reviewed_at = NULL,
                    updated_at = NOW()`,
                [req.user.id, result.imageDataUrl]
            );

            await query(
                "UPDATE users SET employer_status = 'pending_review', updated_at = NOW() WHERE id = $1",
                [req.user.id]
            );

            if (company_name !== undefined) {
                await query(
                    'UPDATE employer_profiles SET company_name = $1, updated_at = NOW() WHERE user_id = $2',
                    [company_name ? String(company_name).substring(0, 100) : null, req.user.id]
                );
            }

            res.status(201).json({ message: 'تم استلام طلبك وهو قيد المراجعة', employer_status: 'pending_review' });
        } catch (err) {
            console.error('submit employer application error:', err);
            res.status(500).json({ error: 'حدث خطأ في الخادم' });
        }
    }
);

module.exports = router;
