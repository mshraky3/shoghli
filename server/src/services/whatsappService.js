/**
 * Meta WhatsApp Cloud API – Official WhatsApp Business API
 *
 * Required environment variables (set in Vercel dashboard):
 *   META_WHATSAPP_TOKEN    — Permanent System User access token
 *   META_PHONE_NUMBER_ID   — Phone Number ID from the WhatsApp app settings
 *   META_TEMPLATE_NAME     — Template name you created (default: shoghli_otp)
 *   META_TEMPLATE_LANG     — Template language code (default: ar)
 *
 * Pricing for Syria (+963): $0.0077 per authentication message
 */

const META_API_VERSION = 'v21.0';

async function sendWhatsAppOtp(phone, otp) {
    const token        = process.env.META_WHATSAPP_TOKEN;
    const phoneNumId   = process.env.META_PHONE_NUMBER_ID;
    const templateName = process.env.META_TEMPLATE_NAME || 'shoghli_otp';
    const templateLang = process.env.META_TEMPLATE_LANG || 'ar';

    if (!token || !phoneNumId) {
        throw new Error('META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID must be set in environment');
    }

    // Strip non-digits — Meta requires E.164 without the "+" (e.g. 963912345678)
    const to = phone.replace(/\D/g, '');

    const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumId}/messages`;

    /**
     * Template components:
     *  - "body"      → passes the OTP as {{1}} in the template text
     *  - "button"    → fills the COPY_CODE button so the user can tap to copy
     *
     * If your template has NO button, delete the second object from components[].
     * If your template has a URL button instead, change sub_type to "url".
     */
    const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
            name: templateName,
            language: { code: templateLang },
            components: [
                {
                    type: 'body',
                    parameters: [{ type: 'text', text: otp }],
                },
                {
                    type: 'button',
                    sub_type: 'copy_code',
                    index: '0',
                    parameters: [{ type: 'payload', payload: otp }],
                },
            ],
        },
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Meta WhatsApp API ${res.status}: ${text}`);
    }

    return res.json();
}

module.exports = { sendWhatsAppOtp };

