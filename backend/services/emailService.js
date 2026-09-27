const nodemailer = require("nodemailer");

const getMailConfig = () => {
  const host = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM?.trim() || user;

  return {
    host,
    port,
    secure: process.env.EMAIL_SECURE === undefined ? port === 465 : process.env.EMAIL_SECURE === "true",
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
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
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

    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html
    });

    const acceptedCount = info.accepted?.length || 0;
    const rejectedCount = info.rejected?.length || 0;
    // SMTP acceptance is not proof of delivery to the recipient's inbox.
    const sent = acceptedCount > 0 && rejectedCount === 0;
    console.log("Email SMTP result:", {
      acceptedCount,
      rejectedCount,
      messageId: info.messageId || null,
      status: sent ? "accepted; inbox delivery not confirmed" : "recipient acceptance failed"
    });

    return {
      sent,
      messageId: info.messageId,
      ...(sent ? {} : { error: "SMTP did not accept all recipients" })
    };
  } catch (error) {
    console.log("Failed to send email");
    console.log(error.message);

    return {
      sent: false,
      error: error.message,
      code: error.code,
      responseCode: error.responseCode
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
    const error = new Error("Unable to send OTP email");
    error.code = result.code || "EMAIL_NOT_ACCEPTED";
    error.responseCode = result.responseCode;
    throw error;
  }

  return result;
};

module.exports = {
  sendOtpEmail,
  sendEmail,
  verifyTransporter
};
