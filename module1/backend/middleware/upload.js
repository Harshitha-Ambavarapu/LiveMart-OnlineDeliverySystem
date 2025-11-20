const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + Math.round(Math.random()*1E9) + path.extname(file.originalname);
    cb(null, name);
  }
});

// optional file filter: only images
function fileFilter(req, file, cb) {
  if (/image\/(jpeg|png|gif|webp)/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB each
  fileFilter
});

module.exports = upload;
