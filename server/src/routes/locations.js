const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

// GET /api/locations/governorates
router.get('/governorates', async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id, name_ar, center_lat, center_lng FROM governorates ORDER BY name_ar'
        );
        res.json({ governorates: rows });
    } catch (err) {
        console.error('get governorates error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/locations/districts
router.get('/districts', async (req, res) => {
    try {
        const { governorate_id } = req.query;
        let sql = 'SELECT id, governorate_id, name_ar, center_lat, center_lng FROM districts';
        const params = [];

        if (governorate_id) {
            sql += ' WHERE governorate_id = $1';
            params.push(parseInt(governorate_id));
        }

        sql += ' ORDER BY name_ar';
        const { rows } = await query(sql, params);
        res.json({ districts: rows });
    } catch (err) {
        console.error('get districts error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/locations/subdistricts
router.get('/subdistricts', async (req, res) => {
    try {
        const { district_id } = req.query;
        let sql = 'SELECT id, district_id, name_ar, center_lat, center_lng FROM subdistricts';
        const params = [];

        if (district_id) {
            sql += ' WHERE district_id = $1';
            params.push(parseInt(district_id));
        }

        sql += ' ORDER BY name_ar';
        const { rows } = await query(sql, params);
        res.json({ subdistricts: rows });
    } catch (err) {
        console.error('get subdistricts error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/locations/villages
router.get('/villages', async (req, res) => {
    try {
        const { subdistrict_id } = req.query;
        let sql = 'SELECT id, subdistrict_id, name_ar, lat, lng FROM villages';
        const params = [];

        if (subdistrict_id) {
            sql += ' WHERE subdistrict_id = $1';
            params.push(parseInt(subdistrict_id));
        }

        sql += ' ORDER BY name_ar';
        const { rows } = await query(sql, params);
        res.json({ villages: rows });
    } catch (err) {
        console.error('get villages error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/locations/reverse-geocode — Find location from coordinates
router.get('/reverse-geocode', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'الإحداثيات مطلوبة' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        // Find nearest district using Haversine
        const { rows: distRows } = await query(
            `SELECT d.id as district_id, d.name_ar as district_name, 
        d.governorate_id,
        g.name_ar as governorate_name,
        (6371 * acos(
          cos(radians($1)) * cos(radians(d.center_lat)) * cos(radians(d.center_lng) - radians($2)) +
          sin(radians($1)) * sin(radians(d.center_lat))
        )) as distance_km
       FROM districts d
       JOIN governorates g ON d.governorate_id = g.id
       ORDER BY distance_km ASC
       LIMIT 1`,
            [userLat, userLng]
        );

        if (distRows.length === 0) {
            return res.status(404).json({ error: 'لم يتم العثور على موقع' });
        }

        const result = distRows[0];

        // Try to find nearest village
        const { rows: villageRows } = await query(
            `SELECT v.id as village_id, v.name_ar as village_name,
        s.id as subdistrict_id, s.name_ar as subdistrict_name,
        (6371 * acos(
          cos(radians($1)) * cos(radians(v.lat)) * cos(radians(v.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(v.lat))
        )) as distance_km
       FROM villages v
       JOIN subdistricts s ON v.subdistrict_id = s.id
       WHERE v.lat IS NOT NULL AND v.lng IS NOT NULL
       ORDER BY distance_km ASC
       LIMIT 1`,
            [userLat, userLng]
        );

        const location = {
            governorate_id: result.governorate_id,
            governorate_name: result.governorate_name,
            district_id: result.district_id,
            district_name: result.district_name,
            subdistrict_id: villageRows.length > 0 ? villageRows[0].subdistrict_id : null,
            subdistrict_name: villageRows.length > 0 ? villageRows[0].subdistrict_name : null,
            village_id: villageRows.length > 0 ? villageRows[0].village_id : null,
            village_name: villageRows.length > 0 ? villageRows[0].village_name : null,
        };

        res.json({ location });
    } catch (err) {
        console.error('reverse geocode error:', err);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// GET /api/categories
router.get('/categories', async (req, res) => {
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
