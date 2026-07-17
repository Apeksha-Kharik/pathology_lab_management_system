const nodemailer = require("nodemailer");

const hasMailConfig = () => {
  return Boolean(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const verifyTransporter = async () => {
  if (!hasMailConfig()) {
    console.log("❌ Email configuration is missing.");
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ SMTP Server Connected Successfully");
  } catch (error) {
    console.log("❌ SMTP Connection Failed");
    console.log(error.message);
  }
};

const sendOtpEmail = async ({ to, subject, otp }) => {
  if (!hasMailConfig()) {
    console.log("❌ Email configuration not found.");
    console.log(`OTP for ${to}: ${otp}`);
    return {
      sent: false,
      devOtp: otp
    };
  }

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
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

    console.log(`✅ OTP sent successfully to ${to}`);

    return {
      sent: true
    };

  } catch (error) {

    console.log("❌ Failed to send OTP");
    console.log(error.message);

    return {
      sent: false,
      devOtp: otp,
      error: error.message
    };
  }
};

const sendEmail = async ({ to, subject, text }) => {

  if (!hasMailConfig()) {
    console.log("❌ Email configuration not found.");
    return {
      sent: false
    };
  }

  try {

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text
    });

    console.log(`✅ Email sent successfully to ${to}`);

    return {
      sent: true
    };

  } catch (error) {

    console.log("❌ Failed to send email");
    console.log(error.message);

    return {
      sent: false,
      error: error.message
    };

  }

};

module.exports = {
  sendOtpEmail,
  sendEmail,
  verifyTransporter
};