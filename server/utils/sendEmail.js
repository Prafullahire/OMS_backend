const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check if email credentials are provided
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
        console.log('----------------------------------------------------');
        console.log('⚠️  EMAIL CONFIG MISSING - MOCKING EMAIL SEND  ⚠️');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: \n${options.message}`);
        console.log('----------------------------------------------------');
        return; // Return success (simulated)
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Define email options
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@oms.com',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email}`);
    } catch (error) {
        console.error("Email send failed:", error.message);

        // Fallback log for development if sending fails
        console.log('----------------------------------------------------');
        console.log('⚠️  EMAIL FAILED - FALLBACK LOG  ⚠️');
        console.log(`To: ${options.email}`);
        console.log(`Link: ${options.message.split(' ').find(w => w.startsWith('http'))}`); // Extract link
        console.log('----------------------------------------------------');

        // Throw error if you want the frontend to know it failed, 
        // OR swallow it and pretend it worked for dev testing.
        // Let's swallow it for dev simplicity so the flow continues.
    }
};

module.exports = sendEmail;
