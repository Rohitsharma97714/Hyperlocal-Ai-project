# Dark Mode Implementation TODO

## Core Setup
- [ ] Create `frontend/src/context/ThemeContext.jsx` with theme state, toggle function, localStorage persistence, and system preference default
- [ ] Update `frontend/tailwind.config.js` to enable dark mode with `darkMode: 'class'`
- [ ] Update `frontend/src/index.css` with CSS variables for light and dark themes, including transitions
- [ ] Update `frontend/src/App.jsx` to wrap with ThemeProvider and apply theme class to root div

## UI Components
- [ ] Update `frontend/src/components/Navbar.jsx` to add theme toggle button with icons

## Page Components
- [ ] Update `frontend/src/pages/Home.jsx` to use theme variables for backgrounds, text, buttons, cards
- [ ] Update `frontend/src/pages/Login.jsx` to use theme variables
- [ ] Update `frontend/src/pages/Register.jsx` to use theme variables
- [ ] Update `frontend/src/pages/UserDashboard.jsx` to use theme variables
- [ ] Update `frontend/src/pages/AdminDashboard.jsx` to use theme variables
- [ ] Update `frontend/src/pages/ProviderDashboard.jsx` to use theme variables
- [ ] Update `frontend/src/pages/Services.jsx` to use theme variables
- [ ] Update `frontend/src/pages/BookingDashboard.jsx` to use theme variables
- [ ] Update `frontend/src/pages/PaymentSummary.jsx` to use theme variables
- [ ] Update `frontend/src/pages/About.jsx` to use theme variables
- [ ] Update `frontend/src/pages/Contact.jsx` to use theme variables
- [ ] Update `frontend/src/pages/ForgotPassword.jsx` to use theme variables
- [ ] Update `frontend/src/pages/ResetPassword.jsx` to use theme variables
- [ ] Update `frontend/src/pages/verifyOtp.jsx` to use theme variables

## Component Updates
- [ ] Update `frontend/src/components/BookingForm.jsx` to use theme variables
- [ ] Update `frontend/src/components/Footer.jsx` to use theme variables
- [ ] Update `frontend/src/components/GoogleRoleSelection.jsx` to use theme variables
- [ ] Update `frontend/src/components/ProtectedRoute.jsx` to use theme variables
- [ ] Update `frontend/src/components/ServiceSummary.jsx` to use theme variables

## Testing and Verification
- [ ] Test theme persistence after page reload
- [ ] Verify responsiveness across all pages (mobile, tablet, desktop)
- [ ] Test on local development server
- [ ] Test on Vercel deployment
- [ ] Ensure no layout breaks or functionality issues
- [ ] Confirm all elements adapt to light/dark mode
