# TJ & Sons Operations

Cleaning operations back office and mobile field supervisor portal, built for
**Vercel with Next.js, Supabase Postgres, Supabase Auth and private Supabase Storage**.

**Start here: [Vercel deployment tutorial](docs/VERCEL-SETUP.md).**

## Included

- Owner, Admin and assigned-PIC access; email/password login.
- Customers, enquiries, quotations, customer POs and Work Orders.
- Scheduling with team/truck/PIC conflicts and truck document checks.
- Field progress, area checklists, before/after evidence, report review and certificates.
- Invoices, partial payments/receipts, expenses, transfers, balances and financial monitoring.
- Owner-requested complete dummy dataset, imported once when `SEED_DUMMY_DATA=true`.
- English admin/mobile UI, blue theme, white sidebar and readable typography.
- Existing quotation/invoice branding, original logos, grouped areas and print-to-PDF.
- Optional WhatsApp approved-template assignment notifications.

## Run locally

Use Node 22.13+ (Node 24 is recommended for the test suite) and pnpm 11.25.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill .env.local using docs/VERCEL-SETUP.md; run supabase/setup.sql in Supabase SQL Editor.
pnpm dev
```

Open `/login` for a live workspace, `/demo` for a read-only admin demo, or
`/demo/petugas` for the read-only field demo. Never commit `.env.local`.

```sh
pnpm typecheck
pnpm test
pnpm build
```

Vercel uses the **Next.js** preset and the default `.next` output. There is no
Vinext build or Cloudflare runtime requirement in this deployment.

## Setup and data

See [`supabase/setup.sql`](supabase/setup.sql) for the Postgres tables and private
storage bucket. `OWNER_EMAIL` restricts first Owner creation. Confirmed Supabase
Auth users also need active membership in **Users & Access**.

This Vercel application has a separate database from the earlier hosted Sites
version. Existing Sites data is not moved automatically. The 37-record fictional
business dataset and 16 labeled attachments can populate a fresh Supabase project.
Financial totals include simulated transactions while that dataset is present.

The owner-approved original quotation reference is
[`docs/reference/quotation-existing.pdf`](docs/reference/quotation-existing.pdf).
Original logos are in `public/brand/`; the rendered template is
`components/business-document.tsx`. Real contact/bank details remain empty in
public source defaults; enter approved details in Company Settings. Signatures
and the company stamp are not automatically applied to generated documents.

## Implementation and limitations

- Server-only prepared queries use `pg` with Supabase transaction pooling.
- All writes acquire a transaction-level advisory lock so payment and booking
  checks remain atomic across concurrent serverless instances.
- Private file downloads pass through an authenticated, permission-checked API.
- Uploads are limited to 4 MB to fit Vercel request limits.
- Auth accounts are created in Supabase; application roles are managed by the Owner.
- Quotation approval locks the document; use a new revision for changes.
- Financial entries are immutable; correction/reversal UI is not included yet.
- Documents use the browser's **Print / Save as PDF** workflow.
- WhatsApp needs valid Meta credentials and an approved template. Delivery webhooks,
  scheduled reminders, automatic retries, bank feeds and payroll are not included.
- Certificates record service completion; they are not regulatory safety certificates.

The earlier `drizzle/` SQLite schema is retained only as a test fixture/history.
Use `supabase/setup.sql` and `pnpm db:migrate` for this deployment.
