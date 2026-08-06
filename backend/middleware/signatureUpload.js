const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const signatureDirectory = path.join(__dirname, "..", "uploads", "signatures");
fs.mkdirSync(signatureDirectory, { recursive: true });

const allowedMimeTypes = new Set(["image/png", "image/jpeg"]);
const allowedExtensions = new Set([".png", ".jpg", ".jpeg"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, signatureDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${extension}`);
  }
});

const signatureUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "signature"));
    }
    callback(null, true);
  }
});

const uploadSignature = (req, res, next) => {
  signatureUpload.single("signature")(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Signature image must be 2 MB or smaller" });
    }
    return res.status(400).json({ message: "Only PNG, JPG and JPEG signature images are allowed" });
  });
};

module.exports = { uploadSignature };
