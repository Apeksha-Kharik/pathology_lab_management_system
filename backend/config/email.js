const nodemailer = require("nodemailer");

const hasMailConfig = () => {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendOtpEmail = async ({ to, subject, otp }) => {
  if (!hasMailConfig()) {
    console.log(`OTP for ${to}: ${otp}`);
    return { sent: false, devOtp: otp };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text: `Your OTP is ${otp}. It will expire in 10 minutes.`
  });

  return { sent: true };
};

module.exports = { sendOtpEmail };
