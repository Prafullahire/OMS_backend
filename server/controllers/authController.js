const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role, name, email, profileImage) => {
    return jwt.sign({ id, role, name, email, profileImage }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role, user.name, user.email, user.profileImage),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

const registerUser = async (req, res) => {
    const { name, email, password, role, phoneNumber, location } = req.body;
    const isFirstAccount = (await User.countDocuments({})) === 0;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    
    let finalRole = isFirstAccount ? 'admin' : (role || 'customer');

    const user = await User.create({
        name,
        email,
        password,
        role: finalRole,
        phoneNumber,
        location,
        profileImage: req.file ? `/uploads/${req.file.filename}` : undefined
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            location: user.location,
            profileImage: user.profileImage,
            token: generateToken(user._id, user.role, user.name, user.email, user.profileImage),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role, user.name, user.email, user.profileImage),
            });
        } else {
            
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            const isFirstAccount = (await User.countDocuments({})) === 0;
            const role = isFirstAccount ? 'admin' : 'customer';

            user = await User.create({
                name,
                email,
                password: randomPassword,
                role
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role, user.name, user.email, user.profileImage),
            });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Google Sign-In failed' });
    }
};

const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');


const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message,
                html: `<p>You requested a password reset</p><p>Click this link to set a new password:</p><a href="${resetUrl}">${resetUrl}</a>`
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (error) {
            console.error(error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
        success: true,
        token: generateToken(user._id, user.role, user.name, user.email, user.profileImage),
        message: 'Password updated success'
    });
};

module.exports = { loginUser, registerUser, googleLogin, forgotPassword, resetPassword };
