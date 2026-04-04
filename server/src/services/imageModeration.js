const sharp = require('sharp');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MIN_SIDE = 96;

function parseDataUrl(dataUrl) {
    if (typeof dataUrl !== 'string') return null;
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) return null;
    const mime = match[1].toLowerCase();
    const base64 = match[2].replace(/\s+/g, '');
    return { mime, base64 };
}

function skinLikePixel(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    const rgbRule = (
        r > 95 && g > 40 && b > 20 &&
        max - min > 15 &&
        Math.abs(r - g) > 15 &&
        r > g &&
        r > b
    );

    const yCbCrCb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const yCbCrCr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    const ycbcrRule = yCbCrCb >= 77 && yCbCrCb <= 127 && yCbCrCr >= 133 && yCbCrCr <= 173;

    return rgbRule && ycbcrRule;
}

function getNudityRisk(rawBuffer) {
    const channels = 3;
    const totalPixels = Math.floor(rawBuffer.length / channels);
    if (!totalPixels) return { ratio: 0, risk: 'low' };

    let skinPixels = 0;

    for (let i = 0; i < rawBuffer.length; i += channels) {
        if (skinLikePixel(rawBuffer[i], rawBuffer[i + 1], rawBuffer[i + 2])) {
            skinPixels += 1;
        }
    }

    const ratio = skinPixels / totalPixels;

    if (ratio >= 0.7) return { ratio, risk: 'high' };
    if (ratio >= 0.55) return { ratio, risk: 'medium' };
    return { ratio, risk: 'low' };
}

async function moderateAndNormalizeAvatar(dataUrl) {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
        return { ok: false, error: 'صيغة الصورة غير صحيحة' };
    }

    if (!ALLOWED_MIME.has(parsed.mime)) {
        return { ok: false, error: 'الأنواع المسموحة: JPG, PNG, WEBP' };
    }

    const inputBuffer = Buffer.from(parsed.base64, 'base64');

    if (inputBuffer.length > MAX_UPLOAD_BYTES) {
        return { ok: false, error: 'حجم الصورة كبير جداً (الحد 2MB)' };
    }

    let image;
    try {
        image = sharp(inputBuffer, { failOn: 'error' });
    } catch (_err) {
        return { ok: false, error: 'ملف الصورة تالف أو غير مدعوم' };
    }

    const metadata = await image.metadata().catch(() => null);
    if (!metadata || !metadata.width || !metadata.height) {
        return { ok: false, error: 'تعذر قراءة الصورة' };
    }

    if (metadata.width < MIN_SIDE || metadata.height < MIN_SIDE) {
        return { ok: false, error: 'الصورة صغيرة جداً' };
    }

    const probe = await image
        .resize(256, 256, { fit: 'cover' })
        .removeAlpha()
        .raw()
        .toBuffer()
        .catch(() => null);

    if (!probe) {
        return { ok: false, error: 'تعذر فحص الصورة' };
    }

    const nudity = getNudityRisk(probe);
    if (nudity.risk === 'high') {
        return { ok: false, error: 'تم رفض الصورة لمخالفة سياسة المحتوى الآمن' };
    }

    const normalizedBuffer = await sharp(inputBuffer)
        .rotate()
        .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer()
        .catch(() => null);

    if (!normalizedBuffer) {
        return { ok: false, error: 'تعذر معالجة الصورة' };
    }

    const normalizedDataUrl = `data:image/jpeg;base64,${normalizedBuffer.toString('base64')}`;

    return {
        ok: true,
        imageDataUrl: normalizedDataUrl,
        moderation: {
            nudityRisk: nudity.risk,
            skinRatio: Number(nudity.ratio.toFixed(4)),
        },
    };
}

module.exports = {
    moderateAndNormalizeAvatar,
};
