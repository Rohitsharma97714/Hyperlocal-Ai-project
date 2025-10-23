// src/utils/queue.js - Simple in-memory queue (no Redis required)
import { 
  sendOTPEmail, 
  sendBookingApprovalEmail, 
  sendBookingRejectionEmail, 
  sendBookingScheduledEmail, 
  sendBookingInProgressEmail, 
  sendBookingCompletedEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendServiceApprovalEmail,
  sendServiceRejectionEmail,
  sendResetPasswordEmail
} from './sendEmail.js';

console.log('🚀 Starting simple in-memory queue system (no Redis required)');

// Simple in-memory queue implementation
class SimpleQueue {
  constructor(name) {
    this.name = name;
    this.jobs = [];
    this.isProcessing = false;
    this.processor = null;
    console.log(`✅ ${name} queue initialized`);
  }

  async add(data) {
    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: new Date()
    };
    
    this.jobs.push(job);
    console.log(`📧 Added job to ${this.name} queue:`, { 
      id: job.id, 
      type: data.type,
      email: data.data?.email 
    });
    
    // Start processing if not already running
    this.process();
    
    return job;
  }

  process() {
    if (this.isProcessing || !this.processor || this.jobs.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    const processNext = async () => {
      if (this.jobs.length === 0) {
        this.isProcessing = false;
        return;
      }

      const job = this.jobs.shift();
      console.log(`🔄 Processing job ${job.id} in ${this.name} queue`);

      try {
        await this.processor(job);
        console.log(`✅ Job ${job.id} completed successfully`);
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error.message);
        // Retry logic could be added here
      }

      // Process next job after a short delay
      setTimeout(processNext, 100);
    };

    processNext();
  }

  setProcessor(processor) {
    this.processor = processor;
  }

  getJobCounts() {
    return {
      waiting: this.jobs.length,
      active: this.isProcessing ? 1 : 0,
      completed: 0, // Not tracking completed in this simple version
      failed: 0,    // Not tracking failed in this simple version
      delayed: 0
    };
  }

  async close() {
    console.log(`🔒 ${this.name} queue closed`);
    this.jobs = [];
    this.isProcessing = false;
  }

  async pause() {
    console.log(`⏸️ ${this.name} queue paused`);
    this.isProcessing = false;
  }
}

// Create queues
const emailQueue = new SimpleQueue('email');
const notificationQueue = new SimpleQueue('notification');

// Email job processor
emailQueue.setProcessor(async (job) => {
  const { type, data } = job.data;

  try {
    console.log(`📧 Processing email job: ${type}`, { 
      email: data.email, 
      type: type 
    });

    let result;
    switch (type) {
      case 'send_otp':
        result = await sendOTPEmail(data.email, data.otp);
        break;
      case 'reset_password':
        result = await sendResetPasswordEmail(data.email, data.resetUrl);
        break;
      case 'provider_approval':
        result = await sendApprovalEmail(data.email, data.name, data.adminNotes);
        break;
      case 'provider_rejection':
        result = await sendRejectionEmail(data.email, data.name, data.adminNotes);
        break;
      case 'service_approval':
        result = await sendServiceApprovalEmail(data.email, data.name, data.serviceName, data.adminNotes);
        break;
      case 'service_rejection':
        result = await sendServiceRejectionEmail(data.email, data.name, data.serviceName, data.adminNotes);
        break;
      case 'booking_approval':
        result = await sendBookingApprovalEmail(data.email, data.name, data.serviceName, data.notes);
        break;
      case 'booking_rejection':
        result = await sendBookingRejectionEmail(data.email, data.name, data.serviceName, data.notes);
        break;
      case 'booking_scheduled':
        result = await sendBookingScheduledEmail(data.email, data.name, data.serviceName, data.date, data.time);
        break;
      case 'booking_in_progress':
        result = await sendBookingInProgressEmail(data.email, data.name, data.serviceName);
        break;
      case 'booking_completed':
        result = await sendBookingCompletedEmail(data.email, data.name, data.serviceName, data.bookingId);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    if (result && !result.success) {
      throw new Error(result.error || `Email job ${type} failed`);
    }

    console.log(`✅ Email job completed: ${type}`);
    return { success: true, type, data };
  } catch (error) {
    console.error(`❌ Email job failed: ${type}`, error.message);
    throw error;
  }
});

// Notification job processor
notificationQueue.setProcessor(async (job) => {
  const { type, data, io } = job.data;

  try {
    console.log(`🔔 Processing notification job: ${type}`);

    // Simple notification logging
    console.log(`🔔 Notification: ${type}`, data);
    
    return { success: true, type, data };
  } catch (error) {
    console.error(`🔔 Notification job failed: ${type}`, error.message);
    throw error;
  }
});

// Helper functions to add jobs to queues
export const addEmailJob = async (type, data) => {
  try {
    console.log(`📧 Adding email job to queue: ${type}`, { 
      email: data.email, 
      type: type 
    });
    
    const job = await emailQueue.add({ type, data });
    console.log(`✅ Email job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    console.error(`❌ Failed to add email job to queue: ${type}`, error.message);
    
    // Emergency fallback: Try to send email directly
    console.log(`🔄 Attempting direct email send for: ${type}`);
    try {
      let result;
      switch (type) {
        case 'send_otp':
          result = await sendOTPEmail(data.email, data.otp);
          break;
        case 'booking_approval':
          result = await sendBookingApprovalEmail(data.email, data.name, data.serviceName, data.notes);
          break;
        case 'booking_rejection':
          result = await sendBookingRejectionEmail(data.email, data.name, data.serviceName, data.notes);
          break;
        case 'booking_scheduled':
          result = await sendBookingScheduledEmail(data.email, data.name, data.serviceName, data.date, data.time);
          break;
        case 'booking_in_progress':
          result = await sendBookingInProgressEmail(data.email, data.name, data.serviceName);
          break;
        case 'booking_completed':
          result = await sendBookingCompletedEmail(data.email, data.name, data.serviceName, data.bookingId);
          break;
        default:
          console.error(`Unknown email type for fallback: ${type}`);
          return null;
      }
      
      if (result && result.success) {
        console.log(`✅ Direct email sent successfully: ${type}`);
        return { id: 'direct-send', type, success: true };
      } else {
        console.error(`❌ Direct email failed: ${type}`, result?.error);
        return { id: 'direct-send-failed', type, success: false, error: result?.error };
      }
    } catch (fallbackError) {
      console.error(`❌ Direct email fallback also failed: ${type}`, fallbackError.message);
      return { id: 'direct-send-failed', type, success: false, error: fallbackError.message };
    }
  }
};

export const addNotificationJob = async (type, data, io) => {
  try {
    console.log(`🔔 Adding notification job to queue: ${type}`);
    const job = await notificationQueue.add({ type, data, io });
    console.log(`✅ Notification job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    console.error(`❌ Failed to add notification job: ${type}`, error.message);
    return null;
  }
};

// Get queue status
export const getQueueStatus = async () => {
  try {
    const emailStats = emailQueue.getJobCounts();
    const notificationStats = notificationQueue.getJobCounts();
    
    return {
      email: emailStats,
      notification: notificationStats,
      status: 'active'
    };
  } catch (error) {
    console.error('Error getting queue status:', error.message);
    return {
      email: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      notification: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      status: 'error',
      error: error.message
    };
  }
};

// Test queue connectivity
export const testQueueConnection = async () => {
  try {
    const status = await getQueueStatus();
    console.log('✅ Queue system ready:', status);
    return { success: true, status };
  } catch (error) {
    console.error('Queue connection test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down queues gracefully...');
  
  try {
    await emailQueue.close();
    await notificationQueue.close();
    console.log('✅ Queues shut down successfully');
  } catch (error) {
    console.error('❌ Error during queue shutdown:', error.message);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Initialize queue on startup
setTimeout(() => {
  testQueueConnection().then(result => {
    console.log('🎯 Simple queue system ready! Booking status emails should now work.');
  });
}, 500);

export { emailQueue, notificationQueue };