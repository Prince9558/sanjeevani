require('dotenv').config();
const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const sendTestEmail = async () => {
  try {
    console.log("Email user:", process.env.EMAIL_USER);
    // Don't log the whole password for security, just check if it exists
    console.log("Email pass exists:", !!process.env.EMAIL_PASS);

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true,
      debug: true
    });

    const mailOptions = {
      from: `"Sanjeevani" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self for test
      subject: "Test Email from Brevo",
      html: `<h2>This is a test email</h2>`,
    };

    console.log("Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
};

sendTestEmail();
