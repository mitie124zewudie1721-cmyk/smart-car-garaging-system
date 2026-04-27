# Feedback Submit Button Fix

## Issue
The "Submit Feedback" button was not working when clicked. The form appeared to do nothing when submitted.

## Root Cause
The feedback form was using `react-hook-form` for validation, but the rating field (which is set by clicking stars) was not properly registered with the form. The rating value was being stored in local state (`feedbackRating`) and set via `setValue`, but the form validation couldn't access it properly because there was no actual input field registered.

## Solution
Added a hidden input field for the rating that is properly registered with `react-hook-form`:

```typescript
<input type="hidden" {...registerFeedback('rating', { valueAsNumber: true })} />
```

This allows the form to:
1. Track the rating value properly
2. Validate that a rating has been selected
3. Submit the rating with the form data

## Changes Made

### 1. Car Owner Disputes Page (`frontend/src/pages/CarOwner/Disputes.tsx`)

**Added**:
- Hidden input field for rating registration
- Required indicator (*) on rating label
- Helper text when no rating is selected
- `shouldValidate: true` option when setting rating value

**Updated `handleRatingClick`**:
```typescript
const handleRatingClick = (rating: number) => {
    setFeedbackRating(rating);
    setFeedbackValue('rating', rating, { shouldValidate: true });
};
```

**Added to form**:
```typescript
<input type="hidden" {...registerFeedback('rating', { valueAsNumber: true })} />
```

### 2. Garage Owner Disputes Page (`frontend/src/pages/GarageOwner/Disputes.tsx`)

**Same changes as Car Owner page**:
- Hidden input field for rating
- Required indicator on label
- Helper text for no rating
- Validation trigger on rating click

## How It Works Now

1. User clicks on a star (1-5)
2. `handleRatingClick` is called
3. Visual state updates (`feedbackRating`)
4. Form value is set with validation (`setFeedbackValue`)
5. Hidden input field is updated
6. User fills in comment
7. User clicks "Submit Feedback"
8. Form validates both rating and comment
9. If valid, `onSubmitFeedback` is called
10. API request is made
11. Success/error toast is shown

## Validation Rules

**Rating**:
- Required (must be 1-5)
- Type: number
- Validated on star click

**Comment**:
- Required
- Minimum: 10 characters
- Maximum: 500 characters
- Validated on blur and submit

## User Experience Improvements

1. **Visual Feedback**:
   - Stars turn yellow when selected
   - Helper text shows "Please select a rating" when none selected
   - Error messages display below stars if validation fails

2. **Button State**:
   - Disabled when `feedbackRating === 0` (no rating selected)
   - Shows loading state during submission
   - Prevents double submission

3. **Form Reset**:
   - Rating resets to 0 when modal closes
   - Form fields are cleared
   - Error messages are cleared

## Testing

### Test Steps:
1. ✅ Open a resolved dispute
2. ✅ Click "Leave Feedback"
3. ✅ Try to submit without selecting stars (should be disabled)
4. ✅ Click on a star (1-5)
5. ✅ Try to submit without comment (should show error)
6. ✅ Enter comment less than 10 characters (should show error)
7. ✅ Enter valid comment (10+ characters)
8. ✅ Click "Submit Feedback"
9. ✅ Verify success toast appears
10. ✅ Verify modal closes
11. ✅ Verify feedback is saved in database

### Expected Behavior:
- Button is disabled until rating is selected
- Form validates on submit
- Success toast shows on successful submission
- Modal closes after submission
- Feedback is saved to database
- User cannot submit duplicate feedback

## Files Modified

1. `frontend/src/pages/CarOwner/Disputes.tsx`
   - Added hidden input for rating
   - Updated handleRatingClick with validation
   - Added helper text and required indicator

2. `frontend/src/pages/GarageOwner/Disputes.tsx`
   - Added hidden input for rating
   - Updated handleRatingClick with validation
   - Added helper text and required indicator

## Status
✅ Fix implemented
✅ Both car owner and garage owner pages updated
✅ Ready for testing
