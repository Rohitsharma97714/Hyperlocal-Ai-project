# TODO: Add Email Notifications for Booking Status Updates

## Tasks
- [x] Add `sendBookingScheduledEmail` function to `backend/src/utils/sendEmail.js`
- [x] Add `sendBookingInProgressEmail` function to `backend/src/utils/sendEmail.js`
- [x] Add `sendBookingCompletedEmail` function to `backend/src/utils/sendEmail.js`
- [x] Update `backend/src/routes/booking.js` to call specific email functions for scheduled, in_progress, completed statuses
- [ ] Test email templates for responsiveness and branding consistency
- [ ] Verify review link in completed email directs to correct frontend page
- [ ] Ensure no impact on existing 'approved' email functionality
