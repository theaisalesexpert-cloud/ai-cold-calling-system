# 🔧 n8n Workflow Troubleshooting Guide

Common issues and solutions for your AI Cold-Calling workflow.

## 🚨 **Most Common Issues**

### **1. Google Sheets Authentication Errors**

#### **Error Message:**
```
Error: The caller does not have permission
```

#### **Causes & Solutions:**

**Cause 1: Service Account Not Added to Sheet**
- **Fix**: Share your Google Sheet with the service account email
- **Steps**:
  1. Open Google Sheet
  2. Click "Share" button
  3. Add service account email (from Set Configuration)
  4. Give "Editor" permissions
  5. Click "Send"

**Cause 2: Wrong Service Account Email**
- **Fix**: Verify email in Set Configuration node
- **Check**: Should end with `.iam.gserviceaccount.com`

**Cause 3: Invalid Private Key**
- **Fix**: Re-copy private key from JSON file
- **Important**: Keep all `\n` characters

#### **Test Fix:**
```javascript
// Execute this in Set Configuration node
{
  "GOOGLE_SERVICE_ACCOUNT_EMAIL": "your-service@project.iam.gserviceaccount.com",
  "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
}
```

---

### **2. HTTP Request Authentication Errors**

#### **Error Message:**
```
Error: 401 Unauthorized
```

#### **Causes & Solutions:**

**Cause 1: Wrong API Key**
- **Fix**: Verify API_KEY in Set Configuration matches Render environment variable
- **Check**: Both should be identical

**Cause 2: Wrong BASE_URL**
- **Fix**: Update BASE_URL to your actual Render app URL
- **Format**: `https://your-app-name.onrender.com`

**Cause 3: Missing Authorization Header**
- **Fix**: Ensure HTTP Request nodes have this header:
```javascript
{
  "name": "Authorization",
  "value": "=Bearer {{$('Set Configuration').item.json.API_KEY}}"
}
```

#### **Test Fix:**
```bash
# Test your API manually
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-app-name.onrender.com/health
```

---

### **3. Email Sending Failures**

#### **Error Message:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

#### **Causes & Solutions:**

**Cause 1: Using Regular Password Instead of App Password**
- **Fix**: Generate Gmail App Password
- **Steps**:
  1. Go to Google Account settings
  2. Security → 2-Step Verification
  3. App passwords → Generate new
  4. Use this password in n8n credential

**Cause 2: 2-Factor Authentication Not Enabled**
- **Fix**: Enable 2FA on Gmail account first

**Cause 3: Wrong SMTP Settings**
- **Fix**: Use these exact settings:
```javascript
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": true,
  "username": "your-email@gmail.com",
  "password": "your_16_char_app_password"
}
```

---

### **4. Workflow Execution Errors**

#### **Error Message:**
```
Error: Cannot read property 'json' of undefined
```

#### **Causes & Solutions:**

**Cause 1: Node Referencing Wrong Previous Node**
- **Fix**: Check node references in expressions
- **Example**: `{{$('Set Configuration').item.json.API_KEY}}`

**Cause 2: Empty Data from Previous Node**
- **Fix**: Check if previous node executed successfully
- **Debug**: Execute each node individually

**Cause 3: Wrong Data Path**
- **Fix**: Use correct JSON path
- **Example**: `{{$json.ID}}` not `{{$json.id}}`

---

### **5. Cron Trigger Not Working**

#### **Error Message:**
```
Workflow not executing at scheduled time
```

#### **Causes & Solutions:**

**Cause 1: Workflow Not Activated**
- **Fix**: Click "Active" toggle in workflow
- **Check**: Should show green "Active" status

**Cause 2: Wrong Timezone**
- **Fix**: Set correct timezone in n8n settings
- **Check**: Cron runs in n8n server timezone

**Cause 3: Invalid Cron Expression**
- **Fix**: Use correct cron format
- **Examples**:
  - `0 9 * * 1-5` = 9 AM weekdays
  - `0 10,14 * * *` = 10 AM and 2 PM daily

---

## 🧪 **Debugging Steps**

### **Step 1: Test Individual Nodes**

1. **Start with Set Configuration**
   - Execute node
   - Verify all values are set
   - Check for empty or incorrect values

2. **Test Google Sheets Node**
   - Execute "Get Customer Data"
   - Should return customer data
   - If fails, check authentication

3. **Test HTTP Request Node**
   - Execute "Initiate AI Call"
   - Should return success response
   - If fails, check API key and URL

### **Step 2: Check Data Flow**

1. **Verify Data Structure**
   - Check output of each node
   - Ensure data format matches expectations
   - Look for missing fields

2. **Test Expressions**
   - Use expression editor to test
   - Example: `{{$json.Phone}}` should return phone number
   - Verify field names match Google Sheet headers

### **Step 3: Monitor Execution**

1. **Watch Real-Time Execution**
   - Click "Execute Workflow"
   - Monitor each node as it runs
   - Note where execution stops or fails

2. **Check Execution History**
   - Go to Executions tab
   - Review failed executions
   - Check error messages and stack traces

---

## 🔍 **Common Expression Errors**

### **Wrong Field References**
```javascript
// ❌ Wrong - case sensitive
{{$json.phone}}

// ✅ Correct - matches sheet header
{{$json.Phone}}
```

### **Missing Node References**
```javascript
// ❌ Wrong - node name doesn't exist
{{$('Configuration').item.json.API_KEY}}

// ✅ Correct - exact node name
{{$('Set Configuration').item.json.API_KEY}}
```

### **Incorrect Data Path**
```javascript
// ❌ Wrong - missing .item
{{$('Set Configuration').json.API_KEY}}

// ✅ Correct - includes .item
{{$('Set Configuration').item.json.API_KEY}}
```

---

## 🛠️ **Quick Fixes**

### **Fix 1: Reset Node Configuration**
1. Delete problematic node
2. Add new node of same type
3. Reconfigure from scratch
4. Test execution

### **Fix 2: Clear Workflow Cache**
1. Save workflow
2. Deactivate workflow
3. Wait 30 seconds
4. Reactivate workflow

### **Fix 3: Restart n8n Instance**
1. If self-hosted: restart n8n service
2. If cloud: contact n8n support
3. Re-import workflow if needed

### **Fix 4: Update Node Versions**
1. Check for n8n updates
2. Update to latest version
3. Test workflow compatibility

---

## 📋 **Debugging Checklist**

### **Before Troubleshooting:**
- [ ] Workflow is saved
- [ ] All nodes are connected properly
- [ ] Set Configuration has all values
- [ ] Credentials are configured correctly

### **During Debugging:**
- [ ] Test nodes individually
- [ ] Check error messages carefully
- [ ] Verify data structure at each step
- [ ] Test expressions in expression editor

### **After Fixing:**
- [ ] Test complete workflow execution
- [ ] Verify all outputs are correct
- [ ] Activate workflow if needed
- [ ] Monitor first few executions

---

## 🆘 **Getting Help**

### **n8n Community Resources:**
- **Forum**: [community.n8n.io](https://community.n8n.io)
- **Documentation**: [docs.n8n.io](https://docs.n8n.io)
- **Discord**: n8n Community Discord

### **Workflow-Specific Help:**
- **Check logs**: Render dashboard → Your service → Logs
- **Test backend**: Use health endpoints
- **Verify Google Sheets**: Check data manually

### **When Asking for Help:**
1. **Include error message** (full text)
2. **Share node configuration** (without credentials)
3. **Describe expected vs actual behavior**
4. **Mention n8n version** and hosting type

---

## ✅ **Success Indicators**

Your workflow is working correctly when:

✅ **All nodes execute** without errors  
✅ **Data flows** between nodes properly  
✅ **Google Sheets** updates with call status  
✅ **API calls** authenticate successfully  
✅ **Emails** are sent and received  
✅ **Cron trigger** runs at scheduled times  
✅ **Complete workflow** executes end-to-end  

---

**Remember: Most issues are configuration-related. Double-check your Set Configuration node values and credentials first!**
