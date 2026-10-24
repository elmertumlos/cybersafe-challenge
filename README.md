# CyberSafe Quiz

A responsive, browser-based cybersecurity awareness quiz. Each attempt randomly selects 10 non-repeating questions from a bank of 100 and shuffles their answer choices. It is a static site: there is no database, server, login, or build step.

## Run locally

Open `index.html` directly in a browser, or serve this directory with any static web server.

## Deploy to Cloudflare Workers

### Recommended: deployment script

The included script deploys the site as a Cloudflare Worker with static assets. By default, Cloudflare provides a `workers.dev` address; this repository does not contain or claim a specific custom domain.

From PowerShell, run a safe local check first:

```powershell
.\deploy-cloudflare.ps1 -DryRun
```

Then deploy:

```powershell
.\deploy-cloudflare.ps1
```

The first deployment may open a browser for Cloudflare authorization. The script does not save an API token in this project. Deployment settings are defined in `wrangler.jsonc`.

### Use your own custom domain

Your domain must already be active in the same Cloudflare account. You can attach it in either of these ways:

1. In the Cloudflare dashboard, open **Workers & Pages** and select the `cybersafe` Worker.
2. Open **Settings** → **Domains & Routes** → **Add** → **Custom Domain**.
3. Enter your own hostname, such as `quiz.example.com`, and confirm it.

Alternatively, add this block after the `assets` section in `wrangler.jsonc`, replacing the example hostname with your own, and deploy again:

```jsonc
"routes": [
  {
    "pattern": "quiz.example.com",
    "custom_domain": true
  }
]
```

Add a comma after the closing `assets` object before inserting the `routes` block. Never commit account tokens or other credentials.

### Direct Upload

1. In Cloudflare, open **Workers & Pages**.
2. Select **Create** → **Pages** → **Upload assets**.
3. Create a project name such as `cybersafe-quiz`.
4. Upload `index.html`, `styles.css`, `question-bank.js`, and `app.js` together.
5. Select **Deploy site**.

### Git integration

Push this folder to a GitHub or GitLab repository, then import it in Cloudflare Pages using these settings:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`

## Data storage

Questions are defined in `question-bank.js`. The only saved value is the user's best score, stored locally in that browser with `localStorage`. No personal data is sent or collected.
