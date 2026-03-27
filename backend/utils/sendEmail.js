const sendEmail = async (options) => {
  try {
    // Many free hosting platforms (like Render) block or throttle outgoing SMTP (port 587/465).
    // Using the HTTP REST API is the permanent and most reliable solution.
    
    const apiKey = process.env.BREVO_API_KEY || process.env.EMAIL_PASS;
    const senderEmail = process.env.EMAIL_USER || "singhania9558@gmail.com";

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: "Sanjeevani", email: senderEmail },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: `<h2>${options.message}</h2>`
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Brevo HTTP API Error: ${response.status} - ${errorData}`);
    }

    console.log("✅ Email sent successfully via Brevo HTTP API");

  } catch (error) {
    console.error("❌ Email error:", error.message);
    throw error;
  }
};

module.exports = sendEmail;