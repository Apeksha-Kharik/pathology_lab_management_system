const nodemailer = require("nodemailer");

const getMailConfig = () => {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  return {
    host,
    port,
    secure: process.env.EMAIL_SECURE === "true",
    user,
    pass,
    from
  };
};

const hasMailConfig = () => {
  const config = getMailConfig();
  return Boolean(config.user && config.pass && config.from);
};

const createTransporter = () => {
  const config = getMailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
};

const verifyTransporter = async () => {
  if (!hasMailConfig()) {
    console.log("Email configuration is missing.");
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("SMTP server connected successfully");
  } catch (error) {
    console.log("SMTP connection failed");
    console.log(error.message);
  }
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!hasMailConfig()) {
    console.log("Email configuration not found.");
    return {
      sent: false
    };
  }

  try {
    const config = getMailConfig();
    const transporter = createTransporter();

    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html
    });

    console.log(`Email sent successfully to ${to}`);

    return {
      sent: true
    };
  } catch (error) {
    console.log("Failed to send email");
    console.log(error.message);

    return {
      sent: false,
      error: error.message
    };
  }
};

const sendOtpEmail = async ({ to, subject, otp }) => {
  if (!hasMailConfig()) {
    throw new Error("Email service is not configured");
  }

  const result = await sendEmail({
    to,
    subject,
    text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
    `
  });

  if (!result.sent) {
    throw new Error("Unable to send OTP email");
  }

  return result;
};

module.exports = {
  sendOtpEmail,
  sendEmail,
  verifyTransporter
};
