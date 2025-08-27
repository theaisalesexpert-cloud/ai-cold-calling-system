# 🔧 n8n Set Configuration Node - Step-by-Step Setup

Complete guide for configuring the most important node in your workflow.

## 🎯 **Why Use Set Node Instead of Environment Variables?**

✅ **Better Security**: Credentials stored within n8n workflow  
✅ **Easier Management**: Single place to update all settings  
✅ **No External Dependencies**: No need to manage multiple credential stores  
✅ **Visual Configuration**: Easy to see and modify values  
✅ **Version Control**: Changes tracked with workflow versions  

## 📋 **Step-by-Step Configuration**

### **Step 1: Find the Set Configuration Node**

1. **Open your n8n workflow**
2. **Look for the node named**: "Set Configuration"
3. **Double-click** to open it
4. **You'll see a list of string values to configure**

### **Step 2: Configure Each Value**

#### **🌐 BASE_URL**
```javascript
{
  "name": "BASE_URL",
  "value": "https://ai-cold-calling-system.onrender.com"
}
```

**How to get this:**
1. Go to your Render dashboard
2. Find your deployed service
3. Copy the URL (should end with `.onrender.com`)
4. **Example**: `https://ai-cold-calling-system-abc123.onrender.com`

#### **📊 GOOGLE_SHEETS_ID**
```javascript
{
  "name": "GOOGLE_SHEETS_ID", 
  "value": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
}
```

**How to get this:**
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Copy the `SHEET_ID_HERE` part
4. **Example**: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

#### **📧 GOOGLE_SERVICE_ACCOUNT_EMAIL**
```javascript
{
  "name": "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "value": "your-service@project-name.iam.gserviceaccount.com"
}
```

**How to get this:**
1. Open your service account JSON file
2. Find the `"client_email"` field
3. Copy the email address
4. **Example**: `ai-calling@my-project-123456.iam.gserviceaccount.com`

#### **🔐 GOOGLE_PRIVATE_KEY**
```javascript
{
  "name": "GOOGLE_PRIVATE_KEY",
  "value": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
}
```

**How to get this:**
1. Open your service account JSON file
2. Find the `"private_key"` field
3. Copy the entire key **including** the `\n` characters
4. **Important**: Keep the `\n` characters - they represent line breaks

**Example format:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nXOXBIlrMQaS75uF2mk+Fgh9j0sJ3c6tVqFBqvEO4X8jB1hjdVvztjl2L9fW0FA8\n...\n-----END PRIVATE KEY-----
```

#### **📬 GMAIL_USER**
```javascript
{
  "name": "GMAIL_USER",
  "value": "your-dealership@gmail.com"
}
```

**How to set this:**
1. Use your Gmail address for sending emails
2. **Example**: `premier-auto@gmail.com`

#### **🔑 API_KEY**
```javascript
{
  "name": "API_KEY",
  "value": "abc123def456ghi789jkl012mno345pqr678"
}
```

**How to set this:**
1. Use the same API key you set in Render environment variables
2. Must match exactly with your backend configuration
3. **Example**: `your_secure_api_key_32_characters_long`

## 🖼️ **Visual Configuration Example**

When you open the Set Configuration node, you'll see this interface:

```
┌─────────────────────────────────────────────────────────────┐
│ Set Configuration Node                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Values to Set:                                              │
│                                                             │
│ ┌─ String Values ────────────────────────────────────────┐  │
│ │                                                        │  │
│ │ Name: BASE_URL                                         │  │
│ │ Value: https://ai-cold-calling-system.onrender.com     │  │
│ │                                                        │  │
│ │ Name: GOOGLE_SHEETS_ID                                 │  │
│ │ Value: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms │  │
│ │                                                        │  │
│ │ Name: GOOGLE_SERVICE_ACCOUNT_EMAIL                     │  │
│ │ Value: your-service@project.iam.gserviceaccount.com    │  │
│ │                                                        │  │
│ │ Name: GOOGLE_PRIVATE_KEY                               │  │
│ │ Value: -----BEGIN PRIVATE KEY-----\n...               │  │
│ │                                                        │  │
│ │ Name: GMAIL_USER                                       │  │
│ │ Value: your-email@gmail.com                            │  │
│ │                                                        │  │
│ │ Name: API_KEY                                          │  │
│ │ Value: abc123def456ghi789jkl012mno345pqr678            │  │
│ │                                                        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ [Save] [Test] [Cancel]                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 **Testing Your Configuration**

### **Step 1: Test the Set Node**
1. **Click "Execute Node"** on the Set Configuration node
2. **Check the output** - should show all your values
3. **Verify** no values are empty or incorrect

### **Step 2: Test Dependent Nodes**
1. **Execute "Get Customer Data" node**
2. **Should connect to Google Sheets** and return data
3. **If it fails**, check your Google credentials

### **Step 3: Test API Connection**
1. **Execute any HTTP Request node**
2. **Should authenticate** with your backend
3. **If it fails**, check your API_KEY and BASE_URL

## 🔒 **Security Best Practices**

### **✅ DO:**
- **Keep private keys secure** - don't share screenshots
- **Use strong API keys** - 32+ characters
- **Regularly rotate credentials** - update every few months
- **Limit access** to n8n workspace

### **❌ DON'T:**
- **Don't commit credentials** to version control
- **Don't share workflow exports** with credentials
- **Don't use production credentials** for testing
- **Don't screenshot private keys**

## 🔧 **Common Configuration Errors**

### **Error 1: Google Sheets Permission Denied**
```
Error: The caller does not have permission
```

**Fix:**
1. Check `GOOGLE_SERVICE_ACCOUNT_EMAIL` is correct
2. Verify service account is added to Google Sheet
3. Ensure service account has "Editor" permissions

### **Error 2: Invalid Private Key**
```
Error: Invalid private key format
```

**Fix:**
1. Ensure private key includes `-----BEGIN PRIVATE KEY-----`
2. Keep all `\n` characters in the key
3. Copy the entire key from JSON file

### **Error 3: API Authentication Failed**
```
Error: 401 Unauthorized
```

**Fix:**
1. Verify `API_KEY` matches Render environment variable
2. Check `BASE_URL` is correct and accessible
3. Ensure API key has no extra spaces

### **Error 4: Gmail SMTP Failed**
```
Error: Invalid login
```

**Fix:**
1. Use Gmail app password, not regular password
2. Enable 2-factor authentication on Gmail
3. Generate new app password if needed

## 📋 **Configuration Checklist**

Before saving your Set Configuration node:

- [ ] **BASE_URL** points to your Render app
- [ ] **GOOGLE_SHEETS_ID** matches your sheet
- [ ] **GOOGLE_SERVICE_ACCOUNT_EMAIL** is correct
- [ ] **GOOGLE_PRIVATE_KEY** includes all `\n` characters
- [ ] **GMAIL_USER** is your Gmail address
- [ ] **API_KEY** matches your backend configuration
- [ ] **All values** are filled in (no empty fields)
- [ ] **Test execution** passes successfully

## 🎯 **How Other Nodes Reference These Values**

Other nodes in your workflow reference these values like this:

```javascript
// In Google Sheets nodes:
"serviceAccountEmail": "={{$('Set Configuration').item.json.GOOGLE_SERVICE_ACCOUNT_EMAIL}}"

// In HTTP Request nodes:
"url": "={{$('Set Configuration').item.json.BASE_URL}}/api/calls/initiate"

// In Email nodes:
"fromEmail": "={{$('Set Configuration').item.json.GMAIL_USER}}"
```

This centralized approach means you only need to update values in one place!

## 🎉 **Success Indicators**

Your Set Configuration node is properly configured when:

✅ **Node executes** without errors  
✅ **All values** are populated  
✅ **Google Sheets node** can read data  
✅ **HTTP Request nodes** authenticate successfully  
✅ **Email nodes** can send messages  
✅ **Complete workflow** runs end-to-end  

---

**The Set Configuration node is the foundation of your entire workflow. Take time to configure it correctly, and all other nodes will work seamlessly!**
