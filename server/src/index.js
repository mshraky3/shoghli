require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workerRoutes = require('./routes/workers');
const jobRoutes = require('./routes/jobs');
const callRequestRoutes = require('./routes/callRequests');
const notificationRoutes = require('./routes/notifications');
const locationRoutes = require('./routes/locations');
const categoryRoutes = require('./routes/categories');

const app = express();

// Diagnostic logging — visible in Vercel function logs
console.log('[boot] NODE_ENV:', process.env.NODE_ENV);
console.log('[boot] VERCEL:', process.env.VERCEL);
console.log('[boot] CLIENT_URL:', process.env.CLIENT_URL);
console.log('[boot] DB_HOST:', process.env.DATABASE_HOST ? process.env.DATABASE_HOST.slice(0, 20) + '...' : 'NOT SET');
console.log('[boot] JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('[boot] SMS_PROVIDER:', process.env.SMS_PROVIDER);

// Request logging
app.use((req, _res, next) => {
    console.log(`[req] ${req.method} ${req.path} — origin: ${req.headers.origin || '-'}`);
    next();
});

// Security
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: { error: 'تم تجاوز الحد الأقصى للطلبات. حاول لاحقاً.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/call-requests', callRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/categories', categoryRoutes);

// Root + health check
app.get('/', (req, res) => {
    res.json({
        name: 'شغلي API',
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        db_host: process.env.DATABASE_HOST ? 'configured' : 'missing',
        jwt: process.env.JWT_SECRET ? 'configured' : 'missing',
        sms: process.env.SMS_PROVIDER || 'not set',
        client_url: process.env.CLIENT_URL || 'not set',
    });
});

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'المسار غير موجود' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

// Start server (only when not in serverless mode)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 شغل API running on port ${PORT}`);
    });
}

module.exports = app;
