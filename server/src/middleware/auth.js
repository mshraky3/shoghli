const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

const auth = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'غير مصرح' });
        }

        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { rows } = await query('SELECT id, phone, role, name, onboarding_completed, employer_status FROM users WHERE id = $1', [decoded.userId]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'المستخدم غير موجود' });
        }

        req.user = rows[0];
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'انتهت صلاحية الجلسة' });
        }
        return res.status(401).json({ error: 'غير مصرح' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'غير مسموح' });
        }
        next();
    };
};

// Blocks employers whose account is not yet approved from marketplace actions.
// No-op for workers (and any non-employer), so worker flows are untouched.
const blockUnapprovedEmployer = (req, res, next) => {
    if (req.user && req.user.role === 'employer' && req.user.employer_status !== 'approved') {
        return res.status(403).json({
            error: 'حسابك قيد المراجعة. لا يمكنك استخدام هذه الميزة حتى تتم الموافقة على حسابك.',
            employer_status: req.user.employer_status || 'pending_payment',
        });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'غير مصرح' });
        }

        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'صلاحيات المدير مطلوبة' });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'انتهت صلاحية الجلسة' });
        }
        return res.status(401).json({ error: 'غير مصرح' });
    }
};

module.exports = { auth, requireRole, requireAdmin, blockUnapprovedEmployer };
