const sendSMS = async (phone, message) => {
    const provider = process.env.SMS_PROVIDER || 'mock';

    if (provider === 'mock' || provider === 'test') {
        console.log(`📱 [${provider} SMS] To: ${phone} | Message: ${message}`);
        return { success: true, provider };
    }

    throw new Error(`SMS provider "${provider}" is not supported. Use Firebase for authentication and keep SMS_PROVIDER as mock or test.`);
};

module.exports = { sendSMS };
