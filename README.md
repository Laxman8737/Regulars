# Regulars — Customer ledger

GitHub Pages-ready package for the supplied website.

## Deploy on GitHub Pages
1. Create a GitHub repository.
2. Upload all files in this ZIP to the repository's root.
3. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
4. Open the published GitHub Pages URL over HTTPS.

## Firebase
The Firebase configuration and application code in `index.html` have been left unchanged. The supplied HTML currently uses placeholders unless a Firebase config has already been saved in that browser. Configure Firebase as you normally do, and ensure the GitHub Pages domain is listed under Firebase Authentication's authorized domains. No Firebase project settings or data were modified.

## Notes
The site loads Firebase modules and the XLSX library from their existing external CDN URLs, so users need an internet connection.
