# 🔄 n8n Starter Plan Configuration Guide

## 📥 **Step 1: Import the Updated Workflow**

1. **Log into your n8n Cloud account**
2. **Go to Workflows**
3. **Click "Import from file"**
4. **Upload:** `n8n-workflows/ai-cold-calling-workflow.json`
5. **Click "Import"**

## 🔧 **Step 2: Configure the Set Variables Node**

The workflow now includes a **"Set Variables"** node that replaces environment variables (which aren't available on Starter plan).

### **Find the Set Variables Node**
1. **Open your imported workflow**
2. **Look for the "Set Variables" node** (second node after Schedule Calls)
3. **Click on it to edit**

### **Replace These Values**

**Click "Edit" on the Set Variables node and update:**

```
googleSheetsId: REPLACE_WITH_YOUR_GOOGLE_SHEETS_ID
→ Replace with: 1ABC123DEF456GHI789JKL_your_actual_sheet_id

twilioAccountSid: REPLACE_WITH_YOUR_TWILIO_ACCOUNT_SID  
→ Replace with: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

twilioPhoneNumber: REPLACE_WITH_YOUR_TWILIO_PHONE_NUMBER
→ Replace with: +12408130187

webhookBaseUrl: https://ai-cold-calling-system.onrender.com
→ Keep as is (already correct)

dealershipName: REPLACE_WITH_YOUR_DEALERSHIP_NAME
→ Replace with: Your Actual Dealership Name

botName: Sarah
→ Keep as is (already correct)

smtpUser: REPLACE_WITH_YOUR_GMAIL_ADDRESS
→ Replace with: youremail@gmail.com
```

## 🔑 **Step 3: Set Up Credentials (Same as Before)**

### **Credential 1: Google Sheets API**
1. **Go to Credentials → Add Credential**
2. **Select:** "Google Sheets API"
3. **Name:** `Google Sheets API`
4. **Authentication:** Service Account
5. **Service Account Email:** `[Your service account email]`
6. **Private Key:** `[Your full private key]`
7. **Click "Save"**

### **Credential 2: Twilio API**
1. **Add Credential → Twilio API**
2. **Name:** `Twilio API`
3. **Account SID:** `[Your Twilio Account SID]`
4. **Auth Token:** `[Your Twilio Auth Token]`
5. **Click "Save"**

### **Credential 3: SMTP Gmail**
1. **Add Credential → SMTP**
2. **Name:** `SMTP Gmail`
3. **Host:** `smtp.gmail.com`
4. **Port:** `587`
5. **Secure:** `false`
6. **Username:** `[Your Gmail address]`
7. **Password:** `[Your Gmail App Password]`
8. **Click "Save"**

## 📋 **Step 4: How to Get Your Values**

### **Google Sheets ID:**
1. Open your Google Sheet
2. Look at URL: `https://docs.google.com/spreadsheets/d/[COPY_THIS_PART]/edit`
3. Copy the long string between `/d/` and `/edit`

### **Twilio Account SID:**
1. Go to Twilio Console
2. Dashboard → Account Info
3. Copy "Account SID" (starts with AC...)

### **Your Phone Number:**
- Use: `+12408130187` (your Google Voice number)
- Format must be E.164: +1234567890

### **Your Gmail:**
- Use your actual Gmail address
- Make sure you have Gmail App Password set up

## 🧪 **Step 5: Test the Workflow**

### **Test Set Variables Node:**
1. **Click on "Set Variables" node**
2. **Click "Test step"**
3. **Should show all your configured values**

### **Test Google Sheets Read:**
1. **Click on "Read Leads from Google Sheets" node**
2. **Click "Test step"**
3. **Should return data from your sheet**

### **Test Complete Workflow:**
1. **Click "Execute Workflow"**
2. **Watch each node turn green**
3. **Check for any error messages**

## 🔗 **Step 6: Verify Node Connections**

The workflow should flow like this:
```
1. Schedule Calls (Cron)
2. Set Variables (Set) ← NEW NODE
3. Read Leads from Google Sheets
4. Filter Pending Leads
5. Process One Lead at a Time
6. Update Call Status to In Progress
7. Initiate Twilio Call
8. Webhook - Call Completed
9. Update Call Results
10. Check if Should Send Email
11. Send Similar Cars Email
12. Mark Email as Sent
```

## 🎯 **Step 7: Get Your Webhook URL**

1. **Click on "Webhook - Call Completed" node**
2. **Copy the webhook URL** (should be something like):
   `https://theaisalesexpert.app.n8n.cloud/webhook/call-completed`

3. **Add this to your Render.com environment variables:**
   ```
   N8N_WEBHOOK_URL=https://theaisalesexpert.app.n8n.cloud
   ```

## ✅ **Verification Checklist**

- [ ] Workflow imported successfully
- [ ] Set Variables node configured with your actual values
- [ ] All 3 credentials created and working
- [ ] Google Sheets node can read your data
- [ ] Twilio call node configured correctly
- [ ] Email node has SMTP credentials
- [ ] Webhook URL copied for Render app
- [ ] Test execution completes without errors

## 🚨 **Common Issues**

**Set Variables Node Errors:**
- Make sure all REPLACE_WITH_YOUR_* values are updated
- Check that Google Sheets ID is correct
- Verify Twilio Account SID format

**Google Sheets Not Reading:**
- Check service account has access to sheet
- Verify sheet ID is correct
- Make sure sheet has the right column headers

**Twilio Call Fails:**
- Check Account SID and Auth Token in credentials
- Verify phone number format (+1234567890)
- Make sure webhook URL is correct

Your n8n workflow is now configured to work with the Starter plan! No environment variables needed - everything is stored in the Set Variables node.

Ready to test your first AI call?
