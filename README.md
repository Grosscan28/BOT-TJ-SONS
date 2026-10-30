# TJ & Sons Operations

One repository, one database, two role-based portals:

- `/admin`: Owner and Admin back office.
- `/petugas`: Mobile field PIC portal. Supports `/petugas?task=WORK_ORDER_ID` assignment links.
- `/demo` and `/demo/petugas`: Read-only design examples with fictional records. They do not save records, send messages or upload files.

## Features

Customer and enquiry records, site visit scheduling, area-based quotations, customer approval and revisions, PO recording and verification, work orders, crew and truck assignments, calendar, truck document validity checks, report evidence, admin approval and revision, service certificates, invoices, partial payments and receipts, direct and general expenses, cash/bank balances, transfers, project margins, CSV exports, notifications and activity history.

Money is calculated in integer sen. SST is explicitly configurable by item and for mobilisation. The initial default is zero until the applicable treatment is confirmed. Quotes apply percentage discounts to services, then add mobilisation and applicable SST. Issued invoices are locked. Payments, expenses and transfers are immutable; financial corrections/reversals are not implemented and should be agreed before operational rollout.

The PDF action opens a print-ready document. Choose **Save as PDF** in the browser print dialog. Documents adapt to the number of service items and include company details configured by the owner. Service certificates record completion of work; they are not regulatory certifications.

## Architecture

React + TypeScript using the supplied Vinext/Vite/Cloudflare Workers integration. D1 stores business records, users, file metadata, notifications, delivery attempts and audit entries. R2 stores uploaded photos and PDF documents. Neither business records nor photos are kept in browser localStorage.

`db/schema.ts` owns the schema. `lib/domain.ts` owns monetary calculations and workflow rules. `lib/store.ts` enforces server-side membership, role permissions, ownership and business validation. `app/api/files` checks record access and MIME signatures before storing files. `components/workspace.tsx` supplies both portals; `lib/modules.ts` declares the admin forms.

## Login and access

Hosting uses ChatGPT sign-in, not a separate password database. New deployments are owner-private. The first authenticated visitor initializes the workspace Owner. Open the live site yourself before adding other visitors.

1. Owner opens `/admin` and signs in.
2. In **Users & Access**, add the exact login email of an Admin or PIC.
3. Grant that person access to the private Site through the hosting access controls. Membership in the app alone does not change Site sharing or send an invitation.
4. PIC signs in through `/petugas`. The server returns only their assigned work orders and strips pricing from scope items.

Owner manages users and company settings. Admin handles sales, operations and finance. PIC can confirm, start travel, arrive, complete the cleaning checklist, upload evidence, submit reports and request rescheduling for their own work orders. PIC does not receive invoice, quotation, expense, account or company finance records.

## First-run setup

1. Set the company profile, contact details, payment instructions and signatory.
2. Add your PIC users, teams and trucks. Set insurance, road tax and PUSPAKOM expiry dates.
3. Add cash/bank accounts with the correct opening balances. Opening balances lock after transactions.
4. Add customers and enquiries, with site inspection findings where needed.
5. Create quotation items per area. Record approval reference when approving.
6. Record customer PO as Received, attach the original, then mark Verified. Record reasons for differences. If no PO is used, record acceptance evidence on the work order.
7. Schedule the work order. Conflicting PIC/team/truck assignments and invalid truck documents are rejected.
8. PIC completes each area's checklist and adds at least one before and after photo. Admin reviews, approves or requests revision.
9. Issue invoices and record deposits/instalments against a bank/cash account. Receipts represent actual payments, not quoted amounts. Job completion and payment status are separate.
10. Close a verified completed project only after all its issued invoices are settled.

## WhatsApp Business

Portal notifications are stored automatically when a job is assigned and when reports or scheduling requests change. WhatsApp assignment delivery is attempted only when the provider is configured. Missing credentials, failures and provider acceptance appear in **Company Settings**. Provider acceptance does not claim final delivery/read confirmation.

Configure these server environment values (names only in `.env.example`):

- `APP_BASE_URL`: deployed origin.
- `WHATSAPP_TOKEN`: Meta Cloud API token (secret).
- `WHATSAPP_PHONE_ID`: sender phone number ID.
- `WHATSAPP_API_VERSION`: a currently supported version enabled for your Meta app, including `v`.
- `WHATSAPP_TEMPLATE`: approved assignment notification template.
- `WHATSAPP_TEMPLATE_LANGUAGE`: approved language code; default `en`.

The template has four ordered body parameters: **work order number, location, scheduled start (ISO timestamp), portal task URL**. Configure this exact template and use PIC phone numbers in international format. No provider credentials are included in source. Customer messaging consent and Meta template activation must be handled in your business account.

This version sends assignment notifications and records portal updates. It does not implement a WhatsApp inbound webhook, delivery-status webhook, scheduled reminders, retry worker, closed-browser web push, or a bank feed. Website notification inbox works when the portal is opened/refreshed. Those are separate integrations, not simulated successes.

## Development and validation

Requires Node >=22.13 (tests use built-in SQLite) and pnpm 11.25.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

The test suite covers discounts and SST, partial payments, transfers, role access, conflicts, document expiry and per-area photo requirements. The server integration test uses real SQLite with a D1 adapter and an in-memory R2 adapter; it executes assignment, field upload, report revision/approval, concurrent overpayment protection, idempotent receipt creation and project closure. No production data is touched.

For the managed workspace use `sites-preview start ABSOLUTE_REPO_PATH`. Run local migrations once before database use:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_handy_sentinel.sql
```

Local and production databases are distinct. Generate schema changes using `pnpm db:generate`; never edit an applied migration. Sites applies production migrations during deployment. Keep the `sites()` integration and `.openai/hosting.json` bindings.

## Deployment

`.openai/hosting.json` retains the registered Site ID and logical D1/R2 bindings. Use the Sites source workflow to push source, package the matching build and deploy the private version. Set secrets through hosting settings, never through source control. The same source can be mirrored to the user's GitHub repository.

Before using real money or customer records, confirm SST rules, company document wording, opening balances, user access and the business's required retention/backup procedure. This is an operations and cash-monitoring application, not a statutory accounting or payroll system.

## Shared interface theme

Both portals use English interface labels and system notifications, with a shared light sky-blue, white and royal-blue/cyan palette. The main reading size is 16 px, tables 14–15 px, and secondary metadata generally 12–14 px. Field actions are at least 48 px high and administrative actions at least 44 px. Navigation groups collapse to reduce sidebar density. Business data, uploaded documents and customer-written content retain their original language. Existing `/petugas` links are preserved.

### Existing quotation branding

The owner-supplied original is retained in `docs/reference/quotation-existing.pdf`.
`public/brand/` contains the original truck, association and footer logos extracted
from that PDF, plus its company wordmark. The generated quotation/invoice uses
`components/business-document.tsx`, standard wording in `lib/document-template.ts`,
and editable company settings. Customer data and amounts come from each record.
Handwritten signatures and the company stamp are not automatically applied.
The print layout uses US Letter, matching the supplied document, with grouped
areas, subtotals, other charges and a repeated print footer.
