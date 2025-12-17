const sendSMS = async (options) => {
    // This is a placeholder for an SMS service (like Twilio)
    // For development, we just log the OTP to the console.

    if (process.env.SMS_SID && process.env.SMS_AUTH_TOKEN) {
        // Implementation for real SMS provider would go here
        // const client = require('twilio')(process.env.SMS_SID, process.env.SMS_AUTH_TOKEN);
        // await client.messages.create({...});
    }

    console.log('----------------------------------------------------');
    console.log('📱  SMS MOCK  📱');
    console.log(`To: ${options.phoneNumber}`);
    console.log(`Message: ${options.message}`);
    console.log('----------------------------------------------------');
};

module.exports = sendSMS;
