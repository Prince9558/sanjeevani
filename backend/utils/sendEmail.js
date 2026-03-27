const nodemailer = require('nodemailer');
const dns = require('dns');

// Fix for Render IPv6 ENETUNREACH issue
dns.setDefaultResultOrder('ipv4first');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Sanjeevani" <singhania9558@gmail.com>`,
      to: options.email,
      subject: options.subject,
      html: `<h2>${options.message}</h2>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent via Nodemailer");

  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};

module.exports = sendEmail;