const nodemailer = require('nodemailer');
const dns = require('dns');

// Fix for Render IPv6 ENETUNREACH issue
dns.setDefaultResultOrder('ipv4first');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 2525, // Using 2525 to bypass Render firewall restrictions on port 587
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000, // Fail fast instead of hanging "SENDING..." forever
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    const mailOptions = {
      from: `"Sanjeevani" <singhania9558@gmail.com>`,
      to: options.email,
      subject: options.subject,
      html: `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.5;">${options.message}</div>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent via Nodemailer (Port 2525)");

  } catch (error) {
    console.error("❌ Email error:", error.message || error);
    throw error;
  }
};

module.exports = sendEmail;