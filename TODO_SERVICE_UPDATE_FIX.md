# TODO: Fix Service Update Logic for Approved Providers

## Tasks
- [x] Modify PUT route in backend/src/routes/service.js to conditionally set status to 'pending'
- [x] Add logic to fetch provider's approvalStatus
- [x] Check if current service status is 'approved' and provider is 'approved'
- [x] Only set status to 'pending' if conditions are not met
- [ ] Test the change to ensure approved services stay approved when edited by approved providers

## Details
- Current issue: Approved providers editing approved services causes status to revert to pending
- Solution: Only set to pending if provider is not approved OR service was not previously approved
- Files to modify: backend/src/routes/service.js
- Logic: If provider.approvalStatus === 'approved' && service.status === 'approved', keep status as is
