# Google Sheets Template Setup

## Sheet Structure

Create a Google Sheet with the following structure:

### Sheet Name: "Customers"

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | ID | Unique customer identifier | CUST_001 |
| B | Name | Customer full name | John Smith |
| C | Phone | Phone number with country code | +1234567890 |
| D | Email | Customer email address | john@example.com |
| E | Car Model | Car they enquired about | 2023 Honda Accord |
| F | Status | Current status | new, interested, not_interested, appointment_scheduled, completed |
| G | Enquiry Date | Date of original enquiry | 2024-01-15 |
| H | Last Call Date | Date of last call attempt | 2024-01-20 |
| I | Call Result | Result of last call | interested, not_interested, no_answer, busy |
| J | Appointment Date | Scheduled appointment date | 2024-01-25 |
| K | Notes | Additional notes | Customer prefers morning calls |
| L | Call Duration | Duration of last call in seconds | 180 |
| M | Sentiment | Customer sentiment from last call | positive, neutral, negative |
| N | Recording URL | URL to call recording | https://... |
| O | Recording Duration | Recording duration in seconds | 175 |

## Sample Data

Here's sample data to populate your sheet:

```
ID,Name,Phone,Email,Car Model,Status,Enquiry Date,Last Call Date,Call Result,Appointment Date,Notes,Call Duration,Sentiment,Recording URL,Recording Duration
CUST_001,John Smith,+1234567890,john@example.com,2023 Honda Accord,new,2024-01-15,,,,,,,
CUST_002,Sarah Johnson,+1234567891,sarah@example.com,2022 Toyota Camry,interested,2024-01-14,2024-01-20,interested,2024-01-25,Prefers morning calls,120,positive,,
CUST_003,Mike Davis,+1234567892,mike@example.com,2023 Nissan Altima,not_interested,2024-01-13,2024-01-19,not_interested,,Not interested in any vehicles,90,negative,,
CUST_004,Lisa Wilson,+1234567893,lisa@example.com,2023 Honda Civic,new,2024-01-16,,,,,,,
CUST_005,Robert Brown,+1234567894,robert@example.com,2022 Ford Focus,appointment_scheduled,2024-01-12,2024-01-18,interested,2024-01-22,Very interested in test drive,150,positive,,
```

## Setup Instructions

### 1. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "AI Cold Calling - Customer Database"
4. Rename the first sheet to "Customers"
5. Add the headers in row 1 as specified above
6. Add the sample data starting from row 2

### 2. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 3. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the details:
   - Name: `ai-calling-service`
   - Description: `Service account for AI calling system`
4. Click "Create and Continue"
5. Skip role assignment for now
6. Click "Done"

### 4. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Download the key file
6. Keep this file secure - you'll need it for environment variables

### 5. Share Sheet with Service Account

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (found in the JSON key file)
4. Give "Editor" permissions
5. Uncheck "Notify people"
6. Click "Share"

### 6. Get Sheet ID

The Sheet ID is found in the URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit#gid=0
```

Copy the `SHEET_ID_HERE` part for your environment variables.

## Environment Variables Setup

Add these to your `.env` file:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_sheet_id_here
GOOGLE_PROJECT_ID=your_project_id_from_json
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_from_json
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_from_json\n-----END PRIVATE KEY-----"
GOOGLE_CLIENT_ID=your_client_id_from_json
GOOGLE_PRIVATE_KEY_ID=your_private_key_id_from_json
```

## Data Validation Rules

To maintain data integrity, set up these validation rules:

### Status Column (F)
- Data validation: List of items
- Items: `new,interested,not_interested,appointment_scheduled,completed,call_failed,do_not_call`

### Phone Column (C)
- Data validation: Custom formula
- Formula: `=REGEXMATCH(C2,"^\+[1-9]\d{1,14}$")`
- Error message: "Please enter phone number with country code (e.g., +1234567890)"

### Email Column (D)
- Data validation: Custom formula
- Formula: `=REGEXMATCH(D2,"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")`
- Error message: "Please enter a valid email address"

### Date Columns (G, H, J)
- Data validation: Date
- Criteria: Valid date

## Conditional Formatting

Add conditional formatting to make the sheet more visual:

### Status Column
- `new`: Light blue background
- `interested`: Light green background
- `not_interested`: Light red background
- `appointment_scheduled`: Dark green background
- `completed`: Gray background

### Last Call Date
- If older than 7 days: Yellow background
- If older than 14 days: Orange background
- If older than 30 days: Red background

## Sheet Protection

To prevent accidental changes:

1. Select the header row (row 1)
2. Right-click > "Protect range"
3. Add description: "Header row protection"
4. Set permissions to "Only you"
5. Click "Done"

## Backup Strategy

1. Enable version history: File > Version history > See version history
2. Set up automatic backups using Google Takeout
3. Consider exporting to CSV weekly for additional backup

## Troubleshooting

### Common Issues

1. **"Permission denied" error**
   - Check if service account email is added to sheet with Editor permissions
   - Verify the service account key is correct

2. **"Sheet not found" error**
   - Verify the GOOGLE_SHEETS_ID is correct
   - Check if the sheet name is exactly "Customers"

3. **"Invalid credentials" error**
   - Check if all environment variables are set correctly
   - Verify the private key format (should include \n for line breaks)

4. **Data not updating**
   - Check if the column mapping in the code matches your sheet structure
   - Verify the row indices are correct (remember headers are in row 1)

### Testing the Connection

Use the health check endpoint to test your Google Sheets connection:

```bash
curl http://localhost:3000/api/sheets/test
```

This should return a success message if everything is configured correctly.
