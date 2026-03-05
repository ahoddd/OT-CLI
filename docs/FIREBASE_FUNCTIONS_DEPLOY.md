# Firebase Functions — Deploy and 500 Errors

## If deploy fails with "internal error" (500)

When deploying with `firebase deploy --only functions`, you may see:

```
Failed to create function intentCreate in region us-central1
Failed to create function intentVerifyFulfillment in region us-central1
Failed to create function orbPassRedemptionHistory in region us-central1
Error: The service has encountered an internal error. Please try again later
```

These are **Google Cloud backend errors** (HTTP 500), not bugs in your code. The same functions often succeed on retry.

### What to do

1. **Retry the full deploy**
   ```bash
   cd functions && npm run build && firebase deploy --only functions
   ```
   Wait a few minutes and run again if it fails.

2. **Deploy only the failing functions** (after the rest have succeeded)
   ```bash
   firebase deploy --only functions:intentCreate,functions:intentVerifyFulfillment,functions:orbPassRedemptionHistory
   ```

3. **Temporary quota / rate limits**  
   If you see "Quota Exceeded" on other functions, wait 10–15 minutes and retry. Deploy in smaller batches if needed.

4. **Node runtime**  
   The CLI may warn that Node 20 will be deprecated; plan to upgrade to Node 22 when Firebase supports it. This does not cause the 500 errors.

No code changes are required for these three functions; retrying is the correct fix.
