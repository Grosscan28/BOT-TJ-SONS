# Deploy TJ & Sons on Vercel

This repository now builds with **Next.js**, not Vinext/Cloudflare Workers. Admin
and field staff use one application and one Supabase project. The existing Sites
website and its database remain separate; they are not automatically migrated.

## 1. Create a Supabase project

Create a project in the Supabase dashboard and keep its database password.
Wait until the project is ready. Use a region close to your users.

## 2. Create the tables and private storage bucket

In Supabase, open **SQL Editor → New query**. Copy all of
[`supabase/setup.sql`](../supabase/setup.sql), then click **Run**.
This creates the six business tables and a **private** `tj-sons-files` bucket.
It preserves existing rows if run again. Do not make the bucket public.

Alternatively, set `DATABASE_URL` locally and run `pnpm db:migrate`.
This is a setup command, not part of the build. Run it before first sign-in.

## 3. Create your Owner login

Open **Authentication → Users → Add user → Create new user**.
Enter your email and a strong password. Confirm the email / select Auto Confirm
when creating this administrator-controlled account. Use this exact email for
`OWNER_EMAIL` in the next step.

Only the confirmed account matching `OWNER_EMAIL` can initialise the Owner.
An arbitrary first visitor cannot become Owner. There is no public registration.

## 4. Add Vercel environment variables

In your Vercel project, open **Settings → Environment Variables**.
Add these values for Production (and Preview if you want working previews):

| Name | Value to copy |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL from Connect / API settings |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable API key; legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported |
| `SUPABASE_SECRET_KEY` | Supabase server secret key; legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported |
| `DATABASE_URL` | Postgres transaction-pooler URI from Connect, port **6543**, with the actual database password |
| `OWNER_EMAIL` | Exact email of the confirmed Owner account created above |
| `SUPABASE_STORAGE_BUCKET` | `tj-sons-files` |
| `SEED_DUMMY_DATA` | `true` for the requested fictional business dataset; `false` for a new empty workspace |
| `APP_BASE_URL` | Your production Vercel origin, for example `https://your-project.vercel.app` |

URL-encode special characters in the password embedded in `DATABASE_URL`.
Use the pooler URI rather than an IPv6-only direct URI on Vercel.
`SUPABASE_SECRET_KEY` and `DATABASE_URL` are server-only. Do not add the
`NEXT_PUBLIC_` prefix to them. Enter secret values directly in Vercel, not GitHub.

## 5. Redeploy on Vercel

Import **Grosscan28/BOT-TJ-SONS**, or use your existing linked project.
In **Settings → Build and Deployment**, use:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root Directory | Repository root; no subfolder |
| Framework Preset | **Next.js** |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | Default; **turn off any old override** |
| Node.js | **22.x** or **24.x** |

Open **Deployments → latest deployment → Redeploy** after adding variables.
Do not set output to `dist` or create a routes-manifest manually. `next build`
creates `.next/routes-manifest.json` itself. A build can finish without service
credentials; sign-in then shows which deployment settings are still missing.

## 6. Sign in

Open `/login` on the new deployment. Sign in with the Supabase Owner email and
password. Open `/admin` for the back office. If `SEED_DUMMY_DATA=true`, the first
Owner workspace load imports the labeled training dataset once. Wait for this
first load to finish; it uploads the sample supporting files as well.

The demo routes `/demo` and `/demo/petugas` remain read-only and work without
credentials. The live application stores all records in Postgres and all uploads
in private Supabase Storage; it does not use Vercel's temporary disk for storage.

## 7. Add a real PIC or Admin

1. Create and confirm their email/password account under **Supabase → Authentication → Users**.
2. In the web app, open **Manage → Users & Access** and add the same email, select
   **pic** or **admin**, and keep it active. This step controls application access;
   it does not send an email or automatically create an Auth account.
3. On a Work Order, select that PIC and choose **Scheduled**.
4. The PIC signs in at `/login?return_to=/petugas` with their own email/password.

A PIC only sees their own Work Orders. Users do not need ChatGPT accounts or Site
sharing permissions on this Vercel version. Dummy PIC email addresses cannot log in.
If the complete dummy dataset was seeded before adding a real PIC, reassign a
sample Scheduled Work Order to the new PIC from the admin workspace.

## 8. Company details and WhatsApp

Fill **Manage → Company Settings** with approved company, bank and signatory
information. Templates use the existing logos in `public/brand/`; the original
quotation PDF is retained in `docs/reference/quotation-existing.pdf` with the
owner's permission. Editing a draft quotation updates newly generated PDFs;
previously downloaded files remain unchanged. Approved quotations need a revision.

WhatsApp is optional. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`,
`WHATSAPP_API_VERSION`, `WHATSAPP_TEMPLATE`, `WHATSAPP_TEMPLATE_LANGUAGE`, and
`APP_BASE_URL` to use the existing approved-template integration. Until configured,
assignment attempts are recorded as not configured rather than reported as sent.

## Limits and checks

- Uploads: JPEG, PNG, WebP and PDF, maximum **4 MB per file**, leaving headroom under
  Vercel's function body limit. Use smaller photos if your phone produces large files.
- No database or file credentials are needed at build time.
- Business writes use transactions with a transaction-level advisory lock, preserving
  schedule conflict and invoice-balance guards across concurrent function instances.
- Supabase RLS is enabled with no anonymous/authenticated direct table access. The
  server verifies Auth identity and application membership on every API request.
- Existing Sites records/files do **not** automatically appear in the Supabase project.
- No actual email, WhatsApp, bank transaction or production data is sent by setup tests.

Validation before deployment: `pnpm typecheck`, `pnpm test`, `pnpm build`.
