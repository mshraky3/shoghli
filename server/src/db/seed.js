require('dotenv').config();

const { pool } = require('./pool');

const categories = [
    { name_ar: 'كهربائي', icon: 'zap', sort_order: 1 },
    { name_ar: 'سباك', icon: 'droplets', sort_order: 2 },
    { name_ar: 'نقل أثاث', icon: 'truck', sort_order: 3 },
    { name_ar: 'طبيب', icon: 'heart-pulse', sort_order: 4 },
    { name_ar: 'سائق', icon: 'car', sort_order: 5 },
    { name_ar: 'نجار', icon: 'hammer', sort_order: 6 },
    { name_ar: 'دهان', icon: 'paintbrush', sort_order: 7 },
    { name_ar: 'تنظيف', icon: 'sparkles', sort_order: 8 },
    { name_ar: 'بناء', icon: 'building', sort_order: 9 },
    { name_ar: 'حداد', icon: 'anvil', sort_order: 10 },
    { name_ar: 'ميكانيكي', icon: 'wrench', sort_order: 11 },
    { name_ar: 'مزارع', icon: 'wheat', sort_order: 12 },
    { name_ar: 'طباخ', icon: 'chef-hat', sort_order: 13 },
    { name_ar: 'خياط', icon: 'scissors', sort_order: 14 },
    { name_ar: 'حلاق', icon: 'scissors', sort_order: 15 },
    { name_ar: 'أعمال عامة', icon: 'briefcase', sort_order: 16 },
];

// Syria Governorates with approximate center coordinates
const governorates = [
    { name_ar: 'دمشق', lat: 33.5138, lng: 36.2765 },
    { name_ar: 'ريف دمشق', lat: 33.5, lng: 36.4 },
    { name_ar: 'حلب', lat: 36.2021, lng: 37.1343 },
    { name_ar: 'حمص', lat: 34.7325, lng: 36.7106 },
    { name_ar: 'حماة', lat: 35.1318, lng: 36.7514 },
    { name_ar: 'اللاذقية', lat: 35.5317, lng: 35.7910 },
    { name_ar: 'طرطوس', lat: 34.8869, lng: 35.8866 },
    { name_ar: 'إدلب', lat: 35.9306, lng: 36.6339 },
    { name_ar: 'الرقة', lat: 35.9528, lng: 39.0103 },
    { name_ar: 'دير الزور', lat: 35.3359, lng: 40.1408 },
    { name_ar: 'الحسكة', lat: 36.5067, lng: 40.7440 },
    { name_ar: 'درعا', lat: 32.6189, lng: 36.1021 },
    { name_ar: 'السويداء', lat: 32.7128, lng: 36.5664 },
    { name_ar: 'القنيطرة', lat: 33.1257, lng: 35.8244 },
];

// Key districts for each governorate
const districts = [
    // دمشق (no districts, it's a city)
    { gov: 'دمشق', name_ar: 'مدينة دمشق', lat: 33.5138, lng: 36.2765 },
    // ريف دمشق
    { gov: 'ريف دمشق', name_ar: 'التل', lat: 33.6103, lng: 36.3100 },
    { gov: 'ريف دمشق', name_ar: 'دوما', lat: 33.5713, lng: 36.4019 },
    { gov: 'ريف دمشق', name_ar: 'الزبداني', lat: 33.7264, lng: 36.0991 },
    { gov: 'ريف دمشق', name_ar: 'النبك', lat: 34.0183, lng: 36.7317 },
    { gov: 'ريف دمشق', name_ar: 'قطنا', lat: 33.4367, lng: 36.0778 },
    { gov: 'ريف دمشق', name_ar: 'داريا', lat: 33.4597, lng: 36.2389 },
    // حلب
    { gov: 'حلب', name_ar: 'مدينة حلب', lat: 36.2021, lng: 37.1343 },
    { gov: 'حلب', name_ar: 'إعزاز', lat: 36.5867, lng: 37.0489 },
    { gov: 'حلب', name_ar: 'الباب', lat: 36.3714, lng: 37.5156 },
    { gov: 'حلب', name_ar: 'منبج', lat: 36.5283, lng: 37.9547 },
    { gov: 'حلب', name_ar: 'عفرين', lat: 36.5122, lng: 36.8694 },
    { gov: 'حلب', name_ar: 'جرابلس', lat: 36.8178, lng: 38.0114 },
    { gov: 'حلب', name_ar: 'عين العرب', lat: 36.8911, lng: 38.3492 },
    // حمص
    { gov: 'حمص', name_ar: 'مدينة حمص', lat: 34.7325, lng: 36.7106 },
    { gov: 'حمص', name_ar: 'تلكلخ', lat: 34.6731, lng: 36.2594 },
    { gov: 'حمص', name_ar: 'الرستن', lat: 34.9275, lng: 36.7306 },
    { gov: 'حمص', name_ar: 'تدمر', lat: 34.5503, lng: 38.2683 },
    { gov: 'حمص', name_ar: 'القصير', lat: 34.5089, lng: 36.5794 },
    // حماة
    { gov: 'حماة', name_ar: 'مدينة حماة', lat: 35.1318, lng: 36.7514 },
    { gov: 'حماة', name_ar: 'محردة', lat: 35.2456, lng: 36.5719 },
    { gov: 'حماة', name_ar: 'السلمية', lat: 35.0131, lng: 37.0500 },
    { gov: 'حماة', name_ar: 'مصياف', lat: 35.0647, lng: 36.3408 },
    // اللاذقية
    { gov: 'اللاذقية', name_ar: 'مدينة اللاذقية', lat: 35.5317, lng: 35.7910 },
    { gov: 'اللاذقية', name_ar: 'جبلة', lat: 35.3614, lng: 35.9244 },
    { gov: 'اللاذقية', name_ar: 'الحفة', lat: 35.5969, lng: 36.0383 },
    { gov: 'اللاذقية', name_ar: 'القرداحة', lat: 35.4508, lng: 36.0650 },
    // طرطوس
    { gov: 'طرطوس', name_ar: 'مدينة طرطوس', lat: 34.8869, lng: 35.8866 },
    { gov: 'طرطوس', name_ar: 'بانياس', lat: 35.1825, lng: 35.9506 },
    { gov: 'طرطوس', name_ar: 'صافيتا', lat: 34.8189, lng: 36.1181 },
    { gov: 'طرطوس', name_ar: 'الدريكيش', lat: 34.8936, lng: 36.1436 },
    // إدلب
    { gov: 'إدلب', name_ar: 'مدينة إدلب', lat: 35.9306, lng: 36.6339 },
    { gov: 'إدلب', name_ar: 'معرة النعمان', lat: 35.6467, lng: 36.6750 },
    { gov: 'إدلب', name_ar: 'جسر الشغور', lat: 35.8103, lng: 36.3167 },
    { gov: 'إدلب', name_ar: 'أريحا', lat: 35.8144, lng: 36.6061 },
    { gov: 'إدلب', name_ar: 'حارم', lat: 36.2078, lng: 36.5144 },
    // الرقة
    { gov: 'الرقة', name_ar: 'مدينة الرقة', lat: 35.9528, lng: 39.0103 },
    { gov: 'الرقة', name_ar: 'الثورة', lat: 35.8311, lng: 38.5469 },
    { gov: 'الرقة', name_ar: 'تل أبيض', lat: 36.6975, lng: 38.9569 },
    // دير الزور
    { gov: 'دير الزور', name_ar: 'مدينة دير الزور', lat: 35.3359, lng: 40.1408 },
    { gov: 'دير الزور', name_ar: 'الميادين', lat: 35.0186, lng: 40.4522 },
    { gov: 'دير الزور', name_ar: 'البوكمال', lat: 34.4600, lng: 40.9175 },
    // الحسكة
    { gov: 'الحسكة', name_ar: 'مدينة الحسكة', lat: 36.5067, lng: 40.7440 },
    { gov: 'الحسكة', name_ar: 'القامشلي', lat: 37.0567, lng: 41.2161 },
    { gov: 'الحسكة', name_ar: 'المالكية', lat: 37.1667, lng: 42.1333 },
    { gov: 'الحسكة', name_ar: 'رأس العين', lat: 36.8400, lng: 40.0653 },
    // درعا
    { gov: 'درعا', name_ar: 'مدينة درعا', lat: 32.6189, lng: 36.1021 },
    { gov: 'درعا', name_ar: 'إزرع', lat: 32.8478, lng: 36.2458 },
    { gov: 'درعا', name_ar: 'الصنمين', lat: 33.0694, lng: 36.1842 },
    // السويداء
    { gov: 'السويداء', name_ar: 'مدينة السويداء', lat: 32.7128, lng: 36.5664 },
    { gov: 'السويداء', name_ar: 'شهبا', lat: 32.8553, lng: 36.6292 },
    { gov: 'السويداء', name_ar: 'صلخد', lat: 32.4917, lng: 36.7117 },
    // القنيطرة
    { gov: 'القنيطرة', name_ar: 'مدينة القنيطرة', lat: 33.1257, lng: 35.8244 },
    { gov: 'القنيطرة', name_ar: 'فيق', lat: 32.7833, lng: 35.8000 },
];

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Seed admin
        console.log('🌱 Seeding admin user...');
        const bcrypt = require('bcryptjs');
        const adminHash = await bcrypt.hash('admin1810', 10);
        await client.query(
            `INSERT INTO admins (username, password_hash) 
             VALUES ($1, $2)
             ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
            ['admin1810', adminHash]
        );
        console.log('✅ Admin user seeded');

        // Seed categories
        console.log('🌱 Seeding job categories...');
        for (const cat of categories) {
            await client.query(
                `INSERT INTO job_categories (name_ar, icon, sort_order) 
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
                [cat.name_ar, cat.icon, cat.sort_order]
            );
        }
        console.log(`✅ ${categories.length} categories seeded`);

        // Seed governorates
        console.log('🌱 Seeding governorates...');
        const govMap = {};
        for (const gov of governorates) {
            const { rows } = await client.query(
                `INSERT INTO governorates (name_ar, center_lat, center_lng) 
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING id`,
                [gov.name_ar, gov.lat, gov.lng]
            );
            if (rows.length > 0) {
                govMap[gov.name_ar] = rows[0].id;
            } else {
                const existing = await client.query(
                    'SELECT id FROM governorates WHERE name_ar = $1', [gov.name_ar]
                );
                govMap[gov.name_ar] = existing.rows[0].id;
            }
        }
        console.log(`✅ ${governorates.length} governorates seeded`);

        // Seed districts
        console.log('🌱 Seeding districts...');
        for (const dist of districts) {
            const govId = govMap[dist.gov];
            if (!govId) {
                console.warn(`⚠️  Gov not found for district: ${dist.name_ar}`);
                continue;
            }
            await client.query(
                `INSERT INTO districts (governorate_id, name_ar, center_lat, center_lng) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
                [govId, dist.name_ar, dist.lat, dist.lng]
            );
        }
        console.log(`✅ ${districts.length} districts seeded`);

        await client.query('COMMIT');
        console.log('\n🎉 All seeds complete!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
