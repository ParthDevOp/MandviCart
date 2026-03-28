import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. Create a transporter (Use a free Gmail account)
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME, // e.g., greencart.project@gmail.com
            pass: process.env.EMAIL_PASSWORD  // App Password from Google settings
        }
    });

    // 2. Define email options
    const mailOptions = {
        from: 'GreenCart Support <support@greencart.com>',
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    // 3. Send email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;