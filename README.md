# Assignment Sharing Platform

A community-driven academic resource library. Students upload assignments → moderators review → approved files become publicly searchable and downloadable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Database | Neon PostgreSQL + Prisma ORM |
| Auth | Auth.js v5 (Google OAuth) |
| Storage | Cloudflare R2 |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Roles

| Role | Upload Limit | File Size | Special Access |
|---|---|---|---|
| Guest | None | — | Browse & download only |
| User | 10 files | 5 MB/file | Upload after admin approval |
| Nurd | 30 files | 10 MB/file | Power uploader, admin-assigned |
| Admin | Unlimited | Unlimited | Full control |

---

## Local Development

### 1. Prerequisites
- Node.js 18+
- npm or pnpm
- A Cloudflare account (free)
- A Neon PostgreSQL account (free)
- A Google Cloud project with OAuth 2.0 credentials

### 2. Clone and install
```bash
cd "CStess Finish"
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 4. Set up the database
```bash
npm run db:migrate   # Apply migrations
npm run db:seed      # Create first admin user
```

### 5. Run development server
```bash
npm run dev
# Open http://localhost:3000
```

---

## Setting Up External Services

### Neon PostgreSQL (Free Tier)
1. Go to [neon.tech](https://neon.tech) → Create account
2. Create new project → Copy the `DATABASE_URL`
3. Paste into `.env.local`

### Cloudflare R2 (Free Tier: 10GB, 0 egress fees)
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → R2
2. Create a bucket (e.g., `assignments-bucket`)
3. Go to **Manage R2 API Tokens** → Create token with Object Read & Write
4. Copy Account ID, Access Key, Secret Key → paste into `.env.local`
5. For the public URL: Enable public access on the bucket or use a custom domain

### Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. For production add: `https://yourdomain.com/api/auth/callback/google`

---

## Database Migrations

```bash
# Development — auto-migrate with shadow database
npm run db:migrate

# Production — apply pending migrations
npx prisma migrate deploy

# View/edit data
npm run db:studio
```

---

## Seeding (First Admin User)

```bash
npm run db:seed
```
This creates an admin user. **Change the email/name in `prisma/seed.ts` before running.**

After seeding, sign in with the admin's Google account (must match the email in seed).

---

## Vercel Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Framework preset: **Next.js** (auto-detected)

### 3. Set Environment Variables in Vercel
Add all variables from `.env.example` in the Vercel dashboard under **Settings → Environment Variables**.

For `NEXTAUTH_URL`, use your production domain: `https://yourapp.vercel.app`

### 4. Deploy
Vercel will auto-deploy on every push to `main`.

### 5. Cron Job (Auto-cleanup)
The `vercel.json` configures a daily cron at 2 AM UTC that calls `/api/cron/cleanup`.
This automatically expires pending assignments older than 7 days.

---

## Making Someone an Admin/Moderator/Nurd

After a user signs in with Google, use Prisma Studio to change their role:
```bash
npm run db:studio
# Open the Users table → find the user → change role
```

Or update via SQL:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

---

## Free-Tier Cost Estimate

| Service | Free Tier | Paid Threshold |
|---|---|---|
| Vercel | 100 GB bandwidth/month | After 100 GB |
| Neon PostgreSQL | 3 GB storage, 191.9 compute hours/month | After 3 GB |
| Cloudflare R2 | 10 GB storage, 0 egress fees | After 10 GB storage |
| Google OAuth | Free forever | Never |

**Total monthly cost for small community: \$0**

---

## Security Notes

- Storage credentials are **never** sent to the browser
- Private files use signed URLs (15-minute expiry) visible only to moderators
- All role checks are performed server-side
- File MIME types are validated server-side (not just extension)
- Upload limits (size, count) are enforced server-side
- SHA-256 hash stored for duplicate detection
