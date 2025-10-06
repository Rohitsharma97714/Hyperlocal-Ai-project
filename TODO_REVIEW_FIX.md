# TODO: Fix "Write Review" Functionality

## Tasks
1. **Backend: Modify review route to fetch booking by both booking ID and user ID**
   - Update the query in POST /bookings/:id/review to include user ID for security
2. **Backend: Change status check to case-insensitive**
   - Normalize booking status before comparison in review route
3. **Backend: Add service ID to review object**
   - Include service ID when saving review to booking document
4. **Frontend: Change status check to case-insensitive**
   - Update ServiceSummary.jsx to check booking status case-insensitively
5. **Test and verify existing functionality unaffected**
   - Ensure booking, payments, provider approvals, and email notifications work as before

## Progress
- [ ] Backend: Modify review route query
- [ ] Backend: Case-insensitive status check
- [ ] Backend: Add service ID to review
- [ ] Frontend: Case-insensitive status check
- [ ] Test review submission flow
- [ ] Verify no regressions in other features
