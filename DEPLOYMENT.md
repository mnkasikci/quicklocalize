# Deployment Guide for Transly

This guide covers deploying Transly to Cloudflare Pages and configuring Workers AI.

## Prerequisites

- Cloudflare account (free tier is sufficient)
- GitHub account
- Git CLI installed locally

## Step 1: Prepare Your Cloudflare Account

### 1.1 Get Your Account ID

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Account Home** → **Overview**
3. Copy your **Account ID** (right sidebar)

### 1.2 Create API Token

1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use template: **"Edit Cloudflare Workers"**
4. Grant permissions:
   - `Account.Workers Scripts` - Edit
   - `Account.Workers Routes` - Edit
   - `Cloudflare Pages` - Edit
5. Copy the token and save it (you'll need it in Step 2)

## Step 2: Push Code to GitHub

### 2.1 Create Repository

1. Go to [GitHub.com](https://github.com/new)
2. Repository name: `transly`
3. Description: "Free, open-source localization tool powered by LLMs"
4. Make it **Public** (for open source)
5. Initialize with README? **No** (we already have one)
6. Click **Create repository**

### 2.2 Push Local Code

```bash
cd /path/to/transly

git init
git add .
git commit -m "Initial commit: Transly project setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/transly.git
git push -u origin main
```

## Step 3: Configure Cloudflare Pages

### 3.1 Connect GitHub

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Pages**
3. Click **Create application** → **Connect to Git**
4. Select **GitHub** and authorize Cloudflare
5. Select `transly` repository
6. Click **Begin setup**

### 3.2 Build Settings

1. Framework preset: **Next.js**
2. Build command: `npm run build`
3. Build output directory: `.next`
4. Environment variables:
   ```
   NODE_VERSION=18.16.0
   ```
5. Click **Save and deploy**

## Step 4: Set Environment Variables

### 4.1 Add Cloudflare AI Token

1. In Cloudflare Pages → **transly** → **Settings** → **Environment variables**
2. Add production variable:

   ```
   Key: CLOUDFLARE_API_TOKEN
   Value: [paste your token from Step 1.2]
   ```

3. Add account ID:

   ```
   Key: CLOUDFLARE_ACCOUNT_ID
   Value: [paste your Account ID from Step 1.1]
   ```

4. Save and redeploy

## Step 5: Test Deployment

1. Your site will be live at: `transly.pages.dev`
2. Visit the URL to confirm deployment
3. Test the translation API:

```bash
curl -X POST https://transly.pages.dev/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "file": {"greeting": "Hello"},
    "context": "A casual mobile game",
    "targetLanguage": "Spanish"
  }'
```

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain to Cloudflare

1. In Cloudflare Pages → **transly** → **Custom domain**
2. Enter your domain (e.g., `transly.dev`, already published the domain on Cloudflare)
3. Follow instructions to update your domain's nameservers

### 6.2 Update wrangler.toml

```toml
[env.production]
routes = [
  { pattern = "api.transly.dev/api/*", zone_name = "transly.dev" }
]
```

## Step 7: Enable Workers AI

Workers AI is automatically available. To explicitly confirm:

1. Go to **Workers & Pages** → **AI** → **Catalog**
2. Browse available models (Llama 3, Mistral, etc.)
3. Click **Add to project** for Llama 3

Your deployment is now using Cloudflare Workers AI for translations.

## Step 8: Monitor Deployment

### View Logs

```bash
wrangler tail --project-name transly
```

### View Analytics

1. **Cloudflare Dashboard** → **Pages** → **transly** → **Analytics**
2. Monitor requests, bandwidth, and errors

## Cost Management

Monitor your costs:

1. **Cloudflare Dashboard** → **Billing** → **Subscriptions**
2. Workers AI usage is visible under **Usage** tab
3. Set up budget alerts if needed

## Troubleshooting

### Deployment Failed

- Check **Deployments** tab for error logs
- Ensure `package.json` and build scripts are correct
- Verify Node.js version (18+)

### Translation API Not Working

- Check environment variables are set
- Verify Cloudflare API token is valid
- Check Workers AI is enabled on your account

### Performance Issues

- Monitor request latency in Analytics
- Check for rate limiting
- Consider implementing caching for common translations

## Continuous Deployment

Changes pushed to `main` branch automatically deploy to production. To prevent this:

1. **Cloudflare Dashboard** → **Pages** → **transly** → **Settings**
2. Under **Production deployments**, set to **Manual**

## Rollback

To revert to previous deployment:

1. **Pages** → **transly** → **Deployments**
2. Click on previous deployment
3. Click **Rollback to this deployment**

---

For more help, check:

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
