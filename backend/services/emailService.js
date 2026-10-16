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

const getMailProvider = () => process.env.EMAIL_PROVIDER?.trim().toLowerCase() || (process.env.RESEND_API_KEY?.trim() ? "resend" : "smtp");

const hasMailConfig = () => {
  if (getMailProvider() === "resend") return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
  if (getMailProvider() !== "smtp") return false;
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

  if (getMailProvider() === "resend") {
    console.log("HTTPS email provider configured (send acceptance checked when sending)");
    return;
  }
  if (process.env.RENDER && [25, 465, 587].includes(getMailConfig().port)) {
    console.warn("SMTP ports are blocked on Render Free instances. Use EMAIL_PROVIDER=resend, RESEND_API_KEY and a verified EMAIL_FROM, or a paid instance supporting SMTP.");
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

const sendResendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM.trim(), to: Array.isArray(to) ? to : [to], subject, text, html,
        ...(attachments.length ? { attachments: attachments.map(({ filename, content }) => ({ filename, content: Buffer.isBuffer(content) ? content.toString("base64") : content })) } : {}) }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    if (!response.ok || !data.id) {
      console.error("HTTPS email rejected:", { status: response.status, code: data.name || "EMAIL_NOT_ACCEPTED" });
      return { sent: false, error: "Email provider rejected the request", code: data.name || "EMAIL_NOT_ACCEPTED", responseCode: response.status };
    }
    console.log("HTTPS email accepted; inbox delivery not confirmed:", data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error("HTTPS email request failed:", error.name);
    return { sent: false, error: "Email provider request failed", code: error.name === "TimeoutError" ? "ETIMEDOUT" : "EMAIL_API_ERROR" };
  }
};

const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  if (!hasMailConfig()) {
    console.log("Email configuration not found.");
    return {
      sent: false
    };
  }

  if (getMailProvider() === "resend") return sendResendEmail({ to, subject, text, html, attachments });

  try {
    const config = getMailConfig();
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
      attachments
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
    throw Object.assign(new Error("Email service is not configured"), { code: "EMAIL_NOT_CONFIGURED" });
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
