import nodemailer from 'nodemailer';
import validator from 'validator';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;
let isTransporterReady = false;
let transporterReadyCallbacks = [];

// Email validation helper
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    console.error('Email validation failed: Email is required and must be a string');
    return false;
  }
  if (!validator.isEmail(email.trim())) {
    console.error('Email validation failed: Invalid email format:', email);
    return false;
  }
  return true;
};

// Environment validation helper
const validateEnvironment = () => {
  const required = ['MAIL_USER', 'MAIL_PASS'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Email environment validation failed. Missing required variables:', missing.join(', '));
    console.error('📧 Please set the following environment variables:');
    console.error('   - MAIL_USER: Your Gmail address');
    console.error('   - MAIL_PASS: Your Gmail App Password (not regular password)');
    console.error('💡 Gmail Setup Instructions:');
    console.error('   1. Enable 2FA on your Gmail account');
    console.error('   2. Generate an App Password: https://support.google.com/accounts/answer/185833');
    console.error('   3. Use the App Password as MAIL_PASS');
    return false;
  }

  // Validate email format
  if (!validator.isEmail(process.env.MAIL_USER)) {
    console.error('❌ MAIL_USER is not a valid email address:', process.env.MAIL_USER);
    return false;
  }

  console.log('✅ Email environment validation passed');
  return true;
};

const waitForTransporter = () => {
  return new Promise((resolve) => {
    if (isTransporterReady) {
      resolve(transporter);
    } else {
      transporterReadyCallbacks.push(resolve);
    }
  });
};

const getTransporter = () => {
  if (transporter && isTransporterReady) {
    return transporter;
  }

  console.log('📧 Creating optimized Gmail SMTP transporter...');

  // Validate environment before creating transporter
  if (!validateEnvironment()) {
    console.error('❌ Cannot create email transporter due to configuration errors');
    return null;
  }

  // SMTP configuration with fallback options
  const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 587, // Try 587 first (more reliable)
    secure: false, // false for port 587
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    },
    // Enhanced timeout settings for better reliability
    connectionTimeout: 60000, // Increased to 60 seconds
    greetingTimeout: 30000,  // Increased to 30 seconds
    socketTimeout: 60000,    // Increased to 60 seconds
    // TLS configuration
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    // Additional options for better Gmail compatibility
    requireTLS: true,
    opportunisticTLS: true,
    debug: process.env.NODE_ENV === 'development'
  };

  console.log('📧 SMTP Configuration:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure
  });

  transporter = nodemailer.createTransport(smtpConfig);

  // Test connection immediately with detailed logging
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Connection Verification Failed:');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
      console.error('   Command:', error.command);
      console.error('📧 Troubleshooting Gmail SMTP:');
      console.error('   1. Enable 2FA on Gmail account');
      console.error('   2. Generate App Password: https://support.google.com/accounts/answer/185833');
      console.error('   3. Use App Password as MAIL_PASS (not regular password)');
      console.error('   4. Check Gmail security settings');
      isTransporterReady = false;
      
      // Notify all waiting callbacks
      transporterReadyCallbacks.forEach(callback => callback(null));
      transporterReadyCallbacks = [];
    } else {
      console.log('✅ SMTP connection verified successfully');
      console.log('📧 Email transporter ready for sending');
      isTransporterReady = true;
      
      // Notify all waiting callbacks
      transporterReadyCallbacks.forEach(callback => callback(transporter));
      transporterReadyCallbacks = [];
    }
  });

  return transporter;
};


export const sendOTPEmail = async (email, otp) => {
  // Validate email before sending
  if (!validateEmail(email)) {
    console.error('❌ Invalid email address provided for OTP email');
    return { success: false, error: 'Invalid email address' };
  }

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const emailTransporter = await waitForTransporter();
      if (!emailTransporter) {
        console.error('❌ Email transporter not available. Cannot send OTP email.');
        return { success: false, error: 'Email transporter not available' };
      }

      // Email content with attractive HTML template
      const mailOptions = {
        from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
        to: email.trim(),
        subject: '🔐 Your OTP for Hyperlocal Registration',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); position: relative; overflow: hidden;">
              <!-- Decorative background pattern -->
              <div style="position: absolute; top: 0; right: 0; width: 150px; height: 150px; background: linear-gradient(45deg, #ff6b35, #ff8f65); border-radius: 50%; transform: translate(50%, -50%); opacity: 0.1;"></div>
              <div style="position: absolute; bottom: 0; left: 0; width: 100px; height: 100px; background: linear-gradient(45deg, #28a745, #20c997); border-radius: 50%; transform: translate(-50%, 50%); opacity: 0.1;"></div>

              <div style="text-align: center; margin-bottom: 40px; position: relative; z-index: 1;">
                <div style="display: inline-block; background: linear-gradient(45deg, #ff6b35, #ff8f65); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);">
                  <span style="font-size: 48px;">🔐</span>
                </div>
                <h1 style="color: #2d3748; margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(45deg, #ff6b35, #ff8f65); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Your OTP Code</h1>
                <p style="color: #718096; margin: 10px 0 0 0; font-size: 18px; font-weight: 400;">Use this code to complete your registration</p>
              </div>

              <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 30px; border-radius: 15px; margin: 30px 0; border: 1px solid #e1e7ef; position: relative; z-index: 1;">
                <div style="text-align: center;">
                  <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); margin-bottom: 20px;">
                    <h2 style="color: #2d3748; margin: 0 0 10px 0; font-size: 36px; letter-spacing: 8px; font-weight: 700; background: linear-gradient(45deg, #ff6b35, #ff8f65); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${otp}</h2>
                    <div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
                      <span style="background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 6px 15px; border-radius: 20px; font-size: 14px; font-weight: 600;">⏰ Expires in 10 minutes</span>
                    </div>
                  </div>
                  <p style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.6;">Enter this code on the registration page to verify your account</p>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #fff3cd 0%, #fce4a3 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #ffc107; position: relative; z-index: 1;">
                <h3 style="color: #f57c00; margin: 0 0 15px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">⚠️</span>
                  Security Reminder
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #5d4037; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">Never share this OTP with anyone</li>
                  <li style="margin-bottom: 8px;">This code is valid for only 10 minutes</li>
                  <li style="margin-bottom: 0;">If you didn't request this code, please ignore this email</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 40px 0; position: relative; z-index: 1;">
                <a href="${process.env.FRONTEND_URL}/register"
                   style="background: linear-gradient(45deg, #ff6b35, #ff8f65); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3); transition: all 0.3s ease;">
                  🔐 Complete Registration
                </a>
              </div>

              <div style="border-top: 2px solid #e1e7ef; padding-top: 30px; margin-top: 40px; text-align: center; position: relative; z-index: 1;">
                <p style="margin: 0 0 10px 0; color: #718096; font-size: 16px; line-height: 1.6;">
                  <strong>Welcome to the Hyperlocal AI community!</strong>
                </p>
                <p style="margin: 0; color: #a0aec0; font-size: 14px;">
                  Questions? Contact our support team at <a href="mailto:support@hyperlocalai.com" style="color: #ff6b35; text-decoration: none; font-weight: 600;">support@hyperlocalai.com</a>
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px; position: relative; z-index: 1;">
                <p style="margin: 0; color: #cbd5e0; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
        text: `Your OTP is: ${otp}. It will expire in 10 minutes. If you didn't request this code, please ignore this email.`
      };

      // Send email
      const info = await emailTransporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully:', info.response);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      attempt++;
      console.error(`❌ Error sending OTP email (attempt ${attempt}/${maxRetries}):`, error.message);

      if (attempt >= maxRetries) {
        console.error('❌ Max retries reached for OTP email');
        return { success: false, error: error.message };
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

export const sendResetPasswordEmail = async (email, resetUrl) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send reset password email.');
      return { success: false, error: 'Email transporter not available' };
    }

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ff6b35; margin: 0; font-size: 28px;">Password Reset</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Click the link below to reset your password</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}. This link will expire in 1 hour.`
    };

    // Send email
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Reset password email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return { success: false, error: error.message };
  }
};

export const sendApprovalEmail = async (email, name, adminNotes) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send approval email.');
      return { success: false, error: 'Email transporter not available' };
    }

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Provider Account Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #28a745; margin: 0; font-size: 28px;">Account Approved!</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your provider account has been approved</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #333; line-height: 1.6;">
                Dear <strong>${name}</strong>,
              </p>
              <p style="margin: 15px 0 0 0; color: #333; line-height: 1.6;">
                Congratulations! Your provider account has been approved. You can now log in and start adding services to your dashboard.
              </p>
              ${adminNotes ? `
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin-top: 15px;">
                <p style="margin: 0; color: #1976d2; font-weight: bold;">Admin Notes:</p>
                <p style="margin: 5px 0 0 0; color: #333;">${adminNotes}</p>
              </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/provider/login" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Login to Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Dear ${name},\n\nCongratulations! Your provider account has been approved. You can now log in and start adding services to your dashboard.\n\n${adminNotes ? `Admin Notes: ${adminNotes}\n\n` : ''}Best regards,\nHyperlocal AI Team`
    };

    // Send email
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Approval email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error: error.message };
  }
};

export const sendRejectionEmail = async (email, name, adminNotes) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send rejection email.');
      return { success: false, error: 'Email transporter not available' };
    }

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Provider Account Application Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc3545; margin: 0; font-size: 28px;">Application Update</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Regarding your provider account application</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #333; line-height: 1.6;">
                Dear <strong>${name}</strong>,
              </p>
              <p style="margin: 15px 0 0 0; color: #333; line-height: 1.6;">
                We regret to inform you that your provider account application has been rejected.
              </p>
              ${adminNotes ? `
              <div style="background-color: #f8d7da; padding: 15px; border-radius: 6px; margin-top: 15px;">
                <p style="margin: 0; color: #721c24; font-weight: bold;">Admin Notes:</p>
                <p style="margin: 5px 0 0 0; color: #333;">${adminNotes}</p>
              </div>
              ` : ''}
              <p style="margin: 15px 0 0 0; color: #333; line-height: 1.6;">
                If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Dear ${name},\n\nWe regret to inform you that your provider account application has been rejected.\n\n${adminNotes ? `Admin Notes: ${adminNotes}\n\n` : ''}If you have any questions, please contact our support team.\n\nBest regards,\nHyperlocal AI Team`
    };

    // Send email
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Rejection email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
};

export const sendServiceApprovalEmail = async (email, name, serviceName, adminNotes) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send service approval email.');
      return { success: false, error: 'Email transporter not available' };
    }

    // Email content with attractive HTML template
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '🎉 Your Service Has Been Approved - Hyperlocal AI',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); position: relative; overflow: hidden;">
            <!-- Decorative background pattern -->
            <div style="position: absolute; top: 0; right: 0; width: 150px; height: 150px; background: linear-gradient(45deg, #ff6b35, #ff8f65); border-radius: 50%; transform: translate(50%, -50%); opacity: 0.1;"></div>
            <div style="position: absolute; bottom: 0; left: 0; width: 100px; height: 100px; background: linear-gradient(45deg, #28a745, #20c997); border-radius: 50%; transform: translate(-50%, 50%); opacity: 0.1;"></div>

            <div style="text-align: center; margin-bottom: 40px; position: relative; z-index: 1;">
              <div style="display: inline-block; background: linear-gradient(45deg, #28a745, #20c997); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);">
                <span style="font-size: 48px;">🎉</span>
              </div>
              <h1 style="color: #2d3748; margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(45deg, #28a745, #20c997); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Service Approved!</h1>
              <p style="color: #718096; margin: 10px 0 0 0; font-size: 18px; font-weight: 400;">Your service is now live and ready to serve customers</p>
            </div>

            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 30px; border-radius: 15px; margin: 30px 0; border: 1px solid #e1e7ef; position: relative; z-index: 1;">
              <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; display: flex; align-items: center;">
                <span style="background: linear-gradient(45deg, #ff6b35, #ff8f65); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-right: 10px;">📋</span>
                Service Details
              </h2>
              <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <p style="margin: 12px 0; color: #4a5568; font-size: 16px;"><strong style="color: #2d3748;">Service Name:</strong> <span style="color: #ff6b35; font-weight: 600;">${serviceName}</span></p>
                <p style="margin: 12px 0; color: #4a5568; font-size: 16px;"><strong style="color: #2d3748;">Provider:</strong> ${name}</p>
                <p style="margin: 12px 0; color: #4a5568; font-size: 16px;"><strong style="color: #2d3748;">Status:</strong> <span style="background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">✅ Approved & Live</span></p>
              </div>
            </div>

            ${adminNotes ? `
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #2196f3; position: relative; z-index: 1;">
              <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                <span style="margin-right: 10px;">📝</span>
                Admin Notes
              </h3>
              <p style="margin: 0; color: #1976d2; line-height: 1.6; font-style: italic; background: white; padding: 15px; border-radius: 8px; border: 1px solid #e3f2fd;">${adminNotes}</p>
            </div>
            ` : ''}

            <div style="background: linear-gradient(135deg, #fff3cd 0%, #fce4a3 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #ffc107; position: relative; z-index: 1;">
              <h3 style="color: #f57c00; margin: 0 0 15px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                <span style="margin-right: 10px;">🚀</span>
                What's Next?
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #5d4037; line-height: 1.8;">
                <li style="margin-bottom: 10px;"><strong>Customers can now discover and book your service</strong></li>
                <li style="margin-bottom: 10px;"><strong>Monitor bookings from your provider dashboard</strong></li>
                <li style="margin-bottom: 10px;"><strong>Update service details and pricing as needed</strong></li>
                <li style="margin-bottom: 0;"><strong>Receive notifications for new bookings</strong></li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0; position: relative; z-index: 1;">
              <a href="${process.env.FRONTEND_URL}/provider/dashboard"
                 style="background: linear-gradient(45deg, #ff6b35, #ff8f65); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3); transition: all 0.3s ease; margin-right: 15px;">
                🏠 Go to Dashboard
              </a>
              <a href="${process.env.FRONTEND_URL}/provider/services"
                 style="background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3); transition: all 0.3s ease;">
                📋 Manage Services
              </a>
            </div>

            <div style="border-top: 2px solid #e1e7ef; padding-top: 30px; margin-top: 40px; text-align: center; position: relative; z-index: 1;">
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 16px; line-height: 1.6;">
                <strong>Thank you for being part of the Hyperlocal AI community!</strong>
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 14px;">
                Questions? Contact our support team at <a href="mailto:support@hyperlocalai.com" style="color: #ff6b35; text-decoration: none; font-weight: 600;">support@hyperlocalai.com</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; position: relative; z-index: 1;">
              <p style="margin: 0; color: #cbd5e0; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
      text: `Dear ${name},

🎉 Great news! Your service "${serviceName}" has been approved and is now live on our platform.

Customers can now view and book your service. You can manage this service from your provider dashboard.

${adminNotes ? `📝 Admin Notes: ${adminNotes}\n\n` : ''}🚀 What's Next:
• Customers can now discover and book your service
• Monitor bookings from your provider dashboard
• Update service details and pricing as needed
• Receive notifications for new bookings

Go to Dashboard: ${process.env.FRONTEND_URL}/provider/dashboard
Manage Services: ${process.env.FRONTEND_URL}/provider/services

Thank you for being part of the Hyperlocal AI community!

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    // Send email
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Service approval email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending service approval email:', error);
    return { success: false, error: error.message };
  }
};

export const sendServiceRejectionEmail = async (email, name, serviceName, adminNotes) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send service rejection email.');
      return { success: false, error: 'Email transporter not available' };
    }

    // Email content with attractive HTML template
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '❌ Service Application Update - Hyperlocal AI',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); position: relative; overflow: hidden;">
            <!-- Decorative background pattern -->
            <div style="position: absolute; top: 0; right: 0; width: 150px; height: 150px; background: linear-gradient(45deg, #dc3545, #e74c3c); border-radius: 50%; transform: translate(50%, -50%); opacity: 0.1;"></div>
            <div style="position: absolute; bottom: 0; left: 0; width: 100px; height: 100px; background: linear-gradient(45deg, #ff6b35, #ff8f65); border-radius: 50%; transform: translate(-50%, 50%); opacity: 0.1;"></div>

            <div style="text-align: center; margin-bottom: 40px; position: relative; z-index: 1;">
              <div style="display: inline-block; background: linear-gradient(45deg, #dc3545, #e74c3c); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(220, 53, 69, 0.3);">
                <span style="font-size: 48px;">❌</span>
              </div>
              <h1 style="color: #2d3748; margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(45deg, #dc3545, #e74c3c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Service Application Update</h1>
              <p style="color: #718096; margin: 10px 0 0 0; font-size: 18px; font-weight: 400;">We have an update regarding your service submission</p>
            </div>

            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 30px; border-radius: 15px; margin: 30px 0; border: 1px solid #e1e7ef; position: relative; z-index: 1;">
              <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; display: flex; align-items: center;">
                <span style="background: linear-gradient(45deg, #dc3545, #e74c3c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-right: 10px;">📋</span>
                Service Details
              </h2>
              <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <p style="margin: 12px 0; color: #4a5568; font-size: 16px;"><strong style="color: #2d3748;">Service Name:</strong> <span style="color: #dc3545; font-weight: 600;">${serviceName}</span></p>
                <p style="margin: 12px 0; color: #4a5568; font-size: 16px;"><strong style="color: #2d3748;">Provider:</strong> ${name}</p>
                <p style="margin: 12px 0; color: #4a5568; font-size: 16px;"><strong style="color: #2d3748;">Status:</strong> <span style="background: linear-gradient(45deg, #dc3545, #e74c3c); color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">❌ Rejected</span></p>
              </div>
            </div>

            ${adminNotes ? `
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #dc3545; position: relative; z-index: 1;">
              <h3 style="color: #c62828; margin: 0 0 15px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                <span style="margin-right: 10px;">📝</span>
                Admin Notes
              </h3>
              <p style="margin: 0; color: #d32f2f; line-height: 1.6; font-style: italic; background: white; padding: 15px; border-radius: 8px; border: 1px solid #ffebee;">${adminNotes}</p>
            </div>
            ` : ''}

            <div style="background: linear-gradient(135deg, #fff3cd 0%, #fce4a3 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #ffc107; position: relative; z-index: 1;">
              <h3 style="color: #f57c00; margin: 0 0 15px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                <span style="margin-right: 10px;">🔄</span>
                What You Can Do Next
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #5d4037; line-height: 1.8;">
                <li style="margin-bottom: 10px;"><strong>Review the admin notes above for specific feedback</strong></li>
                <li style="margin-bottom: 10px;"><strong>Update your service details based on the feedback</strong></li>
                <li style="margin-bottom: 10px;"><strong>Resubmit your service for approval from your dashboard</strong></li>
                <li style="margin-bottom: 0;"><strong>Contact support if you need further assistance</strong></li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 25px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #2196f3; position: relative; z-index: 1;">
              <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
                <span style="margin-right: 10px;">💡</span>
                Tips for Resubmission
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #1565c0; line-height: 1.8;">
                <li style="margin-bottom: 8px;">Ensure all required fields are completed</li>
                <li style="margin-bottom: 8px;">Provide clear and detailed service descriptions</li>
                <li style="margin-bottom: 8px;">Set competitive and reasonable pricing</li>
                <li style="margin-bottom: 0;">Include high-quality service images</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0; position: relative; z-index: 1;">
              <a href="${process.env.FRONTEND_URL}/provider/dashboard"
                 style="background: linear-gradient(45deg, #ff6b35, #ff8f65); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3); transition: all 0.3s ease; margin-right: 15px;">
                🏠 Go to Dashboard
              </a>
              <a href="${process.env.FRONTEND_URL}/provider/services"
                 style="background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3); transition: all 0.3s ease;">
                ➕ Add New Service
              </a>
            </div>

            <div style="border-top: 2px solid #e1e7ef; padding-top: 30px; margin-top: 40px; text-align: center; position: relative; z-index: 1;">
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 16px; line-height: 1.6;">
                <strong>We're here to help you succeed on our platform!</strong>
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 14px;">
                Questions? Contact our support team at <a href="mailto:support@hyperlocalai.com" style="color: #ff6b35; text-decoration: none; font-weight: 600;">support@hyperlocalai.com</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; position: relative; z-index: 1;">
              <p style="margin: 0; color: #cbd5e0; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
      text: `Dear ${name},

We regret to inform you that your service "${serviceName}" has been rejected.

${adminNotes ? `📝 Admin Notes: ${adminNotes}\n\n` : ''}🔄 What You Can Do Next:
• Review the admin notes above for specific feedback
• Update your service details based on the feedback
• Resubmit your service for approval from your dashboard
• Contact support if you need further assistance

💡 Tips for Resubmission:
• Ensure all required fields are completed
• Provide clear and detailed service descriptions
• Set competitive and reasonable pricing
• Include high-quality service images

Go to Dashboard: ${process.env.FRONTEND_URL}/provider/dashboard
Add New Service: ${process.env.FRONTEND_URL}/provider/services

We're here to help you succeed on our platform!

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    // Send email
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Service rejection email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending service rejection email:', error);
    return { success: false, error: error.message };
  }
};

// ==================== BOOKING EMAIL FUNCTIONS ====================

export const sendBookingApprovalEmail = async (email, name, serviceName, providerNotes) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const emailTransporter = await waitForTransporter();
      if (!emailTransporter) {
        throw new Error('Email transporter not available. Cannot send booking approval email.');
      }

      const mailOptions = {
        from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '🎉 Your Booking Has Been Approved - Hyperlocal AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ff6b35; margin: 0; font-size: 28px;">Booking Approved!</h1>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your service booking has been confirmed</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Booking Details</h2>
                <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceName}</p>
                <p style="margin: 8px 0; color: #555;"><strong>Customer:</strong> ${name}</p>
                <p style="margin: 8px 0; color: #28a745;"><strong>Status:</strong> ✅ Approved</p>
              </div>

              ${providerNotes ? `
              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <h3 style="color: #1976d2; margin: 0 0 10px 0; font-size: 18px;">📝 Provider Message</h3>
                <p style="margin: 0; color: #333; line-height: 1.6;">${providerNotes}</p>
              </div>
              ` : ''}

              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">📅 What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333;">
                  <li style="margin-bottom: 8px;">Your provider will schedule the service at a convenient time</li>
                  <li style="margin-bottom: 8px;">You'll receive a notification when the service is scheduled</li>
                  <li style="margin-bottom: 8px;">Track your booking progress in your dashboard</li>
                </ul>
              </div>

              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #333; line-height: 1.6;">
                  You can view your bookings and track their progress from your dashboard.
                </p>
              </div>

              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                  Thank you for choosing Hyperlocal AI! We're excited to serve you.
                </p>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; text-align: center;">
                  Questions? Contact our support team at <a href="mailto:support@hyperlocalai.com" style="color: #ff6b35;">support@hyperlocalai.com</a>
                </p>
              </div>

              <div style="text-align: center; margin-top: 20px;">
                <p style="margin: 0; color: #999; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
        text: `Dear ${name},

🎉 Great news! Your booking for "${serviceName}" has been approved by the provider.

${providerNotes ? `📝 Provider Notes: ${providerNotes}\n\n` : ''}📅 What's Next:
• Your provider will schedule the service at a convenient time
• You'll receive a notification when the service is scheduled
• Track your booking progress in your dashboard

View your bookings: ${process.env.FRONTEND_URL}/dashboard

Thank you for choosing Hyperlocal AI!

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
      };

      const info = await emailTransporter.sendMail(mailOptions);
      console.log('Booking approval email sent:', info.response);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      attempt++;
      console.error(`Error sending booking approval email (attempt ${attempt}/${maxRetries}):`, error);

      if (attempt >= maxRetries) {
        console.error('Max retries reached for booking approval email');
        return { success: false, error: error.message };
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

export const sendBookingRejectionEmail = async (email, name, serviceName, providerNotes) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const emailTransporter = await waitForTransporter();
      if (!emailTransporter) {
        throw new Error('Email transporter not available. Cannot send booking rejection email.');
      }

      const mailOptions = {
        from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '❌ Booking Update - Hyperlocal AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc3545; margin: 0; font-size: 28px;">Booking Update</h1>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">We have an update regarding your booking</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Booking Details</h2>
                <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceName}</p>
                <p style="margin: 8px 0; color: #555;"><strong>Customer:</strong> ${name}</p>
                <p style="margin: 8px 0; color: #dc3545;"><strong>Status:</strong> ❌ Rejected</p>
              </div>

              ${providerNotes ? `
              <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h3 style="color: #721c24; margin: 0 0 10px 0; font-size: 18px;">📝 Provider Message</h3>
                <p style="margin: 0; color: #333; line-height: 1.6;">${providerNotes}</p>
              </div>
              ` : ''}

              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">🔄 What You Can Do</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333;">
                  <li style="margin-bottom: 8px;">Contact the provider directly to discuss alternative arrangements</li>
                  <li style="margin-bottom: 8px;">Browse other available services in your area</li>
                  <li style="margin-bottom: 8px;">Book a different time slot or service</li>
                </ul>
              </div>

              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #333; line-height: 1.6;">
                  You can browse other available services in your area from the services page.
                </p>
              </div>

              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                  We're sorry for any inconvenience this may have caused.
                </p>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; text-align: center;">
                  Questions? Contact our support team at <a href="mailto:support@hyperlocalai.com" style="color: #ff6b35;">support@hyperlocalai.com</a>
                </p>
              </div>

              <div style="text-align: center; margin-top: 20px;">
                <p style="margin: 0; color: #999; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
        text: `Dear ${name},

We regret to inform you that your booking for "${serviceName}" has been rejected by the provider.

${providerNotes ? `📝 Provider Notes: ${providerNotes}\n\n` : ''}🔄 What You Can Do:
• Contact the provider directly to discuss alternative arrangements
• Browse other available services in your area
• Book a different time slot or service

Browse services: ${process.env.FRONTEND_URL}/services

We're sorry for any inconvenience this may have caused.

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
      };

      const info = await emailTransporter.sendMail(mailOptions);
      console.log('Booking rejection email sent successfully:', info.response);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      attempt++;
      console.error(`Error sending booking rejection email (attempt ${attempt}/${maxRetries}):`, error);

      if (attempt >= maxRetries) {
        console.error('Max retries reached for booking rejection email');
        return { success: false, error: error.message };
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

export const sendBookingScheduledEmail = async (email, name, serviceName, date, time) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send booking scheduled email.');
      return { success: false, error: 'Email transporter not available' };
    }

    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '📅 Your Booking Has Been Scheduled - Hyperlocal AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ff6b35; margin: 0; font-size: 28px;">Booking Scheduled!</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your service has been scheduled</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Booking Details</h2>
              <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 8px 0; color: #555;"><strong>Customer:</strong> ${name}</p>
              <p style="margin: 8px 0; color: #28a745;"><strong>Status:</strong> 📅 Scheduled</p>
              <p style="margin: 8px 0; color: #555;"><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
              <p style="margin: 8px 0; color: #555;"><strong>Time:</strong> ${time}</p>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0; font-size: 18px;">⏰ What to Expect</h3>
              <ul style="margin: 0; padding-left: 20px; color: #333;">
                <li style="margin-bottom: 8px;">Your provider will arrive at the scheduled time</li>
                <li style="margin-bottom: 8px;">You'll receive updates as the service progresses</li>
                <li style="margin-bottom: 8px;">Contact your provider if you need to reschedule</li>
              </ul>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <p style="margin: 0; color: #333; line-height: 1.6;">
                You can view your bookings and track their progress from your dashboard.
              </p>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                Thank you for choosing Hyperlocal AI! We're excited to serve you.
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; text-align: center;">
                Questions? Contact our support team at <a href="mailto:support@hyperlocalai.com" style="color: #ff6b35;">support@hyperlocalai.com</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="margin: 0; color: #999; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
      text: `Dear ${name},

📅 Great news! Your booking for "${serviceName}" has been scheduled.

📅 Date: ${new Date(date).toLocaleDateString()}
⏰ Time: ${time}

⏰ What to Expect:
• Your provider will arrive at the scheduled time
• You'll receive updates as the service progresses
• Contact your provider if you need to reschedule

View your bookings: ${process.env.FRONTEND_URL}/dashboard

Thank you for choosing Hyperlocal AI!

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Booking scheduled email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking scheduled email:', error);
    return { success: false, error: error.message };
  }
};

export const sendBookingInProgressEmail = async (email, name, serviceName) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send booking in progress email.');
      return { success: false, error: 'Email transporter not available' };
    }

    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '🔄 Your Service is Now In Progress - Hyperlocal AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ff6b35; margin: 0; font-size: 28px;">Service In Progress!</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your provider has started working on your service</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Booking Details</h2>
              <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 8px 0; color: #555;"><strong>Customer:</strong> ${name}</p>
              <p style="margin: 8px 0; color: #ffc107;"><strong>Status:</strong> 🔄 In Progress</p>
            </div>

            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">📱 Live Updates</h3>
              <p style="margin: 0; color: #333; line-height: 1.6;">
                Your service is now underway! You'll receive a completion notification once the work is finished.
                Feel free to contact your provider directly if you have any questions during the service.
              </p>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <p style="margin: 0; color: #333; line-height: 1.6;">
                You can view your bookings and track their progress from your dashboard.
              </p>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                Thank you for your patience. We're working hard to complete your service.
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; text-align: center;">
                Questions? Contact our support team at <a href="mailto:support@hyperlocalai.com" style="color: #ff6b35;">support@hyperlocalai.com</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="margin: 0; color: #999; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
      text: `Dear ${name},

🔄 Your service for "${serviceName}" is now in progress.

📱 Live Updates:
Your service is now underway! You'll receive a completion notification once the work is finished.
Feel free to contact your provider directly if you have any questions during the service.

Track progress: ${process.env.FRONTEND_URL}/dashboard

Thank you for your patience. We're working hard to complete your service.

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Booking in progress email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking in progress email:', error);
    return { success: false, error: error.message };
  }
};

export const sendBookingCompletedEmail = async (email, name, serviceName, bookingId) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send booking completed email.');
      return { success: false, error: 'Email transporter not available' };
    }

    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '✅ Your Service Has Been Completed - Hyperlocal AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #28a745; margin: 0; font-size: 28px;">Service Completed!</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Thank you for choosing Hyperlocal AI</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Booking Details</h2>
              <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 8px 0; color: #555;"><strong>Customer:</strong> ${name}</p>
              <p style="margin: 8px 0; color: #28a745;"><strong>Status:</strong> ✅ Completed</p>
            </div>

            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">⭐ Help Us Improve</h3>
              <p style="margin: 0; color: #333; line-height: 1.6;">
                Your feedback helps us maintain high service quality. Please log in to your dashboard to leave a review for your recent service.
              </p>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0; font-size: 18px;">🔄 Book Again</h3>
              <p style="margin: 0; color: #333; line-height: 1.6;">
                Satisfied with the service? Book again or explore other services in your area.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/services"
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                Book Again
              </a>
              <a href="${process.env.FRONTEND_URL}/dashboard"
                 style="background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Bookings
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                Thank you for trusting Hyperlocal AI with your service needs!
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; text-align: center;">
                Questions? Contact our support team at <a href="mailto:support@hyperlocalai.com" style="color: #ff6b35;">support@hyperlocalai.com</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="margin: 0; color: #999; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
      text: `Dear ${name},

✅ Your service for "${serviceName}" has been completed.

⭐ Help Us Improve:
Your feedback helps us maintain high service quality. Please take a moment to leave a review for your recent service.

Leave a review: ${process.env.FRONTEND_URL}/dashboard

🔄 Book Again:
Satisfied with the service? Book again or explore other services in your area.

Book again: ${process.env.FRONTEND_URL}/services
View bookings: ${process.env.FRONTEND_URL}/dashboard

Thank you for trusting Hyperlocal AI with your service needs!

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Booking completed email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking completed email:', error);
    return { success: false, error: error.message };
  }
};

// ==================== CONTACT EMAIL FUNCTION ====================

export const sendContactEmail = async (name, email, subject, message) => {
  try {
    const emailTransporter = await waitForTransporter();
    if (!emailTransporter) {
      console.error('Email transporter not available. Cannot send contact email.');
      return { success: false, error: 'Email transporter not available' };
    }

    // Recipient email - use environment variable or default to MAIL_USER
    const recipientEmail = process.env.ADMIN_EMAIL || process.env.MAIL_USER || 'support@hyperlocalai.com';

    const mailOptions = {
      from: `"Hyperlocal AI Contact" <${process.env.MAIL_USER}>`,
      to: recipientEmail,
      subject: `📬 New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ff6b35; margin: 0; font-size: 28px;">New Contact Form Submission</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Someone reached out through the contact form</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Contact Details</h2>
              <p style="margin: 8px 0; color: #555;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 8px 0; color: #555;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #ff6b35;">${email}</a></p>
              <p style="margin: 8px 0; color: #555;"><strong>Subject:</strong> ${subject}</p>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0; font-size: 18px;">📝 Message</h3>
              <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>

            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">📧 Quick Actions</h3>
              <p style="margin: 0; color: #333; line-height: 1.6;">
                <a href="mailto:${email}?subject=Re: ${subject}"
                   style="background-color: #ff6b35; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-right: 10px;">
                  Reply to Sender
                </a>
                Please respond to this inquiry as soon as possible.
              </p>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                This message was sent from the Hyperlocal AI contact form.
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; text-align: center;">
                Timestamp: ${new Date().toLocaleString()}
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="margin: 0; color: #999; font-size: 12px;">© 2024 Hyperlocal AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
      text: `New Contact Form Submission

Contact Details:
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

Please respond to this inquiry as soon as possible.

Timestamp: ${new Date().toLocaleString()}

Best regards,
Hyperlocal AI System`
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Contact email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, error: error.message };
  }
};

// Initialize transporter on module load
getTransporter();