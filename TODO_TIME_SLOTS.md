# TODO: Add Predefined Time Slots to Booking Form

## Tasks
- [x] Modify frontend/src/components/BookingForm.jsx to use hardcoded predefined time slots instead of fetching from backend
- [x] Remove fetchAvailableSlots function and related useEffect
- [x] Add predefined time slots from 8:00 AM to 8:00 PM (e.g., 08:00, 09:00, ..., 20:00)
- [x] Update the time select to populate with the hardcoded slots
- [ ] Test the booking form to ensure time slots appear in dropdown

## Notes
- User requested not to fetch from backend as slots were not appearing in dropdown
- Keeping it simple with static predefined times for now
