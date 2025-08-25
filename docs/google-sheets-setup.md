# Google Sheets Setup Guide

## Sheet Structure

Create a Google Sheet with the following columns:

### Required Columns (A-P):

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | customer_name | Full name of the customer | "John Smith" |
| B | phone_number | Phone number (E.164 format preferred) | "+1234567890" |
| C | car_model | Car model they enquired about | "Toyota Camry 2024" |
| D | enquiry_date | Date of original enquiry | "2024-01-15" |
| E | call_status | Current call status | "pending", "in_progress", "completed", "failed" |
| F | call_attempts | Number of call attempts made | 0, 1, 2, 3 |
| G | last_call_date | Date of last call attempt | "2024-01-20" |
| H | still_interested | Customer still interested in original car | "yes", "no", "unknown" |
| I | wants_appointment | Wants to schedule appointment | "yes", "no", "unknown" |
| J | appointment_date | Scheduled appointment date/time | "2024-01-25 14:00" |
| K | interested_similar | Interested in similar cars | "yes", "no", "unknown" |
| L | email_address | Customer email for similar cars | "john@example.com" |
| M | email_sent | Email with similar cars sent | "yes", "no" |
| N | call_duration | Duration of call in seconds | 120 |
| O | call_notes | AI-generated call summary | "Customer interested but wants to see more options" |
| P | next_action | Recommended next action | "send_similar_cars", "schedule_appointment", "no_action" |

## Sample Data Row

```
John Smith | +1234567890 | Toyota Camry 2024 | 2024-01-15 | pending | 0 | | unknown | unknown | | unknown | | no | | | 
```

## Google Sheets API Setup

1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create Service Account credentials
5. Download JSON key file
6. Share your Google Sheet with the service account email

## Sheet Permissions

- Share the sheet with your service account email (found in the JSON key file)
- Give "Editor" permissions to allow read/write access

## Sheet ID

The Sheet ID is found in the URL:
`https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

## Environment Variables

Add these to your `.env` file:
```
GOOGLE_SHEETS_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
