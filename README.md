# Finance & Accounting Freelance Marketplace

## Stack rationale

This repository is scaffolded as a TypeScript-first marketplace core suitable for a production web platform in 2026. The intended production stack is:

- **Next.js + React + TypeScript** for the web application and role-specific dashboards.
- **Node.js TypeScript domain services** for auth, profiles, jobs, proposals, contracts, verification, notifications, and admin workflows.
- **PostgreSQL** as the system of record for users, contracts, transactions, and reviews because marketplace payments require ACID transactions and strong relational integrity.
- **Stripe Connect + Billing** for marketplace escrow-style payment collection, milestone release, payouts, refunds, and professional subscriptions.
- **Object storage with signed short-lived URLs** for verification documents and chat attachments.
- **GitHub Actions CI** to enforce strict type-checking, linting, and automated tests on every pull request.

The current phase implements a working, tested TypeScript marketplace domain layer that models the critical flows and edge cases before adding framework-specific HTTP/UI adapters.

## Implemented flows

- Role-aware onboarding for clients, professionals, and admins.
- Professional profile creation and certification verification review.
- Service listing and job posting with search filters.
- Proposal submission and concurrency-safe proposal acceptance that creates contracts and escrow milestones.
- Milestone funding, release, refund/dispute state transitions, and platform-fee calculation.
- Two-way post-contract reviews.
- In-app notification recording.

## Local setup

```bash
npm install
cp .env.example .env
npm test
```

## Scripts

- `npm run typecheck` — strict TypeScript validation.
- `npm run lint` — currently aliases strict TypeScript checks; add ESLint when UI/API adapters are introduced.
- `npm test` — builds the TypeScript project and runs Node's test runner.
- `npm run build` — emits JavaScript to `dist/`.

## Environment variables

See `.env.example` for required configuration. Never commit real secrets.

## Deployment notes

1. Provision PostgreSQL and object storage.
2. Configure Stripe Connect, Stripe Billing, webhook secrets, and payout country policies.
3. Run database migrations before deploying API/UI adapters.
4. Require HTTPS, secure cookies, CSRF protection, rate-limited auth endpoints, and signed file URLs.
5. Keep CI green before merging any pull request.
