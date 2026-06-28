const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

// GET /api/settings/payment — public payment instructions (Sham Cash number + fee)
router.get('/payment', async (req, res) => {
    try {
        const { rows } = await query(
            "SELECT key, value FROM app_settings WHERE key IN ('sham_cash_phone', 'employer_fee_amount', 'employer_fee_currency')"
        );
        const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
        res.json({
            sham_cash_phone: map.sham_cash_phone || '',
            employer_fee_amount: map.employer_fee_amount || '0',
            employer_fee_currency: map.employer_fee_currency || 'SYP',
        });
    } catch (err) {
        console.error('get payment settings error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
