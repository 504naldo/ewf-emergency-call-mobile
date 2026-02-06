# Twilio Studio Flow Integration Guide

This document describes how to configure Twilio Studio Flow to integrate with the EWF Emergency Call Service routing engine.

## Overview

The Twilio Studio Flow handles incoming emergency calls and routes them through the on-call ladder using the EWF backend API. The flow automatically tries each technician in sequence until someone answers, with configurable timeouts and retry logic.

## Architecture

```
Incoming Call → Studio Flow → next-target API → Connect Call → Technician
                      ↓                              ↓
                  Create Incident              No Answer/Busy
                      ↓                              ↓
                  Loop until answered         attempt-failed API
                      ↓                              ↓
                  answered API                Loop back to next-target
                      ↓
                  Wait for call end
                      ↓
                  completed API
```

## API Endpoints

All endpoints are secured with Twilio signature verification or shared secret authentication.

### Base URL
```
https://your-backend-url.com/api/telephony
```

### 1. POST /next-target

Returns the next phone number to call in the routing ladder.

**Request Body:**
```json
{
  "incidentId": 123,           // Optional - will create if not provided
  "callerPhone": "+14155551234", // E.164 format
  "callSid": "CA1234567890abcdef"
}
```

**Response:**
```json
{
  "incidentId": 123,
  "nextPhoneE164": "+14155559999",
  "stepName": "primary_oncall",
  "timeoutSeconds": 30,
  "userName": "John Smith"
}
```

**Response when exhausted:**
```json
{
  "incidentId": 123,
  "nextPhoneE164": null,
  "stepName": "exhausted",
  "timeoutSeconds": 0,
  "userName": null
}
```

### 2. POST /answered

Called when a technician answers the call.

**Request Body:**
```json
{
  "incidentId": 123,
  "answeredPhone": "+14155559999",
  "callSid": "CA1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true
}
```

### 3. POST /completed

Called when the call ends.

**Request Body:**
```json
{
  "incidentId": 123,
  "callSid": "CA1234567890abcdef",
  "duration": 180  // seconds
}
```

**Response:**
```json
{
  "success": true
}
```

### 4. POST /attempt-failed

Called when a call attempt fails (no answer, busy, failed).

**Request Body:**
```json
{
  "incidentId": 123,
  "targetPhone": "+14155559999",
  "reason": "no-answer",  // "no-answer" | "busy" | "failed"
  "callSid": "CA1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true
}
```

## Routing Logic

### Business Hours Ladder
1. **primary_oncall** - Primary on-call technician
2. **secondary** - Secondary on-call technician
3. **admin** - All admins
4. **manager** - All managers
5. **broadcast** - Broadcast to all (not implemented in Twilio flow)

### After Hours Ladder
1. **primary_oncall** - Primary on-call technician
2. **secondary** - Secondary on-call technician
3. **manager** - All managers
4. **admin** - All admins
5. **rotating_pool** - Next 3 eligible techs from rotating pool (sequential)

### Exclusions
- Users marked as **unavailable** are automatically excluded
- Users marked as **inactive** are automatically excluded
- Users already attempted for this incident are excluded
- Users without phone numbers are excluded

## Twilio Studio Flow Configuration

### Step 1: Trigger - Incoming Call

**Widget:** Incoming Call
- This is the entry point for all emergency calls

### Step 2: HTTP Request - Get Next Target

**Widget:** Make HTTP Request
- **Method:** POST
- **URL:** `https://your-backend-url.com/api/telephony/next-target`
- **Content Type:** application/json
- **Request Body:**
```liquid
{
  "incidentId": {{widgets.get_next_target.parsed.incidentId | default: null}},
  "callerPhone": "{{trigger.call.From}}",
  "callSid": "{{trigger.call.CallSid}}"
}
```
- **Headers:**
  - `Authorization: Bearer YOUR_WEBHOOK_SECRET` (if not using Twilio signature)
  - `X-Twilio-Signature: {{trigger.request.headers.X-Twilio-Signature}}` (automatically added)

**Save Response As:** `get_next_target`

### Step 3: Split - Check if Target Available

**Widget:** Split Based On...
- **Variable:** `{{widgets.get_next_target.parsed.nextPhoneE164}}`
- **Conditions:**
  - **If nextPhoneE164 is not null:** Go to "Connect Call To"
  - **Else (exhausted):** Go to "Say - No Techs Available"

### Step 4a: Connect Call To

**Widget:** Connect Call To
- **Phone Number:** `{{widgets.get_next_target.parsed.nextPhoneE164}}`
- **Timeout:** `{{widgets.get_next_target.parsed.timeoutSeconds}}` seconds
- **Caller ID:** `{{trigger.call.From}}`

**Transitions:**
- **On Answered:** Go to "HTTP Request - Call Answered"
- **On No Answer:** Go to "HTTP Request - Attempt Failed (No Answer)"
- **On Busy:** Go to "HTTP Request - Attempt Failed (Busy)"
- **On Failed:** Go to "HTTP Request - Attempt Failed (Failed)"

### Step 4b: Say - No Techs Available

**Widget:** Say/Play
- **Message:** "We're sorry, all technicians are currently unavailable. Please call back or contact emergency services if this is urgent."
- **Voice:** Polly.Joanna
- **Language:** en-US

**Transition:** Go to "Hangup"

### Step 5a: HTTP Request - Call Answered

**Widget:** Make HTTP Request
- **Method:** POST
- **URL:** `https://your-backend-url.com/api/telephony/answered`
- **Content Type:** application/json
- **Request Body:**
```liquid
{
  "incidentId": {{widgets.get_next_target.parsed.incidentId}},
  "answeredPhone": "{{widgets.get_next_target.parsed.nextPhoneE164}}",
  "callSid": "{{trigger.call.CallSid}}"
}
```

**Transition:** Go to "Wait for Call End"

### Step 5b: HTTP Request - Attempt Failed

**Widget:** Make HTTP Request
- **Method:** POST
- **URL:** `https://your-backend-url.com/api/telephony/attempt-failed`
- **Content Type:** application/json
- **Request Body (No Answer):**
```liquid
{
  "incidentId": {{widgets.get_next_target.parsed.incidentId}},
  "targetPhone": "{{widgets.get_next_target.parsed.nextPhoneE164}}",
  "reason": "no-answer",
  "callSid": "{{trigger.call.CallSid}}"
}
```

**Note:** Create separate widgets for "busy" and "failed" with appropriate reason values.

**Transition:** Loop back to "HTTP Request - Get Next Target"

### Step 6: Wait for Call End

**Widget:** Say/Play (with long pause) OR use Twilio's built-in call monitoring
- This step waits for the call to complete naturally
- The technician and caller are now connected

**On Call Ended:** Go to "HTTP Request - Call Completed"

### Step 7: HTTP Request - Call Completed

**Widget:** Make HTTP Request
- **Method:** POST
- **URL:** `https://your-backend-url.com/api/telephony/completed`
- **Content Type:** application/json
- **Request Body:**
```liquid
{
  "incidentId": {{widgets.get_next_target.parsed.incidentId}},
  "callSid": "{{trigger.call.CallSid}}",
  "duration": {{trigger.call.CallDuration}}
}
```

**Transition:** Go to "Hangup"

### Step 8: Hangup

**Widget:** Hangup
- End the call

## Flow Diagram (Text)

```
[Incoming Call]
       ↓
[HTTP: Get Next Target]
       ↓
[Split: Target Available?]
   ↙        ↘
[Yes]      [No]
   ↓          ↓
[Connect]  [Say: No Techs]
   ↓          ↓
[Split: Call Result?]  [Hangup]
   ↙    ↓    ↘
[Answered] [No Answer/Busy/Failed]
   ↓          ↓
[HTTP: Answered]  [HTTP: Attempt Failed]
   ↓          ↓
[Wait for End]  [Loop back to Get Next Target]
   ↓
[HTTP: Completed]
   ↓
[Hangup]
```

## Security

### Method 1: Twilio Signature Verification (Recommended)

Twilio automatically signs all webhook requests with the `X-Twilio-Signature` header. The backend verifies this signature using your Twilio Auth Token.

**Setup:**
1. Set `TWILIO_AUTH_TOKEN` environment variable in your backend
2. Twilio will automatically add the signature header
3. Backend will verify the signature on each request

### Method 2: Shared Secret (Fallback)

If Twilio signature verification is not configured, use a shared secret in the Authorization header.

**Setup:**
1. Set `WEBHOOK_SECRET` environment variable in your backend
2. Add `Authorization: Bearer YOUR_SECRET` header to all HTTP requests in Studio Flow
3. Backend will verify the secret on each request

## Environment Variables

Add these to your backend environment:

```bash
# Twilio signature verification (recommended)
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

# OR shared secret fallback
WEBHOOK_SECRET=your_webhook_secret_here

# Database and other config
DATABASE_URL=mysql://...
JWT_SECRET=your_jwt_secret_here
```

## Testing

### 1. Test next-target endpoint

```bash
curl -X POST https://your-backend-url.com/api/telephony/next-target \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{
    "callerPhone": "+14155551234",
    "callSid": "TEST123"
  }'
```

Expected response:
```json
{
  "incidentId": 1,
  "nextPhoneE164": "+14155559999",
  "stepName": "primary_oncall",
  "timeoutSeconds": 30,
  "userName": "John Smith"
}
```

### 2. Test answered endpoint

```bash
curl -X POST https://your-backend-url.com/api/telephony/answered \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{
    "incidentId": 1,
    "answeredPhone": "+14155559999",
    "callSid": "TEST123"
  }'
```

### 3. Test completed endpoint

```bash
curl -X POST https://your-backend-url.com/api/telephony/completed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{
    "incidentId": 1,
    "callSid": "TEST123",
    "duration": 180
  }'
```

### 4. Test attempt-failed endpoint

```bash
curl -X POST https://your-backend-url.com/api/telephony/attempt-failed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{
    "incidentId": 1,
    "targetPhone": "+14155559999",
    "reason": "no-answer",
    "callSid": "TEST123"
  }'
```

## Troubleshooting

### Issue: All endpoints return 401 Unauthorized

**Solution:** Check that either `TWILIO_AUTH_TOKEN` or `WEBHOOK_SECRET` is set correctly in your backend environment.

### Issue: next-target returns null phone number immediately

**Solution:** Check that:
1. Users exist in the database with phone numbers
2. Users are marked as `available=true` and `active=true`
3. On-call schedules are configured correctly
4. Business hours configuration is correct

### Issue: Calls not connecting to technicians

**Solution:** Verify that:
1. Phone numbers are in E.164 format (+14155551234)
2. Twilio has permission to call those numbers
3. Technicians' phones are turned on and have service

### Issue: Loop continues even after answer

**Solution:** Check that:
1. The "answered" endpoint is being called correctly
2. The phone number matches exactly (including country code)
3. The incident status is being updated in the database

## Monitoring

### Database Tables

Monitor these tables for call routing activity:

- **incidents** - All emergency incidents
- **call_attempts** - Each routing attempt with result
- **incident_events** - Audit trail of all events

### Key Metrics

- **Time to answer** - Time from incident creation to first answer
- **Attempts per incident** - Number of routing attempts before answer
- **Exhausted incidents** - Incidents where no one answered
- **Average call duration** - Duration of answered calls

### Logs

Check backend logs for:
- `[Twilio] next-target request` - Each routing attempt
- `[Twilio] Next target` - Selected phone number
- `[Twilio] Call answered by` - Successful answer
- `[Twilio] No more targets available` - Routing exhausted

## Support

For issues or questions:
- Check backend logs for error messages
- Verify environment variables are set correctly
- Test endpoints directly with curl before deploying to Twilio
- Contact your system administrator for database access
