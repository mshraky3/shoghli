const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: {
    user: 'alshrakynodeapp@gmail.com',
    pass: 'ssjpnctdsyqxylxd',
  },
});

const FROM = '"شغلي" <alshrakynodeapp@gmail.com>';

const sendEmail = async (to, subject, text, html = null) => {
  return transporter.sendMail({ from: FROM, to, subject, text, html });
};

const sendWelcomeEmail = async (to, name) => {
  const displayName = name || 'بك';
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:36px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:32px;letter-spacing:1px;">شغلي</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">منصة العمل في سوريا</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <h2 style="color:#1e293b;margin:0 0 14px;font-size:22px;">مرحباً ${displayName}! 👋</h2>
            <p style="color:#475569;line-height:1.8;margin:0 0 24px;font-size:15px;">
              تم إنشاء حسابك في منصة <strong>شغلي</strong> بنجاح.<br>
              يمكنك الآن تسجيل الدخول وإكمال إعداد ملفك الشخصي والبدء في استخدام المنصة.
            </p>
            <p style="color:#94a3b8;font-size:12px;margin:0;padding-top:20px;border-top:1px solid #e2e8f0;">
              شغلي — منصة العمل في سوريا &nbsp;|&nbsp; هذا البريد أُرسل تلقائياً، لا تردّ عليه.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return sendEmail(
    to,
    'مرحباً بك في شغلي 🎉',
    `مرحباً ${displayName}، تم إنشاء حسابك في شغلي بنجاح. سجّل دخولك وابدأ الآن.`,
    html
  );
};

const sendOtpEmail = async (to, otp) => {
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:36px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:32px;letter-spacing:1px;">شغلي</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">منصة العمل في سوريا</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;text-align:center;">
            <h2 style="color:#1e293b;margin:0 0 14px;font-size:22px;">رمز التحقق</h2>
            <p style="color:#475569;line-height:1.8;margin:0 0 24px;font-size:15px;">
              استخدم الرمز التالي لإتمام إنشاء حسابك في <strong>شغلي</strong>.<br>
              صالح لمدة 5 دقائق فقط.
            </p>
            <div style="background:#f1f5f9;border-radius:12px;padding:20px 40px;display:inline-block;margin:0 0 24px;">
              <span style="font-size:42px;font-weight:800;letter-spacing:16px;color:#2563eb;font-family:monospace;">${otp}</span>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin:0;padding-top:20px;border-top:1px solid #e2e8f0;">
              إذا لم تطلب إنشاء حساب، تجاهل هذا البريد. شغلي — منصة العمل في سوريا.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return sendEmail(
    to,
    'رمز التحقق لشغلي 🔐',
    `رمز التحقق الخاص بك: ${otp} (صالح 5 دقائق)`,
    html
  );
};

module.exports = { sendEmail, sendWelcomeEmail, sendOtpEmail };
