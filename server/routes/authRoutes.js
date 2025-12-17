const express = require('express');
const router = express.Router();
const { loginUser, registerUser, googleLogin, forgotPassword, resetPassword, sendOtp, loginWithOtp } = require('../controllers/authController');

const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp|svg/;
        const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(null, true); // Allow relaxed checking for now
    }
});

router.post('/register', upload.single('profileImage'), registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/send-otp', sendOtp);
router.post('/login-otp', loginWithOtp);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

module.exports = router;
