const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage(); // Store files in memory instead of disk

const upload = multer({
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB file limit
    storage: storage, 
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname).toLowerCase();
        if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
            return cb(new Error("Unsupported file type!"), false);
        }
        cb(null, true);
    },
});

module.exports = upload;
