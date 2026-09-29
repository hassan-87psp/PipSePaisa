PipSePaisa payment/course/broker fix

1. Run 47_PAYMENT_METHODS_SAVE_AND_VISIBILITY_FIX.sql in Supabase.
2. Upload the COMPLETE ZIP contents.
3. Clear hosting/CDN cache and hard refresh.

Fixed:
- Course enrollment always starts with the 'Are you already a PipSePaisa user?' choice.
- Signed-in users choosing Yes proceed directly to enrollment details.
- Payment methods now save with the required database 'name' value.
- Enabled payment methods are readable on the public paid-course enrollment form.
- Every broker comparison row is clickable.
- DPrime and Exness comparison logos replaced with clean wordmarks.
