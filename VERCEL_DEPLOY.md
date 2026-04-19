# Vercel Deployment Guide

## Quick Start

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
vercel
```

#### Option B: Using Git Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Click "Deploy"

### 3. Configure Environment Variables

Set these variables in Vercel project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes |
| `GROQ_API_KEY` | Groq API key for AI assistant | ⚠️ Optional |

#### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing
3. In project settings, find "API":
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `Anon Key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Getting Groq API Key (Optional)

1. Go to [console.groq.com](https://console.groq.com)
2. Create a new API key
3. Copy it to `GROQ_API_KEY` environment variable

### 4. Database Setup

After deploying, you may want to seed sample data:

```bash
# Locally (before deployment)
npm run seed

# Or via Node.js script
SUPABASE_SERVICE_ROLE_KEY=<your_service_key> npm run seed
```

## Post-Deployment

### Monitor Deployment
- View logs: `vercel logs <app-name>`
- View deployments: `vercel deployments`

### Custom Domain
1. In Vercel project settings → "Domains"
2. Add your custom domain
3. Update domain DNS records per instructions

### Analytics & Monitoring
- Enable Vercel Analytics in project settings
- Set up error reporting/monitoring if needed
- Monitor database usage in Supabase dashboard

## Troubleshooting

### Build Fails
```bash
# Clear build cache
vercel env pull
rm -rf .next
```

### Environment Variables Not Loading
- Confirm variables set in Vercel settings
- Check they're using correct names (case-sensitive)
- Rebuild: `vercel --prod`

### Supabase Connection Issues
- Verify URL and keys are correct
- Check Supabase project is active
- Confirm database migrations ran

### AI Chat Not Working
- Verify `GROQ_API_KEY` is set
- Check API quota at [console.groq.com](https://console.groq.com)
- View server logs for errors

## Performance

### Optimize Images
- Images in `/public` are served from Vercel CDN
- Use Next.js `<Image>` component for optimization

### Database
- Supabase includes connection pooling
- Monitor query performance in dashboard
- Consider indexes for large tables

### API Routes
- Serverless functions have 10s timeout
- For long operations, use background jobs
- Cache responses when possible

## Security

- Environment variables are encrypted
- Never commit `.env` files to Git
- Use Preview Deployments for testing
- Enable Preview Protection if needed

## Rollback

To restore a previous deployment:
```bash
vercel deployments
vercel rollback <deployment-id>
```

Or manually redeploy from Git:
```bash
git revert <commit>
git push  # Vercel auto-deploys on push
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Hosting](https://supabase.com/docs/guides/hosting)
