# n8n Workflow Setup Guide

Complete guide for setting up the AI Cold-Calling workflow in n8n with Set nodes for configuration.

## 🎯 Overview

This workflow uses **Set nodes** instead of environment variables for better security and easier management. All configuration values are stored in Set nodes within the workflow.

## 📋 Prerequisites

- n8n Cloud account ([Sign up here](https://n8n.cloud))
- Your backend deployed on Render.com
- All API keys and credentials ready

## 🔧 Step-by-Step Setup

### 1. Import the Workflow

1. **Download the workflow**: Save `n8n-workflows/ai-calling-workflow.json` to your computer
2. **Open n8n Cloud**: Go to your n8n workspace
3. **Import workflow**:
   - Click "Import from file"
   - Select the downloaded JSON file
   - Click "Import"

### 2. Configure the Set Node

The workflow includes a **"Set Configuration"** node that stores all your settings. You need to update this node with your actual values.

#### Find the Set Configuration Node
1. Look for the node named **"Set Configuration"**
2. Double-click to open it
3. You'll see a list of string values to configure

#### Update Configuration Values

Replace these placeholder values with your actual configuration:

```javascript
// Base URL - Your Render.com app URL
BASE_URL: "https://your-app-name.onrender.com"

// Google Sheets Configuration
GOOGLE_SHEETS_ID: "your_actual_google_sheets_id"
GOOGLE_SERVICE_ACCOUNT_EMAIL: "your-service@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nyour_actual_private_key\n-----END PRIVATE KEY-----"

// Gmail Configuration
GMAIL_USER: "your-email@gmail.com"

// API Authentication
API_KEY: "your_actual_api_key"
```

#### Detailed Configuration Steps

1. **BASE_URL**:
   - Replace `https://your-app-name.onrender.com` with your actual Render app URL
   - Example: `https://ai-calling-system-abc123.onrender.com`

2. **GOOGLE_SHEETS_ID**:
   - Get this from your Google Sheet URL
   - URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy the `SHEET_ID_HERE` part

3. **GOOGLE_SERVICE_ACCOUNT_EMAIL**:
   - From your Google Cloud service account JSON file
   - Look for the `client_email` field

4. **GOOGLE_PRIVATE_KEY**:
   - From your Google Cloud service account JSON file
   - Look for the `private_key` field
   - **Important**: Keep the `\n` characters for line breaks

5. **GMAIL_USER**:
   - Your Gmail address for sending emails
   - Example: `your-dealership@gmail.com`

6. **API_KEY**:
   - The API key you set in your Render environment variables
   - Must match the `API_KEY` in your backend

### 3. Configure Credentials

Even though we use Set nodes for most configuration, you still need to set up some n8n credentials:

#### Gmail SMTP Credential
1. **Go to Credentials** in n8n
2. **Create new credential** → **SMTP**
3. **Configure**:
   - Name: `Gmail SMTP`
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Secure: `true`
   - Username: Your Gmail address
   - Password: Your Gmail app password (16 characters)

### 4. Test Individual Nodes

Before activating the workflow, test each node:

#### Test Set Configuration Node
1. Click on "Set Configuration" node
2. Click "Execute Node"
3. Verify all values are set correctly

#### Test Google Sheets Connection
1. Click on "Get Customer Data" node
2. Click "Execute Node"
3. Should return your customer data from Google Sheets

#### Test API Connection
1. Click on "Get Call Statistics" node
2. Click "Execute Node"
3. Should return statistics from your backend API

### 5. Update Webhook URLs

Make sure all HTTP Request nodes point to your Render app:

1. **Initiate AI Call** node:
   - URL should be: `={{$('Set Configuration').item.json.BASE_URL}}/api/calls/initiate`

2. **Get Call Statistics** node:
   - URL should be: `={{$('Set Configuration').item.json.BASE_URL}}/api/calls/statistics`

3. **Webhook - Call Completed** node:
   - URL should be: `={{$('Set Configuration').item.json.BASE_URL}}/webhook/n8n/call-completed`

### 6. Configure Scheduling

The workflow includes a cron trigger for daily calls:

1. **Find "Daily Call Trigger" node**
2. **Configure schedule**:
   - Default: `0 9 * * 1-5` (9 AM, Monday-Friday)
   - Modify as needed for your timezone
   - Example for 10 AM: `0 10 * * 1-5`

### 7. Activate the Workflow

1. **Test the workflow** manually first:
   - Click "Execute Workflow"
   - Monitor execution
   - Check for any errors

2. **Activate for automatic execution**:
   - Toggle the "Active" switch
   - The workflow will now run on schedule

## 🔒 Security Best Practices

### Protecting Sensitive Data

1. **API Keys**: Store in Set nodes, not in node names or descriptions
2. **Private Keys**: Ensure proper formatting with `\n` line breaks
3. **Access Control**: Limit n8n workspace access to authorized users
4. **Regular Rotation**: Update API keys regularly

### Monitoring Access

1. **Check execution logs** regularly
2. **Monitor for failed executions**
3. **Review webhook access logs**

## 🧪 Testing Your Setup

### Manual Testing

1. **Test individual nodes**:
   ```
   Set Configuration → Execute Node
   Get Customer Data → Execute Node
   Initiate AI Call → Execute Node (with test data)
   ```

2. **Test complete workflow**:
   - Click "Execute Workflow"
   - Monitor each step
   - Check Google Sheets for updates

### Webhook Testing

Test the manual call webhook:

```bash
curl -X POST "https://your-n8n-instance.app.n8n.cloud/webhook/manual-call" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST_001",
    "phoneNumber": "+1234567890"
  }'
```

## 🔄 Workflow Structure

The workflow follows this flow:

```
Daily Trigger → Set Configuration → Get Customer Data → Filter Customers → 
Process One by One → Initiate Call → Wait → Check Success → 
Update Sheets → Get Statistics → Send Report
```

### Key Nodes Explained

1. **Set Configuration**: Stores all configuration values
2. **Get Customer Data**: Reads from Google Sheets
3. **Filter Ready Customers**: Filters customers ready for calling
4. **Process One by One**: Processes customers individually
5. **Initiate AI Call**: Makes API call to start the call
6. **Wait Between Calls**: Prevents overwhelming the system
7. **Check Call Success**: Determines if call was successful
8. **Update Call Status**: Updates Google Sheets with results
9. **Get Call Statistics**: Retrieves performance metrics
10. **Send Daily Report**: Emails daily summary

## 🛠️ Troubleshooting

### Common Issues

1. **"Configuration not found" errors**:
   - Check Set Configuration node has all required values
   - Verify node connections are correct

2. **Google Sheets permission errors**:
   - Verify service account email is added to sheet
   - Check private key formatting (include `\n` characters)

3. **API authentication errors**:
   - Verify API_KEY matches your backend configuration
   - Check BASE_URL is correct

4. **Webhook not triggering**:
   - Verify webhook URLs are accessible
   - Check n8n webhook settings

### Debug Steps

1. **Check execution logs** in n8n
2. **Test nodes individually** before running full workflow
3. **Verify all URLs** point to your Render app
4. **Check API responses** for error messages

## 📊 Monitoring & Maintenance

### Regular Checks

1. **Weekly**: Review execution logs for errors
2. **Monthly**: Update API keys and credentials
3. **Quarterly**: Review and optimize workflow performance

### Performance Optimization

1. **Adjust wait times** between calls based on volume
2. **Monitor API rate limits** and adjust accordingly
3. **Optimize Google Sheets queries** for better performance

## 🆘 Getting Help

If you encounter issues:

1. **Check n8n execution logs** for detailed error messages
2. **Test your backend API** independently
3. **Verify Google Sheets access** manually
4. **Review the troubleshooting guide** in the main documentation

## ✅ Success Checklist

- [ ] Workflow imported successfully
- [ ] Set Configuration node updated with all values
- [ ] Gmail SMTP credential configured
- [ ] Individual nodes tested and working
- [ ] Webhook URLs pointing to correct Render app
- [ ] Cron schedule configured for your timezone
- [ ] Manual test execution successful
- [ ] Workflow activated for automatic execution
- [ ] Google Sheets updating correctly
- [ ] Email reports being sent

Your n8n workflow is now ready to automate your AI cold-calling campaigns!
