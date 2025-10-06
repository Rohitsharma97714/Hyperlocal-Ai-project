import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }
  console.log('Creating mail transporter...');
  console.log('MAIL_USER:', process.env.MAIL_USER ? 'Set' : 'Not set');
  console.log('MAIL_PASS:', process.env.MAIL_PASS ? 'Set' : 'Not set');

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('Error verifying transporter:', error);
    } else {
      console.log('Mail transporter verified successfully');
    }
  });

  return transporter;
};

export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = getTransporter();

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`, // sender name + email
      to: email,
      subject: 'Your OTP for Hyperlocal Registration',
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP sent:', info.response);
  } catch (error) {
    console.error('Error sending OTP:', error);
  }
};

export const sendResetPasswordEmail = async (email, resetUrl) => {
  try {
    const transporter = getTransporter();

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`, // sender name + email
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}. This link will expire in 1 hour.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Reset password email sent:', info.response);
  } catch (error) {
    console.error('Error sending reset password email:', error);
  }
};

export const sendApprovalEmail = async (email, name, adminNotes) => {
  try {
    const transporter = getTransporter();

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`, // sender name + email
      to: email,
      subject: 'Provider Account Approved',
      text: `Dear ${name},\n\nCongratulations! Your provider account has been approved. You can now log in and start adding services to your dashboard.\n\n${adminNotes ? `Admin Notes: ${adminNotes}\n\n` : ''}Best regards,\nHyperlocal AI Team`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Approval email sent:', info.response);
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
};

export const sendRejectionEmail = async (email, name, adminNotes) => {
  try {
    const transporter = getTransporter();

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`, // sender name + email
      to: email,
      subject: 'Provider Account Application Update',
      text: `Dear ${name},\n\nWe regret to inform you that your provider account application has been rejected.\n\n${adminNotes ? `Admin Notes: ${adminNotes}\n\n` : ''}If you have any questions, please contact our support team.\n\nBest regards,\nHyperlocal AI Team`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent:', info.response);
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }
};

export const sendServiceApprovalEmail = async (email, name, serviceName, adminNotes) => {
  try {
    const transporter = getTransporter();

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`, // sender name + email
      to: email,
      subject: 'Service Approved - Hyperlocal AI',
      text: `Dear ${name},\n\nGreat news! Your service "${serviceName}" has been approved and is now live on our platform.\n\nCustomers can now view and book your service. You can manage this service from your provider dashboard.\n\n${adminNotes ? `Admin Notes: ${adminNotes}\n\n` : ''}Best regards,\nHyperlocal AI Team`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Service approval email sent:', info.response);
  } catch (error) {
    console.error('Error sending service approval email:', error);
  }
};

export const sendServiceRejectionEmail = async (email, name, serviceName, adminNotes) => {
  try {
    const transporter = getTransporter();

    // Email content
    const mailOptions = {
      from: `"Hyperlocal AI" <${process.env.MAIL_USER}>`, // sender name + email
      to: email,
      subject: 'Service Application Update - Hyperlocal AI',
      text: `Dear ${name},\n\nWe regret to inform you that your service "${serviceName}" has been rejected.\n\n${adminNotes ? `Admin Notes: ${adminNotes}\n\n` : ''}You can update your service details and resubmit it for approval from your provider dashboard.\n\nBest regards,\nHyperlocal AI Team`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Service rejection email sent:', info.response);
  } catch (error) {
    console.error('Error sending service rejection email:', error);
  }
};

export const sendBookingApprovalEmail = async (email, name, serviceName, providerNotes) => {
  try {
    const transporter = getTransporter();

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

View your bookings: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard

Thank you for choosing Hyperlocal AI!

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking approval email sent:', info.response);
  } catch (error) {
    console.error('Error sending booking approval email:', error);
  }
};

export const sendBookingRejectionEmail = async (email, name, serviceName, providerNotes) => {
  try {
    const transporter = getTransporter();

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

Browse services: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/services

We're sorry for any inconvenience this may have caused.

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking rejection email sent successfully:', info.response);
  } catch (error) {
    console.error('Error sending booking rejection email:', error);
  }
};

export const sendBookingScheduledEmail = async (email, name, serviceName, date, time) => {
  try {
    const transporter = getTransporter();

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

View your bookings: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard

Thank you for choosing Hyperlocal AI!

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking scheduled email sent:', info.response);
  } catch (error) {
    console.error('Error sending booking scheduled email:', error);
  }
};

export const sendBookingInProgressEmail = async (email, name, serviceName) => {
  try {
    const transporter = getTransporter();

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

Track progress: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard

Thank you for your patience. We're working hard to complete your service.

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking in progress email sent:', info.response);
  } catch (error) {
    console.error('Error sending booking in progress email:', error);
  }
};

export const sendBookingCompletedEmail = async (email, name, serviceName, bookingId) => {
  try {
    const transporter = getTransporter();

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
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/services"
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                Book Again
              </a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
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

Leave a review: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard

🔄 Book Again:
Satisfied with the service? Book again or explore other services in your area.

Book again: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/services
View bookings: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard

Thank you for trusting Hyperlocal AI with your service needs!

Best regards,
Hyperlocal AI Team
support@hyperlocalai.com`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking completed email sent:', info.response);
  } catch (error) {
    console.error('Error sending booking completed email:', error);
  }
};
