// Stub SMS service — replace with actual provider (Twilio, etc.) when ready
async function sendSMS(phone, message) {
    console.log(`[SMS stub] To: ${phone}, Message: ${message}`);
}

module.exports = { sendSMS };
