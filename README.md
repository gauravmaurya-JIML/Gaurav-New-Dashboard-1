# Individual Companies Follow-up Dashboard Template

Reusable Next.js dashboard for individual company follow-up sheets.

## Required Google Sheet headers

- Company Name
- New/Existing/Assigned/Top 51 Aspirational/Top 50 Existing
- Status of Company
- Expected Salary (or Expected CTC)
- Last Conversation Details
- Last Conversation Date
- Next Planned Action
- Targeted Month

Use `Completed` or `Closed` in Status of Company to move an account into Completed Accounts and exclude it from overdue calculations.

## Deployment

1. Create a private GitHub repository and select the Node `.gitignore`.
2. Upload every file from this folder to the repository root.
3. Import the repository into Vercel with the Next.js preset.
4. Create a Google Cloud service account and enable Google Sheets API in that project.
5. Share the individual Google Sheet with the service-account email as Viewer.
6. Create/download a JSON key and add the environment variables below in Vercel.
7. Redeploy, then confirm `/api/companies` returns `"live":true`.

## Vercel environment variables

```text
NEXT_PUBLIC_DASHBOARD_TITLE=Team Member Name Companies Follow-up Status
GOOGLE_SHEET_ID=ID between /d/ and /edit in the Google Sheet URL
GOOGLE_SHEET_NAME=Exact worksheet tab name
GOOGLE_SERVICE_ACCOUNT_EMAIL=client_email from the service-account JSON
GOOGLE_PRIVATE_KEY=private_key from the JSON, without JSON field name or quotes
```

Never upload the JSON key, `.env`, or `.env.local` to GitHub.
