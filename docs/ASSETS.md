# Asset Management Specification

This document is the implementation contract for the `/assets` module. It
defines the accounting meaning of each record so the UI, API, database, and
future AI implementation work agree on the same numbers.

## Goal

Assets tracks what the user owns, owes, what each holding has earned, and where
money moves. It is not a general expense log. Budget remains the place for
monthly spending planning.

The module supports:

- cash and bank accounts;
- fixed deposits (FDs);
- DPS / recurring savings;
- land, flats, plots, and other property;
- money lent to people (receivables);
- financing liabilities that must be included when reporting net worth;
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
7. **A financed asset is not net wealth on its own.** Show the asset's value,
   the related outstanding liability, and net worth separately. Never hide a
   loan behind an asset total.

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

### Asset type and display grouping

An asset record remains the atomic, ledger-backed unit. Do not create one
combined “all FDs”, “all land”, or “money lent” asset: that would prevent a
separate maturity date, valuation, crop return, borrower balance, or correction
from being recorded accurately.

Use the existing `kind` as the accounting type and add a non-ledger
`displayGroup` / category in API responses for presentation. It is calculated
from the asset type, not a parent asset with its own balance.

| User holdings                | Separate records                                                | Dashboard and Assets-list group |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------- |
| 3 fixed deposits             | One `fixed_deposit` per certificate/account                     | Deposits & savings              |
| 1 DPS                        | One `dps`                                                       | Deposits & savings              |
| 3 agricultural land holdings | One `property` per plot, with `propertyType: agricultural_land` | Land & property                 |
| 1 flat                       | One `property`, with `propertyType: flat`                       | Land & property                 |
| 3 people who borrowed money  | One `receivable` per borrower/loan                              | Money lent                      |

Bank accounts and cash use the **Cash & bank** group. Each grouped row must
show its count and aggregate current value, and expand to the individual
records. The group total is display-only and must never receive a transaction
or be included again in portfolio totals.

Only land the user owns is a property asset. If “borrowed land” means rented,
leased, or otherwise used for agriculture without ownership, do not add its
market value to assets. Track the lease expense in Budget and, if crop activity
needs to be tracked later, model it as an agricultural operation with its own
income and costs rather than as owned land.

Keep a person’s receivable separate from another person’s even when both loans
were made on the same day. A single borrower may have one receivable with
multiple lending and repayment transactions, unless their loans need separate
terms or independent tracking.

### Liability

A liability is a stable obligation, not a negative asset. Phase 1 needs a
liability record when a flat or other property is financed.

| Field                                              | Notes                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `id`, `userId`, `name`                             | Stable identity and owner                                          |
| `kind`                                             | Initially `property_loan`; extend later without changing reporting |
| `openedOn`, `originalAmount`, `outstandingBalance` | Time-safe start date and amounts derived from its ledger           |
| `linkedAssetId`                                    | Optional link to the financed flat/property                        |
| `nextDueOn`, `monthlyPayment`                      | Optional reminder metadata; these do not calculate the balance     |
| `isArchived`, timestamps                           | Same audit and lifecycle expectations as assets                    |

Liabilities have their own immutable balance movements. They are not folded
into `portfolioCurrentValue`; they are subtracted only when calculating net
worth.

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

For a flat bought with a loan, create the property asset and a linked
`property_loan` liability at the same time. The purchase may show the flat at
its cost or an explicitly recorded valuation; the loan creates the matching
outstanding liability. The dashboard may show gross assets before the liability
is entered, but it must label that number **Gross assets**, not net worth.

An EMI is not a contribution to the property. Split every EMI into:

- **principal:** bank/cash decreases and the linked liability decreases by the
  same amount; net worth does not change;
- **interest and charges:** bank/cash decreases and the amount is recorded as
  a Budget expense; it reduces net worth;
- **insurance or other optional components:** record explicitly rather than
  silently adding them to principal or property value.

Property value changes only through an explicit `valuation_update` (or capital
improvement recorded as a separate contribution with a note). This keeps the
flat's value, loan balance, and paid EMI understandable.

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

totalLiabilities
  = sum(outstandingBalance(L) for all active liabilities)

netWorth
  = portfolioCurrentValue - totalLiabilities
```

Never add `realizedReturn` separately to `portfolioCurrentValue`, because a
distribution is already present in its destination bank/cash asset.

`portfolioCurrentValue` is the **gross-assets** number. Only `netWorth` is the
amount after the flat loan and other liabilities are deducted.

### Charts

Asset detail must expose two series:

1. **Current value**: value held inside the asset at each date.
2. **Value created**: current value plus cumulative realized return from that
   asset. This lets an FD or land show productive growth after cash proceeds
   move to a bank account.

The UI must label both series clearly. A declining receivable is expected when
the borrower repays; show `Outstanding balance declining` rather than treating
it as poor investment performance.

## Web information architecture

### Assets page

Keep the three current sections—**Overview**, **Assets**, and **Activity**—but
make the Overview a portfolio summary and make the Assets section grouped and
expandable.

1. **Overview:** show `Gross assets`, `Liabilities`, and `Net worth` as the
   primary values. Keep `Liquid money` and the next due item as supporting
   values. An allocation chart uses gross assets only and says so in its label.
2. **Grouped holdings:** show Cash & bank, Deposits & savings, Land & property,
   and Money lent. Each group shows its aggregate, holding count, and a
   disclosure control. Opening it reveals each FD, DPS, plot, flat, or
   receivable. Do not replace the individual rows with the group total.
3. **Liabilities:** show a separate group after holdings, visually marked as a
   deduction. A flat loan row shows outstanding balance, next EMI date, and a
   link to the flat it finances.
4. **Detail view:** retain separate `Current value` and `Total return` for an
   earning asset. A flat detail also shows its linked loan and `Equity = flat
value − outstanding loan`; a receivable says `Outstanding balance`, not
   negative growth.
5. **Activity:** distinguish `valuation update`, `loan principal payment`, and
   `EMI interest` from transfers. A transaction detail shows all affected
   holdings and liabilities so a user can audit the result.

The page needs a real **Add holding** entry point in addition to **Record
activity**. The add flow first asks for type; type-specific fields then appear:
FD maturity/rate, DPS instalment, land/flat property type and location,
borrower and repayment terms, or flat-loan details. This corrects the current
prototype's fixed five-type sample model without implementing it yet.

### Home dashboard

The home dashboard should be intentionally simpler than `/assets`: one compact
**Net worth** card followed by grouped holdings, not every individual record.

| Dashboard group    | Includes                        | Shows                                   |
| ------------------ | ------------------------------- | --------------------------------------- |
| Deposits & savings | 3 FDs and 1 DPS                 | Aggregate value and `4 holdings`        |
| Land & property    | 3 agricultural plots and 1 flat | Aggregate value and `4 holdings`        |
| Money lent         | 3 receivables                   | Outstanding aggregate and `3 borrowers` |
| Liabilities        | Flat loan                       | Outstanding loan balance as a deduction |

Selecting a group opens `/assets` with that group preselected; selecting a
holding there opens its detail. The dashboard's attention list should combine
the nearest FD maturity, DPS instalment, borrower repayment, and flat EMI due
date. Grouping changes only the presentation—it never changes balances or
ledger ownership.

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
- Add or update a linked property-loan liability
- Record an EMI split into principal and interest
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
- a property-loan liability must have a non-negative outstanding balance and,
  when linked, reference a property owned by the same user;
- an EMI principal payment cannot exceed the liability's outstanding balance;
- interest and charges in an EMI must be sent to Budget rather than increasing
  the property's current value.

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

GET    /liabilities?asOf=YYYY-MM-DD
POST   /liabilities
PATCH  /liabilities/:liabilityId
POST   /liabilities/:liabilityId/archive

GET    /assets/:assetId?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /assets/:assetId/activity?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /assets/:assetId/performance?from=YYYY-MM-DD&to=YYYY-MM-DD

GET    /assets/activity?from=YYYY-MM-DD&to=YYYY-MM-DD&type=...
POST   /assets/transactions
POST   /liabilities/:liabilityId/emi-payments
POST   /assets/transactions/:transactionId/corrections
```

Use one committed migration for the initial Assets and liabilities tables, then
define each table in its own file under `packages/db/src/schema/` and export it
through the schema barrel. Add indexes for `user_id + occurred_on`, `asset_id`,
`performance_asset_id`, and `linked_asset_id` lookups.

`POST /assets/transactions` must use one D1 transaction to:

1. confirm ownership and active status of all referenced assets and
   liabilities;
2. validate current balance constraints;
3. write the transaction;
4. write every ledger line;
5. increment affected asset and liability versions;
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
8. Implement grouped holdings and the net-worth summary before the individual
   asset-detail polish; the home dashboard consumes those summary groups.
9. Replace the current dummy Assets UI data with TanStack Query API calls.
10. Add integration tests for ownership, balance validation, atomic writes,
    corrections, the FD-interest non-double-counting case, grouped totals, and
    EMI principal/interest handling.
11. Run formatting, lint, typecheck, tests, and the production build.

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
10. Three FDs, three agricultural plots, and three receivables remain separate
    ledger-backed records while their dashboard groups show the correct count
    and aggregate current value without adding it twice to gross assets.
11. A financed flat shows its property value and its linked outstanding loan;
    net worth equals gross assets less that loan.
12. A ৳30,000 EMI with ৳24,000 principal and ৳6,000 interest lowers bank/cash
    by ৳30,000, lowers the liability by ৳24,000, creates a ৳6,000 Budget
    expense, and does not automatically increase the flat's value.
