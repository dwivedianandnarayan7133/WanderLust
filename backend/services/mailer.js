const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
    }
    return transporter;
};

exports.sendEmail = async ({ to, subject, text }) => {
    const mailTransport = getTransporter();
    if (!mailTransport || !to) {
        console.info("Email not sent: configure SMTP settings and a recipient address.");
        return false;
    }

    await mailTransport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
    });
    return true;
};