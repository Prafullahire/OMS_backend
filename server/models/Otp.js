const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 180 // 3 minutes = 180 seconds
    }
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
