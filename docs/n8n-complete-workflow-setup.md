# 🚀 Complete n8n Workflow Setup Guide

Step-by-step guide to import and configure your complete AI Cold-Calling workflow.

## 📋 **What You Get**

### **Complete Workflow Features:**
✅ **Automated daily calling** (9 AM weekdays)  
✅ **Customer data management** via Google Sheets  
✅ **Individual call processing** (one by one)  
✅ **Call success tracking** and status updates  
✅ **Daily statistics** and email reports  
✅ **Manual call triggers** via webhooks  
✅ **Bulk calling** capability  
✅ **Error handling** and retry logic  

### **11 Configured Nodes:**
1. **Daily Call Trigger** (Cron)
2. **Set Configuration** (Credentials)
3. **Get Customer Data** (Google Sheets)
4. **Filter Ready Customers** (Filter)
5. **Process One by One** (Split in Batches)
6. **Initiate AI Call** (HTTP Request)
7. **Wait Between Calls** (Wait)
8. **Check Call Success** (IF)
9. **Update Call Success/Failed** (Google Sheets)
10. **Get Statistics** (HTTP Request)
11. **Send Daily Report** (Email)

## 🔧 **Step 1: Import Workflow**

### **Import the JSON File:**
1. **Open n8n** in your browser
2. **Click "+" → "Import from File"**
3. **Select**: `n8n-workflow-complete.json`
4. **Click "Import"**
5. **Workflow will appear** with all nodes connected

### **Alternative: Copy-Paste Method:**
1. **Open n8n** → New Workflow
2. **Click "..." → "Import from Clipboard"**
3. **Copy entire contents** of `n8n-workflow-complete.json`
4. **Paste and import**

## ⚙️ **Step 2: Configure Set Configuration Node**

### **Critical: Update These Values**

**Double-click "Set Configuration" node and update:**

```javascript
{
  "BASE_URL": "https://YOUR-APP-NAME.onrender.com",
  "GOOGLE_SHEETS_ID": "YOUR_GOOGLE_SHEET_ID_HERE",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL": "your-service@project.iam.gserviceaccount.com",
  "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----",
  "GMAIL_USER": "your-email@gmail.com",
  "API_KEY": "your_actual_api_key_here"
}
```

### **How to Get Each Value:**

#### **BASE_URL:**
- Go to Render dashboard
- Copy your app URL: `https://ai-cold-calling-system.onrender.com`

#### **GOOGLE_SHEETS_ID:**
- Open your Google Sheet
- Copy ID from URL: `docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

#### **GOOGLE_SERVICE_ACCOUNT_EMAIL:**
- Open service account JSON file
- Copy `"client_email"` value

#### **GOOGLE_PRIVATE_KEY:**
- Open service account JSON file
- Copy `"private_key"` value (keep `\n` characters)

#### **GMAIL_USER:**
- Your Gmail address for sending reports

#### **API_KEY:**
- Same key you set in Render environment variables

## 📧 **Step 3: Configure Email Credentials**

### **Create Gmail SMTP Credential:**
1. **Go to n8n** → Credentials → Create New
2. **Select**: SMTP
3. **Configure**:
   ```
   Name: Gmail SMTP
   Host: smtp.gmail.com
   Port: 587
   Secure: true
   Username: your-email@gmail.com
   Password: your_gmail_app_password
   ```

### **Generate Gmail App Password:**
1. **Go to Google Account** → Security
2. **Enable 2-Step Verification**
3. **App passwords** → Generate new
4. **Use this password** in SMTP credential

### **Update Email Node:**
1. **Double-click "Send Daily Report" node**
2. **Select your Gmail SMTP credential**
3. **Update "toEmail"** to your admin email

## 🧪 **Step 4: Test Individual Nodes**

### **Test Set Configuration:**
1. **Click "Set Configuration" node**
2. **Click "Execute Node"**
3. **Verify all values** appear in output

### **Test Google Sheets:**
1. **Click "Get Customer Data" node**
2. **Click "Execute Node"**
3. **Should return customer data** from your sheet

### **Test API Call:**
1. **Click "Initiate AI Call" node**
2. **Click "Execute Node"**
3. **Should authenticate** with your backend

## 📊 **Step 5: Prepare Google Sheet**

### **Required Sheet Structure:**
```
A: ID | B: Name | C: Phone | D: Email | E: Car Model | F: Status | G: Enquiry Date | H: Last Call Date | I: Call Status
```

### **Sample Data:**
```
CUST_001,John Smith,+1234567890,john@test.com,2023 Honda Accord,new,2024-01-15,,
CUST_002,Jane Doe,+1987654321,jane@test.com,2024 Toyota Camry,new,2024-01-16,,
```

### **Share Sheet:**
1. **Click "Share" in Google Sheets**
2. **Add service account email**
3. **Give "Editor" permissions**

## 🔄 **Step 6: Test Complete Workflow**

### **Manual Test:**
1. **Click "Execute Workflow"**
2. **Watch each node execute**
3. **Check for any errors**
4. **Verify Google Sheet updates**

### **Expected Flow:**
```
Trigger → Set Config → Get Customers → Filter → Process One by One
    ↓
Initiate Call → Wait → Check Success → Update Status → Loop Back
    ↓
(When all done) → Get Statistics → Send Report
```

## ⏰ **Step 7: Activate Workflow**

### **Set Schedule:**
1. **Double-click "Daily Call Trigger"**
2. **Verify cron expression**: `0 9 * * 1-5` (9 AM weekdays)
3. **Adjust timezone** if needed

### **Activate:**
1. **Click "Active" toggle** (top right)
2. **Should show green "Active" status**
3. **Workflow will run automatically**

## 🌐 **Step 8: Setup Manual Triggers**

### **Manual Call Webhook:**
- **URL**: `https://your-n8n-instance.com/webhook/manual-call`
- **Method**: POST
- **Body**: `{"customerId": "CUST_001"}`

### **Bulk Call Webhook:**
- **URL**: `https://your-n8n-instance.com/webhook/bulk-call`
- **Method**: POST
- **Body**: `{"filter": "new"}`

## 🔧 **Customization Options**

### **Change Schedule:**
```javascript
// Every 2 hours on weekdays
"0 */2 * * 1-5"

// Twice daily (9 AM and 2 PM)
"0 9,14 * * 1-5"

// Every day at 10 AM
"0 10 * * *"
```

### **Adjust Wait Time:**
- **Current**: 30 seconds between calls
- **Faster**: 15 seconds
- **Slower**: 60 seconds

### **Modify Filters:**
- **Status**: Change from "new" to other statuses
- **Date**: Adjust "not called today" logic
- **Add filters**: Phone number format, region, etc.

## 📊 **Monitoring and Reports**

### **Daily Email Report Includes:**
- Total customers in database
- Customers called today
- Successful calls
- Appointments scheduled
- Call success rate
- Average call duration

### **Google Sheet Updates:**
- **Last Call Date**: Updated for each call
- **Call Status**: "call_initiated" or "call_failed"
- **Real-time tracking** of campaign progress

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **Google Sheets Permission Error:**
- Verify service account email is added to sheet
- Check private key format (keep `\n` characters)

#### **API Authentication Error:**
- Verify API_KEY matches Render environment variable
- Check BASE_URL is correct

#### **Email Sending Error:**
- Use Gmail app password, not regular password
- Verify SMTP credential configuration

#### **Workflow Not Triggering:**
- Check workflow is activated
- Verify cron expression
- Check n8n timezone settings

## ✅ **Success Checklist**

- [ ] **Workflow imported** successfully
- [ ] **Set Configuration** updated with your values
- [ ] **Gmail SMTP credential** configured
- [ ] **Google Sheet** shared with service account
- [ ] **Individual nodes** execute without errors
- [ ] **Complete workflow** runs successfully
- [ ] **Google Sheet** updates with call status
- [ ] **Email report** received
- [ ] **Workflow activated** for automatic execution

## 🎯 **Next Steps**

1. **Monitor first few executions** for any issues
2. **Adjust timing** and filters as needed
3. **Add more customers** to Google Sheet
4. **Scale up** calling volume gradually
5. **Customize email reports** with your branding

---

**Your complete AI Cold-Calling workflow is now ready to automate your sales outreach! 🚀**

The workflow will automatically call new customers every weekday at 9 AM, track results, and send you daily reports.
