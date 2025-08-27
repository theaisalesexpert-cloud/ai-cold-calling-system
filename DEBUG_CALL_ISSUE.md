# 🔍 Debug Call Issue - Step by Step

## 🎯 **Current Issue**
- Calls are initiated successfully
- Phone rings but customer hears nothing
- Results in missed calls

## 🧪 **Step-by-Step Debugging**

### **Step 1: Test TwiML Generation**
```bash
curl https://ai-cold-calling-system.onrender.com/webhook/twilio/test-twiml
```

**Expected Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Hello! This is a test...</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">Thank you for testing. Goodbye!</Say>
  <Hangup/>
</Response>
```

### **Step 2: Test Voice Webhook**
```bash
curl -X POST https://ai-cold-calling-system.onrender.com/webhook/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST123&From=+1234567890&To=+441218161111"
```

**Expected Response:** TwiML XML with greeting

### **Step 3: Check Twilio Console Configuration**

1. **Go to Twilio Console** → Phone Numbers → Active Numbers
2. **Click your number**: `+441218161111`
3. **Verify Voice Configuration:**
   - **Webhook URL**: `https://ai-cold-calling-system.onrender.com/webhook/twilio/voice`
   - **HTTP Method**: `POST`
   - **Status Callback**: `https://ai-cold-calling-system.onrender.com/webhook/twilio/status`

### **Step 4: Test with Twilio's Test Tool**

1. **In Twilio Console** → Phone Numbers → Your Number
2. **Click "Test" next to webhook URL**
3. **Should return 200 OK with TwiML**

### **Step 5: Make Test Call and Check Logs**

1. **Make test call:**
```bash
curl -X POST https://ai-cold-calling-system.onrender.com/api/calls/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer abc123def456ghi789jkl012mno345pqr678" \
  -d '{"phoneNumber": "+YOUR_PHONE_NUMBER"}'
```

2. **Immediately check Render logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for webhook requests from Twilio

### **Step 6: Verify Customer Data**

Add test customer to Google Sheets:
```
Row 2: CUST_001,Test Customer,+YOUR_PHONE_NUMBER,test@example.com,2023 Test Car,new,2024-01-15
```

## 🔧 **Quick Fixes to Try**

### **Fix 1: Temporary Simple Webhook**

Set Twilio webhook to this test URL temporarily:
```
https://ai-cold-calling-system.onrender.com/webhook/twilio/test-twiml
```

This should make the phone say "Hello! This is a test..." when answered.

### **Fix 2: Check Environment Variables**

Ensure these are set in Render:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BASE_URL=https://ai-cold-calling-system.onrender.com
```

### **Fix 3: Add Sample Customer Data**

If Google Sheets is empty, add this test data:
```
ID,Name,Phone,Email,Car Model,Status,Enquiry Date
CUST_001,John Smith,+1234567890,john@test.com,2023 Honda Accord,new,2024-01-15
CUST_002,Test Customer,+YOUR_PHONE_NUMBER,test@example.com,2023 Test Car,new,2024-01-15
```

## 🎯 **Expected Call Flow**

### **What Should Happen:**
1. **API call** → Twilio initiates call ✅
2. **Phone rings** → Customer answers ✅
3. **Twilio calls webhook** → `/webhook/twilio/voice` ❓
4. **Webhook returns TwiML** → With AI greeting ❓
5. **Customer hears** → "Hello! This is Sarah..." ❓

### **Debug Each Step:**

**Step 3 Debug:**
- Check Render logs for incoming POST to `/webhook/twilio/voice`
- Should see log: "Voice webhook received"

**Step 4 Debug:**
- Webhook should return TwiML XML
- Check for any errors in logs

**Step 5 Debug:**
- If customer still hears nothing, the issue is in TwiML content

## 🚨 **Most Likely Issues**

### **Issue 1: Webhook URL Wrong**
- **Check**: Twilio Console webhook URL
- **Fix**: Set to `https://ai-cold-calling-system.onrender.com/webhook/twilio/voice`

### **Issue 2: TwiML Generation Error**
- **Check**: Test `/webhook/twilio/test-twiml` endpoint
- **Fix**: Look for errors in Render logs

### **Issue 3: OpenAI API Failure**
- **Check**: OpenAI credits and API key
- **Fix**: The webhook now has fallback responses

### **Issue 4: Missing Customer Data**
- **Check**: Google Sheets has customer data
- **Fix**: Add test customer data

## 🧪 **Final Test**

After fixes, test with this simple webhook URL first:
```
https://ai-cold-calling-system.onrender.com/webhook/twilio/test-twiml
```

If you hear the test message, then switch back to:
```
https://ai-cold-calling-system.onrender.com/webhook/twilio/voice
```

## 📞 **Success Criteria**

✅ **TwiML test endpoint works**  
✅ **Voice webhook returns valid TwiML**  
✅ **Twilio webhook URL configured correctly**  
✅ **Customer hears AI greeting when answering call**  
✅ **Conversation flows naturally**  

---

**The most common fix is ensuring the Twilio webhook URL is exactly:**
`https://ai-cold-calling-system.onrender.com/webhook/twilio/voice`
