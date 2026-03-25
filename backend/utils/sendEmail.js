const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or use host and port for other providers
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Food Value Platform" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.htmlMessage // You can use HTML templates if needed
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
