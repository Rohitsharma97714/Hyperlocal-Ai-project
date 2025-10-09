# TODO: Implement Google OAuth 2.0 Authentication

## Backend Changes
- [ ] Install required packages: passport, passport-google-oauth20, express-session
- [ ] Update backend/.env with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BACKEND_URL, FRONTEND_URL
- [ ] Update backend/src/models/User.js: add profilePicture, isGoogleUser fields, skip password validation for Google users
- [ ] Update backend/server.js: add Passport middleware, session, MongoDB serialization/deserialization
- [ ] Update backend/src/routes/auth.js: add Google OAuth strategy, /google and /google/callback routes

## Frontend Changes
- [ ] Install react-toastify for success toast
- [ ] Create frontend/src/components/GoogleRoleSelection.js component
- [ ] Update frontend/src/pages/Login.jsx: include GoogleRoleSelection, add useEffect for URL params handling

## Testing
- [ ] Test Google OAuth flow
- [ ] Verify existing email/password login still works
- [ ] Verify role-based navigation
- [ ] Verify JWT token with serverKey and 7-day expiry
- [ ] Verify Google users get 'customer' role and isApproved: true
- [ ] Verify redirect URL and error handling
