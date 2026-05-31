const multer = require('multer');

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ['.xlsx', '.xls'];
  const ext = file.originalname ? file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.')) : '';
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Use .xlsx or .xls files only.'), false);
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
