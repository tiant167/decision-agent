# Decision Agent - Deployment Guide

## Deploy to Vercel (Recommended)

### Prerequisites

- Vercel account (free tier works)
- Vercel CLI installed: `npm i -g vercel`
- Environment variables ready

### Step-by-Step Deployment

#### 1. Create Edge Config

1. Go to Vercel Dashboard → Storage → Edge Config
2. Click "Create Edge Config"
3. Copy the connection string (you'll need it for `EDGE_CONFIG`)

#### 2. Login to Vercel

```bash
vercel login
```

#### 2. Deploy

```bash
# From project root
cd decision-agent-app
vercel --prod
```

Or for preview deployment:
```bash
vercel
```

#### 3. Configure Environment Variables

**Option A: Via Vercel Dashboard**
1. Go to vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `GEMINI_API_KEY` = your_key
   - `TAVILY_API_KEY` = your_key
   - `EDGE_CONFIG` = your_edge_config_connection_string
   - `VERCEL_TOKEN` = your_vercel_api_token
   - `CRON_SECRET` = your_random_secret

**Option B: Via CLI**
```bash
vercel env add GEMINI_API_KEY
vercel env add TAVILY_API_KEY
vercel env add EDGE_CONFIG
vercel env add VERCEL_TOKEN
vercel env add CRON_SECRET
```

#### 4. Redeploy

```bash
vercel --prod
```

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

## Alternative: Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
```

### Build and Run

```bash
# Build
docker build -t decision-agent .

# Run
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e TAVILY_API_KEY=your_key \
  decision-agent
```

## Environment Configuration

### Production Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API |
| `TAVILY_API_KEY` | Yes | Tavily Search API |
| `EDGE_CONFIG` | Recommended | Vercel Edge Config connection string |
| `VERCEL_TOKEN` | If Edge Config | Vercel API token for writing to Edge Config |
| `CRON_SECRET` | If Edge Config | Secret for securing cron endpoints |
| `NODE_ENV` | Auto | Set to "production" |

### Security Checklist

- [ ] API keys are in environment variables (not code)
- [ ] `.env.local` is in `.gitignore`
- [ ] No sensitive data in logs
- [ ] HTTPS enabled (Vercel does this automatically)
- [ ] gitleaks pre-commit hook installed (prevents credential leaks)
- [ ] CRON_SECRET is set and used for cron endpoint auth

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-domain.vercel.app
```

Should return HTML page.

### 2. API Test

```bash
curl -X POST https://your-domain.vercel.app/api/decision \
  -H "Content-Type: application/json" \
  -d '{"optionA":"A","optionB":"B","scenario":"test"}'
```

Should return SSE stream.

### 3. Manual Test

1. Visit the deployed URL
2. Fill out the form
3. Verify the stream works
4. Complete a full decision cycle

## Monitoring

### Vercel Analytics

Enable in dashboard for:
- Page views
- Performance metrics
- Error tracking

### Custom Logging

Add to `lib/gemini.ts`:

```typescript
console.log(`[${new Date().toISOString()}] Decision started:`, {
  optionA: request.optionA,
  optionB: request.optionB
});
```

View logs:
```bash
vercel logs --all
```

## Troubleshooting

### Build Failures

**Error: "Cannot find module"**
```bash
# Clear cache and rebuild
rm -rf node_modules .next
npm install
npm run build
```

**TypeScript errors:**
```bash
npx tsc --noEmit
# Fix all errors before deploying
```

### Runtime Errors

**API 500 errors:**
- Check environment variables are set
- Verify API keys are valid
- Check Vercel function logs

**SSE not working:**
- Vercel supports SSE
- Ensure you're using Edge runtime or Node.js runtime properly

### Cold Start Issues

Vercel functions have cold starts. First request may be slow (~2-3s).

Mitigation:
- Use Vercel Pro for warm functions
- Implement loading UI

## Updates and Maintenance

### Deploying Updates

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Auto-deploy if connected to Git
# Or manual:
vercel --prod
```

### Updating Dependencies

```bash
npm update
npm run test:api
vercel --prod
```

### Rolling Back

In Vercel dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

## Cost Considerations

### Vercel

- **Free Tier**: 100GB bandwidth, 1000 GB-hours
- **Pro**: $20/month, more resources

### Gemini API

- **Free Tier**: 60 requests/minute
- **Pricing**: Check Google AI website

### Tavily API

- **Free Tier**: 1000 requests/month
- **Paid**: Various tiers

### Optimization Tips

1. Use search limit (5 max) to control costs
2. Implement caching for repeated queries
3. Monitor usage in dashboards

## Backup and Recovery

### Code Backup

- Repository on GitHub/GitLab
- Regular commits

### Environment Variables

- Keep backup of `.env.local` (secure location)
- Document all required variables

### Recovery Plan

1. Clone repository
2. Install dependencies
3. Set environment variables
4. Deploy

Estimated recovery time: 5 minutes
