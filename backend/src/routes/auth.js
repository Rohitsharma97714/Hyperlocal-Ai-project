// src/routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import Admin from '../models/Admin.js';
import { sendOTPEmail, sendResetPasswordEmail } from '../utils/sendEmail.js';
import { protect } from '../middleware/auth.js';

dotenv.config();
const router = express.Router();

// ------------------ Registration Routes ------------------

// Helper function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
const otpExpiryTime = 10 * 60 * 1000; // 10 minutes

// Generic registration function
const registerHandler = (model, roleName) => async (req, res) => {
  const { name, email, password, phone, company } = req.body;
  try {
    let existing = await model.findOne({ email });

    if (existing) {
      if (existing.isVerified) {
        return res.status(400).json({ message: `${roleName} already exists` });
      } else {
        // Resend OTP
        const otp = generateOTP();
        existing.otp = otp;
        existing.otpExpiry = Date.now() + otpExpiryTime;
        await existing.save();
        await sendOTPEmail(email, otp);

        return res.status(200).json({
          message: 'OTP resent to your email. Please verify.',
          id: existing._id
        });
      }
    }

    // Create new account
    const otp = generateOTP();
    const otpExpiry = Date.now() + otpExpiryTime;

    const data = { name, email, password, otp, otpExpiry, isVerified: false };
    if (phone) data.phone = phone;
    if (company) data.company = company;

    const account = await model.create(data);

    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'OTP sent to your email. Verify to complete registration.',
      id: account._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Routes
router.post('/register', registerHandler(User, 'User'));
router.post('/provider/register', registerHandler(Provider, 'Provider'));
router.post('/admin/register', registerHandler(Admin, 'Admin'));

// ------------------ OTP Verification ------------------

router.post('/verify-otp', async (req, res) => {
  const { role, id, otp } = req.body;

  let model;
  if (role === 'user') model = User;
  else if (role === 'provider') model = Provider;
  else if (role === 'admin') model = Admin;
  else return res.status(400).json({ message: 'Invalid role' });

  try {
    const account = await model.findById(id);
    if (!account) return res.status(404).json({ message: `${role} not found` });
    if (account.isVerified) return res.status(400).json({ message: 'Already verified' });
    if (account.otp !== Number(otp)) return res.status(400).json({ message: 'Invalid OTP' });
    if (account.otpExpiry < Date.now()) return res.status(400).json({ message: 'OTP expired' });

    account.isVerified = true;
    account.otp = null;
    account.otpExpiry = null;
    await account.save();

    res.status(200).json({ message: `${role} verified successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------ Login Routes ------------------

const loginHandler = (model, roleName) => async (req, res) => {
  const { email, password } = req.body;
  try {
    const account = await model.findOne({ email });
    if (!account) return res.status(400).json({ message: 'Invalid email or password' });
    if (!account.isVerified) return res.status(400).json({ message: 'Account not verified. Please verify OTP first.' });

    if (roleName === 'provider') {
      if (!account.isApproved || account.approvalStatus !== 'approved') {
        return res.status(403).json({ message: 'Provider account not approved yet. Please wait for approval.' });
      }
    }

    const isMatch = await account.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: account._id, role: roleName, serverStartTime: parseInt(process.env.SERVER_START_TIME) }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const responseData = {
      message: 'Login successful',
      token
    };

    // Return user details dynamically based on role
    if (roleName === 'user') {
      responseData.user = { id: account._id, name: account.name, email: account.email, phone: account.phone, role: roleName };
    } else if (roleName === 'provider') {
      responseData.provider = { id: account._id, name: account.name, email: account.email, phone: account.phone, company: account.company, role: roleName };
    } else if (roleName === 'admin') {
      responseData.admin = { id: account._id, name: account.name, email: account.email, role: roleName };
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

router.post('/login', loginHandler(User, 'user'));
router.post('/provider/login', loginHandler(Provider, 'provider'));
router.post('/admin/login', loginHandler(Admin, 'admin'));

// ------------------ Forgot Password ------------------

router.post('/forgot-password', async (req, res) => {
  const { email, role, newPassword } = req.body;

  let model;
  if (role === 'user') model = User;
  else if (role === 'provider') model = Provider;
  else if (role === 'admin') model = Admin;
  else return res.status(400).json({ message: 'Invalid role' });

  try {
    const account = await model.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + otpExpiryTime;

    // Store temporary password and OTP
    account.tempPassword = newPassword;
    account.otp = otp;
    account.otpExpiry = otpExpiry;
    await account.save();

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email for password reset' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------ Verify Reset OTP ------------------

router.post('/verify-reset-otp', async (req, res) => {
  const { email, role, otp } = req.body;

  let model;
  if (role === 'user') model = User;
  else if (role === 'provider') model = Provider;
  else if (role === 'admin') model = Admin;
  else return res.status(400).json({ message: 'Invalid role' });

  try {
    const account = await model.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (!account.tempPassword) return res.status(400).json({ message: 'No password reset in progress' });
    if (account.otp !== Number(otp)) return res.status(400).json({ message: 'Invalid OTP' });
    if (account.otpExpiry < Date.now()) return res.status(400).json({ message: 'OTP expired' });

    // Set the new password
    account.password = account.tempPassword;
    account.tempPassword = null;
    account.otp = null;
    account.otpExpiry = null;
    await account.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------ Reset Password ------------------

router.post('/reset-password', async (req, res) => {
  const { token, role, email, newPassword } = req.body;

  let model;
  if (role === 'user') model = User;
  else if (role === 'provider') model = Provider;
  else if (role === 'admin') model = Admin;
  else return res.status(400).json({ message: 'Invalid role' });

  try {
    const account = await model.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!account) return res.status(400).json({ message: 'Invalid or expired token' });

    account.password = newPassword;
    account.resetPasswordToken = null;
    account.resetPasswordExpires = null;
    await account.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------ Update Profile ------------------

import validator from 'validator';

router.put('/profile', protect, async (req, res) => {
  const { name, phone } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  let model;
  if (userRole === 'user') model = User;
  else if (userRole === 'provider') model = Provider;
  else if (userRole === 'admin') model = Admin;
  else return res.status(400).json({ message: 'Invalid role' });

  // Validate inputs
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Name is required and must be a non-empty string' });
  }
  if (phone && !validator.isMobilePhone(phone, 'any')) {
    return res.status(400).json({ message: 'Phone number is invalid' });
  }

  try {
    const user = await model.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    user.name = name.trim();
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Generate new token with updated info
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id, role: userRole, serverStartTime: parseInt(process.env.SERVER_START_TIME) }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Profile updated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
