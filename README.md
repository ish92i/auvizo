# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Convex
VITE_CONVEX_URL=your_convex_deployment_url

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# For convex/auth.config.js
CLERK_FRONTEND_API_URL=your_clerk_frontend_api_url
```

### Getting the values

1. **VITE_CONVEX_URL**: Run `npx convex dev` and copy the deployment URL
2. **VITE_CLERK_PUBLISHABLE_KEY**: From Clerk Dashboard → API Keys → Publishable Key
3. **CLERK_FRONTEND_API_URL**: From Clerk Dashboard → API Keys → Frontend API (e.g., `https://your-app.clerk.accounts.dev`)
