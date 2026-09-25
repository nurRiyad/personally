# Asset Management Specification

This document is the implementation contract for the `/assets` module. It
defines the accounting meaning of each record so the UI, API, database, and
future AI implementation work agree on the same numbers.

## Goal

Assets tracks what the user owns, what each asset has earned, and where money
moves. It is not a general expense log. Budget remains the place for monthly
spending planning.

The module supports:

- cash and bank accounts;
- fixed deposits (FDs);
- DPS / recurring savings;
- land, flats, plots, and other property;
- money lent to people (receivables);
- future asset types without changing the transaction ledger.

All money amounts are whole BDT (`integer`), as used by the existing Budget
module. All user-entered dates are timezone-safe `YYYY-MM-DD` strings.

## Non-negotiable accounting rules

1. **A transfer does not create wealth.** Moving ৳10,000 from a bank account
   to a DPS reduces the bank by ৳10,000 and increases the DPS by ৳10,000. Total
   assets do not change.
2. **Income and valuation changes create wealth.** FD interest, crop profit,
   loan interest, and an approved increase in property value are returns.
3. **Never double count.** If FD interest of ৳500 is deposited into a bank,
   only the bank's current value increases by ৳500. The FD principal must not
   also become ৳400,500 unless the interest was actually compounded into the
   FD.
4. **An asset's balance and performance are different measures.** Current
   value answers “what is this worth now?”; total return answers “what value
   has this asset produced?”
5. **Every material change has an immutable ledger record.** Do not silently
   overwrite a historical balance. Correct mistakes by creating a reversing or
   correcting entry that links to the original entry.
6. **Every entry belongs to exactly one user.** A user may never read or
   mutate another user's assets or ledger entries.

## Fixed-deposit interest example

Initial FD principal: ৳400,000. The bank pays ৳500 interest into City Bank.

```text
Fixed deposit current value:           ৳400,000
Fixed deposit interest earned:              ৳500
Fixed deposit total value created:     ৳400,500
City Bank current value:               +৳500
Portfolio current value:               +৳500 once
```

The ledger records one **income distribution** linked to the FD and one bank
destination. The FD detail page must show the ৳500 in its _earned return_ and
_value created_ chart, even though the cash is now held in City Bank.

Do not label ৳400,500 as the FD's “current value” when its principal remains
৳400,000. Use clear labels:

- Current value / principal: ৳400,000
- Interest earned: ৳500
- Total value created: ৳400,500

If the interest is compounded, it is a different transaction: the FD current
value and principal both increase by ৳500.

## Core concepts

### Asset

An asset is a user-owned holding, not a ledger event. It has a stable identity
and basic metadata.

Required fields:

| Field                    | Notes                                                                             |
| ------------------------ | --------------------------------------------------------------------------------- |
| `id`                     | UUID                                                                              |
| `userId`                 | Owner; always required                                                            |
| `name`                   | User-facing name, e.g. `BRAC Bank Fixed Deposit`                                  |
| `kind`                   | `bank_account`, `cash`, `fixed_deposit`, `dps`, `property`, `receivable`, `other` |
| `openedOn`               | `YYYY-MM-DD`                                                                      |
| `isArchived`             | Soft archive, never delete if ledger entries exist                                |
| `createdAt`, `updatedAt` | Unix timestamps                                                                   |

Optional type-specific fields belong in an `asset_details` table or a validated
JSON field only if querying them is unnecessary. Examples: bank name, FD
maturity date, interest rate, property location, borrower name, or DPS monthly
instalment.

### Transaction

A transaction is the user action. It owns the date, note, audit data, and one
or more ledger lines. A transaction must be written atomically: either all its
lines are stored or none are.

```text
asset_transactions
  id, user_id, occurred_on, type, note,
  original_transaction_id (nullable),
  created_at, created_by, version

asset_transaction_lines
  id, transaction_id, asset_id (nullable),
  line_kind, amount, direction, performance_asset_id (nullable),
  created_at
```

`asset_id` may be null only for an external counterparty such as `External use`
or `Interest income`. Do not create fake user assets for those categories.

Use a positive integer `amount`; the line direction expresses the sign:

- `increase`: raises an asset's current value;
- `decrease`: lowers an asset's current value;
- `return`: records value created by `performance_asset_id`; it does **not**
  automatically change that asset's current value;
- `valuation_increase` / `valuation_decrease`: changes an asset's current
  value and its unrealized return.

### Linked performance asset

`performance_asset_id` explains which asset generated a return when the money
lands somewhere else. It solves the FD-interest problem.

For a ৳500 FD interest payment to City Bank:

```text
Transaction: interest_distribution
Line 1: City Bank Savings       increase  ৳500
Line 2: Interest income         return    ৳500  performance_asset_id = FD
```

The bank balance rises. The FD's realized return rises. The FD balance does not
change. The total portfolio rises exactly once.

## Supported transaction types

The API must accept only these explicit types in Phase 1. Each type has a
service-level rule for valid lines; do not rely on the client to enforce it.

| Type                  | Meaning                                                                               | Current-value effect                             |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `opening_balance`     | Initial amount when an asset is added                                                 | Increase the asset                               |
| `transfer`            | Move money/value between two assets                                                   | One decreases, one increases                     |
| `contribution`        | Put bank/cash into an investment or property                                          | Funding asset decreases; target increases        |
| `income_distribution` | Interest/crop income/loan interest paid into cash or bank                             | Destination increases; linked source gets return |
| `compounded_return`   | Interest retained inside an FD/DPS                                                    | Target increases and gets return                 |
| `repayment`           | Borrower pays back principal                                                          | Receivable decreases; bank/cash increases        |
| `lend`                | Give money to another person                                                          | Bank/cash decreases; receivable increases        |
| `withdrawal`          | Remove money from an asset into cash/bank                                             | Source decreases; destination increases          |
| `external_use`        | Money leaves the asset portfolio for an emergency or purchase not tracked as an asset | Source decreases; portfolio decreases            |
| `valuation_update`    | Change property or other asset estimated value                                        | Asset changes; unrealized return changes         |
| `correction`          | Reverse/correct a previous transaction                                                | Must link to original transaction                |

### Required behaviour for common actions

| User action                             | Ledger result                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Deposit money into FD                   | `transfer`: Bank decrease → FD increase                                                  |
| Receive FD interest into bank           | `income_distribution`: Bank increase + return linked to FD                               |
| Compound FD interest                    | `compounded_return`: FD increase + return linked to FD                                   |
| Pay a DPS instalment from bank          | `contribution`: Bank decrease → DPS increase                                             |
| Sell crops and deposit proceeds in bank | `income_distribution`: Bank increase + return linked to land                             |
| Improve land using bank funds           | `contribution`: Bank decrease → Land increase; this is invested capital, not crop income |
| Revalue land                            | `valuation_update`: Land value changes; note/source required                             |
| Buy a plot/flat using bank money        | Create property asset plus `contribution`: Bank decrease → Property increase             |
| Lend a friend money                     | Create/select receivable plus `lend`: Bank decrease → Receivable increase                |
| Receive repayment                       | `repayment`: Receivable decrease → Bank increase                                         |
| Use savings for an emergency            | `external_use`: Asset decreases; portfolio decreases. It is not a transfer.              |

### EMI and loans

If an EMI is paid from an existing bank balance, record it as a contribution to
the property. If a lender provides money and the user owes it back, a future
`liability` module must record the loan as well. Do **not** count loan-funded
property value as net wealth without also recording the matching debt.

Phase 1 may show a note that financed purchases need liability tracking; it
must not silently inflate net assets.

## Calculations

All calculations must be server-side, deterministic, and returned in API
responses. The web client may render them but must not become the source of
truth.

For an asset `A`, through a selected end date:

```text
currentValue(A)
  = sum(increase lines for A)
  - sum(decrease lines for A)
  + sum(valuation changes for A)

realizedReturn(A)
  = sum(return lines where performance_asset_id = A)

unrealizedReturn(A)
  = sum(valuation_increase) - sum(valuation_decrease) for A

totalReturn(A)
  = realizedReturn(A) + unrealizedReturn(A)

valueCreated(A)
  = currentValue(A) + realizedReturn(A)
```

`valueCreated` is an asset-performance measure, not a portfolio-current-value
measure. It can include distributed income that is now held elsewhere.

```text
portfolioCurrentValue
  = sum(currentValue(A) for all active assets)
```

Never add `realizedReturn` separately to `portfolioCurrentValue`, because a
distribution is already present in its destination bank/cash asset.

### Charts

Asset detail must expose two series:

1. **Current value**: value held inside the asset at each date.
2. **Value created**: current value plus cumulative realized return from that
   asset. This lets an FD or land show productive growth after cash proceeds
   move to a bank account.

The UI must label both series clearly. A declining receivable is expected when
the borrower repays; show `Outstanding balance declining` rather than treating
it as poor investment performance.

## UI and forms

All write forms in `apps/web/src/app/assets/` must use React Hook Form and
Zod schemas exported from `@personally/validation`. Do not use ad hoc React
state for submitted values.

### Required forms

- Add asset
- Record transfer / contribution
- Record income distribution
- Record compounded return
- Record lending or repayment
- Record external use
- Record property valuation update
- Create correction

All forms require:

- transaction type;
- valid source and destination where applicable;
- positive whole-BDT amount;
- date picker using the shared `Popover` + `Calendar` composition;
- accessible inline field errors;
- optional note, maximum 2,000 characters;
- a review summary before saving that states the effect on each asset;
- optimistic concurrency version supplied by the API response.

The UI must not offer invalid pairings, such as transferring from an asset to
itself, a repayment larger than a receivable balance, or interest without a
linked earning asset.

## Validation contract

Create `packages/validation/src/assets.ts` and export it from the validation
barrel. Use strict Zod objects. Shared rules include:

- IDs are UUIDs;
- names are trimmed, 1–120 characters;
- notes are nullable and at most 2,000 characters;
- amounts are positive integers no larger than `999999999`;
- dates use the existing strict `YYYY-MM-DD` date schema pattern;
- transaction type is an enum;
- source and destination cannot be the same asset;
- correction requires an original transaction ID and a correction reason.

The API service repeats balance-dependent validation inside the D1 transaction,
because the client may be stale or malicious.

## API and database implementation

Follow the existing direction:

```text
Route → Controller → AssetService → AssetRepository → D1/Drizzle
```

Suggested endpoints:

```text
GET    /assets?asOf=YYYY-MM-DD
POST   /assets
PATCH  /assets/:assetId
POST   /assets/:assetId/archive

GET    /assets/:assetId?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /assets/:assetId/activity?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /assets/:assetId/performance?from=YYYY-MM-DD&to=YYYY-MM-DD

GET    /assets/activity?from=YYYY-MM-DD&to=YYYY-MM-DD&type=...
POST   /assets/transactions
POST   /assets/transactions/:transactionId/corrections
```

Use one committed migration for the initial Assets tables, then define each
table in its own file under `packages/db/src/schema/` and export it through the
schema barrel. Add indexes for `user_id + occurred_on`, `asset_id`, and
`performance_asset_id` lookups.

`POST /assets/transactions` must use one D1 transaction to:

1. confirm ownership and active status of all referenced assets;
2. validate current balance constraints;
3. write the transaction;
4. write every ledger line;
5. increment affected asset versions;
6. return recalculated summaries.

## Audit and correction rules

- Ledger lines and confirmed transactions are append-only.
- Do not expose hard delete for transactions with posted lines.
- A correction creates a new transaction with `original_transaction_id`.
- Display the original and correction together in the activity history.
- Store `created_at`, `created_by`, and a human-readable correction reason.
- Keep an archived asset visible in history and calculations up to its archive
  date; it simply cannot receive new ordinary entries.

## Implementation checklist for an AI

1. Read this document, `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`, and the
   relevant Drizzle, React, shadcn, and Vitest skills before changing code.
2. Add strict validation schemas and tests first.
3. Add the migration and individual Drizzle schema files.
4. Implement repository interfaces plus a D1 repository.
5. Implement service-level ledger rules and calculations with injected
   repositories.
6. Add controller and route composition only after service tests pass.
7. Build React Hook Form dialogs using the shared schemas and date picker.
8. Replace the current dummy Assets UI data with TanStack Query API calls.
9. Add integration tests for ownership, balance validation, atomic writes,
   corrections, and the FD-interest non-double-counting case.
10. Run formatting, lint, typecheck, tests, and the production build.

## Required acceptance scenarios

1. Creating a ৳400,000 FD from a bank lowers the bank and raises the FD by the
   same amount; portfolio current value stays unchanged.
2. Paying ৳500 FD interest into a bank raises portfolio current value by ৳500
   exactly once, keeps FD current value unchanged, and raises FD realized
   return by ৳500.
3. A compounded ৳500 FD interest payment raises both FD current value and FD
   realized return by ৳500, while portfolio current value rises once.
4. A ৳10,000 bank-to-DPS contribution does not change portfolio current value.
5. A ৳28,000 crop sale deposited in bank raises bank value and land realized
   return, without increasing land market value unless separately revalued.
6. Lending ৳50,000 from bank changes bank value and receivable value but not
   portfolio current value.
7. Receiving a ৳10,000 repayment lowers the receivable and raises the bank;
   portfolio current value is unchanged.
8. An emergency external use of ৳10,000 lowers portfolio current value by
   ৳10,000 and creates an auditable history entry.
9. A correction never removes the original transaction from history.
