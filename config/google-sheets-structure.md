# Google Sheets Structure for AI Cold Calling

## Required Columns

Your Google Sheets must have the following columns in this exact order:

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | Customer Name | Full name of the prospect | "John Smith" |
| B | Phone Number | Phone number in E.164 format | "+1234567890" |
| C | Car Model | Car they originally enquired about | "BMW X5 2023" |
| D | Enquiry Date | Date of original enquiry | "2024-01-15" |
| E | Call Status | Current call status | "Pending" |
| F | Call Date | Date/time of last call attempt | "2024-01-20 14:30" |
| G | Call Outcome | Result of the call | "Interested" |
| H | Still Interested | Yes/No for original car | "Yes" |
| I | Wants Appointment | Yes/No for appointment | "No" |
| J | Wants Similar Cars | Yes/No for alternatives | "Yes" |
| K | Email Address | Email for sending car options | "john@email.com" |
| L | Notes | Additional call notes | "Prefers SUVs" |
| M | Email Sent | Email sent status | "Yes" |
| N | Email Date | Date email was sent | "2024-01-20 15:00" |

## Call Status Values
- **Pending**: Ready to be called
- **Calling**: Currently being called
- **Completed**: Call finished successfully
- **Failed**: Call failed (busy, no answer, etc.)
- **Do Not Call**: Customer requested no more calls

## Call Outcome Values
- **Interested**: Still interested in original car
- **Not Interested**: Not interested in original car
- **Wants Alternatives**: Interested in similar cars
- **Appointment Scheduled**: Appointment booked
- **No Answer**: Phone not answered
- **Busy**: Line was busy
- **Invalid Number**: Phone number invalid

## Sample Data Row
```
John Smith | +1234567890 | BMW X5 2023 | 2024-01-15 | Pending | | | | | | | | |
```

## Setup Instructions
1. Create a new Google Sheet
2. Add the headers in row 1 exactly as shown above
3. Add your lead data starting from row 2
4. Share the sheet with your Google Service Account email
5. Copy the Sheet ID from the URL for n8n configuration

## Notes
- Phone numbers must be in E.164 format (+country code + number)
- Dates should be in YYYY-MM-DD format
- The n8n workflow will automatically update columns E through N
- Keep the original data in columns A through D intact
