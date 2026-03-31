// Mock SMS provider for development
// Replace with Twilio/MessageBird in production

const sendSMS = async (phone, message) => {
    if (process.env.SMS_PROVIDER === 'mock') {
        console.log(`📱 [Mock SMS] To: ${phone} | Message: ${message}`);
        return { success: true, provider: 'mock' };
    }

    // Future: Twilio implementation
    // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    // await twilio.messages.create({ body: message, to: phone, from: process.env.TWILIO_FROM });

    throw new Error('SMS provider not configured');
};

module.exports = { sendSMS };
