# Mercato: send money within Nuvion

A Next.js (App Router, TypeScript) demo marketplace that runs every scenario from the guide [Send within Nuvion](https://docs.nuvion.co/guides/send-within-nuvion) against the Nuvion sandbox. Each scenario has its own page, shows who pays whom, what is different about the API calls, and the three requests and responses behind the send.

**Live demo:** https://nuvion-move-funds-nextjs.vercel.app

The sandbox host is `https://api.nuvion.dev`. Use sandbox keys only. Do not point this at production.

## The seven scenarios

| Page | Sender | Recipient | API key | `entity_id` |
|---|---|---|---|---|
| Between your own accounts | Mercato | Mercato reserve | Parent's | Left out |
| Pay another Nuvion customer | Mercato | Northwind Supplies | Parent's | Left out |
| Child pays its parent | Seller | Mercato | Parent's | The seller's, on every call |
| Parent pays a child | Mercato | Seller | Parent's | Left out |
| Between two children | Seller | Second seller | Parent's | The paying seller's, on every call |
| Child pays another customer | Seller | Northwind Supplies | Parent's | The seller's, on every call |
| Another customer pays a child | Northwind Supplies | Seller | Northwind's own | Left out |

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, go to **Setup**, and enter your sandbox values once: the parent's API key, Northwind's API key (only for the last scenario), and for each party its name, account ID, account number (`nuvion_ban`) and, for sellers, entity ID. A scenario unlocks when everything it needs is filled in.

The keys and IDs live in `sessionStorage`, so they stay in your browser tab and are gone when you close it. The route handler uses a key only to call Nuvion for that request. It does not log or store it.

| Variable | Description |
|---|---|
| `NUVION_BASE_URL` | Optional. Defaults to `https://api.nuvion.dev`. |

## What a send does

[`app/api/send/route.ts`](app/api/send/route.ts) makes the same three calls in every scenario:

1. `POST /counterparties` creates the recipient as a business counterparty. Done once per recipient.
2. `POST /payment-details` adds a `book-transfer` payment detail whose `account_number` is the recipient's `nuvion_ban`. Done once per recipient.
3. `POST /transfers` sends a `book-transfer` with a fresh `unique_reference`.

Steps 1 and 2 are remembered per sender and recipient for the tab, so a second send reuses them. Adding the same `nuvion_ban` to a counterparty twice returns `422 error_duplicate_resource`. The scenario definitions are in [`lib/scenarios.ts`](lib/scenarios.ts).

The sender pays `applicable_fee` on top of the amount, so keep the amount plus the fee within the paying account's balance. Amounts are entered in major units and sent in minor units.

## Notes

- No database and no auth layer. This is a demo, not a production service.
- Light, dark and system themes. The choice is saved in `localStorage`.
