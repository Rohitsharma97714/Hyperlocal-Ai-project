// Utility functions for Razorpay integration
// This file contains helper functions to manage Razorpay console warnings and SVG issues

export const setupRazorpayConsoleSuppression = () => {
  // Store original console methods
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  // Suppress Razorpay-related console messages
  const suppressRazorpayLogs = (method, ...args) => {
    const message = args.join(' ');
    if (
      message.includes('Refused to get unsafe header') ||
      message.includes('x-rtb-fingerprint-id') ||
      message.includes('v2-entry.modern.js') ||
      (message.toLowerCase().includes('razorpay') && (
        message.includes('error') ||
        message.includes('warn') ||
        message.includes('log')
      ))
    ) {
      return; // Suppress the message
    }
    // Call original method for non-Razorpay messages
    method(...args);
  };

  console.warn = (...args) => suppressRazorpayLogs(originalConsoleWarn, ...args);
  console.error = (...args) => suppressRazorpayLogs(originalConsoleError, ...args);
  console.log = (...args) => suppressRazorpayLogs(originalConsoleLog, ...args);

  return {
    restore: () => {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    }
  };
};

export const injectRazorpayCSSFix = () => {
  const razorpayCSS = `
    <style id="razorpay-svg-fix">
      .razorpay-container svg[width="auto"],
      .razorpay-container svg[height="auto"] {
        width: 100% !important;
        height: auto !important;
      }
      .razorpay-container svg {
        max-width: 100%;
        height: auto;
      }
      /* Additional fixes for common SVG issues */
      .razorpay-container svg:not([width]):not([height]) {
        width: 100%;
        height: auto;
      }
    </style>
  `;

  // Inject CSS into document head if not already present
  const existingStyle = document.getElementById('razorpay-svg-fix');
  if (!existingStyle) {
    document.head.insertAdjacentHTML('beforeend', razorpayCSS);
  }

  return {
    remove: () => {
      const injectedStyle = document.getElementById('razorpay-svg-fix');
      if (injectedStyle) {
        injectedStyle.remove();
      }
    }
  };
};

export const createRazorpayOptions = (order, bookingData, onSuccess, onDismiss) => {
  return {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: 'HyperLocal AI',
    description: `Booking for ${bookingData.serviceName}`,
    order_id: order.id,
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss
    },
    prefill: {
      name: '', // You can add user name if available
      email: '', // You can add user email if available
    },
    theme: {
      color: '#14b8a6', // Teal color
    },
  };
};
