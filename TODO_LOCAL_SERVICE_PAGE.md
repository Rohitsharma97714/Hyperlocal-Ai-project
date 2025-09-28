# TODO: Local Service Page Updates

## Plan Breakdown and Steps

1. **[x] Implement Location-based Filter**
   - Add state for selectedLocation.
   - Dynamically extract unique locations from services data for dropdown options.
   - Add location dropdown to the search section.
   - Update filtering logic to include location matching (client-side).
   - Ensure dynamic updates without page reload.

2. **[x] Limit Service Description to 2 Lines**
   - Apply Tailwind's `line-clamp-2` class to the description paragraph in service cards.
   - Ensure full description shows in ServiceSummary modal (no change needed there).

3. **[ ] Improve Service Card Design**
   - Create a function to map service categories to appropriate icons (e.g., 🏠 for home services, 🚗 for auto, etc.).
   - Replace generic 🔧 icon with dynamic icon.
   - Enhance card styling: Add better shadows (e.g., shadow-lg), hover effects (scale/transform), rounded corners (already present, enhance if needed).

4. **[ ] Ensure Responsiveness and Overall UI/UX**
   - Verify grid layout adjusts for mobile/tablet/desktop using Tailwind classes.
   - Add subtle animations (e.g., transition-transform on hover).
   - Maintain consistent fonts, spacing, colors.

5. **[ ] Testing and Verification**
   - Test filters (search, category, location) work together and update cards dynamically.
   - Confirm existing functionality: Booking button, summary modal, review updates unaffected.
   - Check responsiveness across devices.
   - Run the app and verify no errors.

**Notes:**
- All changes in `frontend/src/pages/Services.jsx`.
- Use client-side filtering to avoid backend changes.
- Icons will use emojis for simplicity; can be replaced with SVG later if needed.
