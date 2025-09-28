# Booking System Update - Review Submission & Email Fix

## Backend Changes
- [x] Add POST `/bookings/:id/review` route in `booking.js` for review submission
- [x] Validate booking status is 'completed' and user hasn't reviewed
- [x] Update booking status to 'reviewed' after review submission

## Frontend Changes
- [ ] Add `submitReview` function to `auth.js` API
- [ ] Update UserDashboard.jsx to show review form for completed bookings
- [ ] Add review form with rating (1-5 stars) and comment fields

## Email Debugging
- [ ] Check environment variables (MAIL_USER, MAIL_PASS)
- [ ] Verify Gmail app password setup
- [ ] Add better error logging for email failures

## Testing
- [ ] Test complete booking flow: creation → approval → completion → review
- [ ] Verify email notifications work for approval/rejection
