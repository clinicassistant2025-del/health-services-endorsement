# HEALTH SERVICES NURSE ENDORSEMENT — GITHUB VERSION

This is a pure HTML/CSS/JavaScript version.

## No installation required

You do NOT need:
- Python
- Node.js
- Supabase
- Google Apps Script
- Google Sheets

## Files

- `index.html` — main website
- `style.css` — design
- `script.js` — form, records and browser storage
- `README.md` — setup instructions

## How records are stored

This version uses the browser's `localStorage`.

That means:
- Records are saved in the browser on the device where the website is used.
- GitHub Pages hosts the website/code, but GitHub does NOT store the endorsement records.
- If you use a different computer/browser, its records will not automatically appear.
- Clearing browser site data can remove local records.

## Backup

Use `Export Backup` regularly. It creates:
`health-services-endorsement-backup.json`

Use `Import Backup` to restore the records.

## GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md`.
3. Open repository Settings.
4. Open Pages.
5. Under Build and deployment, choose:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
6. Save.
7. GitHub will provide the website address.

## Important for employee/health information

Because this system can contain employee health information, use it only in accordance with your organization's privacy, security, access-control, retention and backup requirements.

## Important limitation

GitHub Pages is a static hosting service. This project does not provide a shared online database. If several computers need to see the same records in real time, a backend database/server is required.
