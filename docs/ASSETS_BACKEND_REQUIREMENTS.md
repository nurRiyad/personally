# Asset backend requirements

## Purpose

Assets is a per-user ledger for things the user owns or is owed. The page must
never treat an editable `currentValue` as the source of truth. A holding's
balance is always calculated from recorded activity. Editing or deleting an
activity therefore recalculates every affected holding and all summaries.

The current UI has three tabs:

- **Overview**: total assets, period growth, liquid money, money lent, asset
  mix, top-growing holdings, and recent activity.
- **Assets**: asset types and the holdings within each type. Users can create,
  rename, and delete types; create, edit, and delete holdings; and open a
  holding detail view.
- **Activity**: a dated, filterable movement ledger. Activities can be created,
  edited, and deleted.

All resources are owned by the authenticated user. IDs, not display names, are
used by the API; names are display-only and may change.

## Domain model

```text
user
 └─ asset type
     └─ asset (holding)
          └─ activity posting(s)
```

An activity records a single amount and one or two postings. A posting either
changes an asset balance or names an external endpoint (`outside` or `personal
use`). The activity, rather than a mutable balance column, is the accounting
record.

### Asset type

Fields: `id`, `userId`, `name`, `normalizedName`, `createdAt`, `updatedAt`.

- A type name is required, trimmed, at most 60 characters, and unique for that
  user case-insensitively.
- Renaming a type changes the label for its existing assets; it does not change
  balances or activity.
- A type can be deleted only when it has no remaining assets. The API returns
  `409 ASSET_TYPE_NOT_EMPTY` otherwise.

### Asset (holding)

Fields: `id`, `userId`, `assetTypeId`, `name`, `detail`, `isLiquid`,
`isReceivable`, `openedOn`, `archivedAt?`, `createdAt`, `updatedAt`.

- `name` is required and at most 120 characters. `detail` is optional and at
  most 200 characters.
- `isLiquid` controls only the liquid-money summary. It is independent of the
  type, so a user can mark individual bank accounts as liquid.
- `isReceivable` identifies a holding as money owed to the user. It drives the
  money-lent summary and validates Lending/Repayment activity. It is separate
  from the user-created asset type, so users may organize receivables under any
  type without the backend relying on a literal type name.
- The asset has **no editable current-balance field**. `openedOn` is retained
  as metadata; it is not changed when the asset is edited.
- Deleting an asset archives it: `archivedAt` is set, its ledger history is
  retained, and it is excluded from active lists and current summaries. It can
  be restored later through a future explicit unarchive operation.
- Creating a holding with an opening value atomically creates an `Opening`
  activity dated `openedOn`, from `outside` to that new asset. This preserves
  the current form's opening-value experience while making the ledger the only
  source of money.

## Activity ledger

Fields: `id`, `userId`, `kind`, `amount`, `activityDate`, `note`,
`sourceAssetId?`, `destinationAssetId?`, `sourceEndpoint?`,
`destinationEndpoint?`, `createdAt`, `updatedAt`.

Amounts are positive integer taka, from 1 through 999,999,999. Dates are
timezone-safe `YYYY-MM-DD` strings. An activity must have exactly one source
and one destination; each endpoint is either an asset ID or one of the allowed
external endpoints. The API must never accept an asset name as an endpoint.

| Kind                       | Source             | Destination        | Effect on assets / total wealth                              |
| -------------------------- | ------------------ | ------------------ | ------------------------------------------------------------ |
| `Opening` (system-created) | Outside assets     | Holding            | destination increases; total increases                       |
| `Income`                   | Outside assets     | Holding            | destination increases; total increases                       |
| `Growth`                   | Growth/return      | Holding            | destination increases; total increases                       |
| `Transfer`                 | Holding            | Holding            | source decreases, destination increases; total unchanged     |
| `Contribution`             | Holding            | Holding            | source decreases, destination increases; total unchanged     |
| `Lending`                  | Holding            | Money-lent holding | source decreases, receivable increases; total unchanged      |
| `Repayment`                | Money-lent holding | Holding            | receivable decreases, destination increases; total unchanged |
| `External use`             | Holding            | Personal use       | source decreases; total decreases                            |

Rules enforced by the service, even if the UI is bypassed:

- Both referenced assets must belong to the authenticated user and be active.
- Transfer-like activities require two distinct assets.
- External endpoints are valid only for the appropriate kind; the client may
  not send arbitrary strings such as `Asset value`.
- `Lending` must end at an `isReceivable` holding. `Repayment` must originate
  from one. An asset cannot be both `isLiquid` and `isReceivable`.
- `Income`, `Growth`, and `Opening` have an external source; `External use` has
  an external destination.
- A debit may not make an asset balance negative. This check considers the
  complete ledger, ordered by `activityDate`, then `createdAt`, then `id`.
- Activities can be backdated, edited, or deleted only when the resulting
  ledger still has no negative balance. The service performs the validation and
  write in one D1 transaction/batch.
- Activities have no separate balance-update operation. Any cached balances,
  if later introduced for performance, are projections that must be rebuilt
  from this ledger.

## Calculations and period behavior

The API calculates balances using signed postings: destination is `+amount`;
source is `-amount`.

- **Current value**: all postings through today for the holding.
- **Total assets**: sum of active holdings' current values.
- **Liquid money**: sum of current values where `isLiquid = true`.
- **Money lent**: sum of current values of receivable/money-lent holdings.
- **Period change**: closing total at period end minus opening total immediately
  before period start. It is not the sum of every activity in the period,
  because transfers should not inflate growth.
- **Asset mix**: current values grouped by type.
- **Top growing assets**: rank by period change divided by period opening value;
  assets with zero opening value need an agreed display rule (see open questions).
- **Holding detail**: current value, period change, activity count, activity
  history, and a real balance-over-time series calculated from dated postings.

The existing static charts are placeholders. The backend should return dated
series points; the web client renders the chart.

## API contract

All routes require bearer authentication and return `{ "data": ... }`.
Dates, amounts, IDs, and pagination are validated with shared Zod schemas in
`@personally/validation` before the controller runs.

| Method and route                        | Request                                                                    | Result                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET /assets/dashboard?from&to`         | optional ISO date range                                                    | summary cards, type mix, top growth, recent activity, portfolio series |
| `GET /assets/types`                     | —                                                                          | types with active-asset counts                                         |
| `POST /assets/types`                    | `{ name }`                                                                 | created type, `201`                                                    |
| `PATCH /assets/types/:typeId`           | `{ name }`                                                                 | renamed type                                                           |
| `DELETE /assets/types/:typeId`          | —                                                                          | deleted type or `409` if non-empty                                     |
| `GET /assets`                           | optional `typeId`, `includeArchived`                                       | holdings grouped or list form, with derived balances                   |
| `POST /assets`                          | `{ typeId, name, detail, isLiquid, isReceivable, openedOn, openingValue }` | holding plus system opening activity, `201`                            |
| `GET /assets/:assetId?from&to`          | optional date range                                                        | holding metadata, derived values, history, series                      |
| `PATCH /assets/:assetId`                | `{ typeId?, name?, detail?, isLiquid?, isReceivable? }`                    | changed metadata; no amount fields                                     |
| `DELETE /assets/:assetId`               | —                                                                          | archives the asset                                                     |
| `GET /assets/activities`                | `from`, `to`, `kind`, `assetId`, `page`, `pageSize`                        | newest-first ledger page                                               |
| `POST /assets/activities`               | typed activity endpoint IDs, amount, date, note                            | created activity and affected derived balances, `201`                  |
| `PATCH /assets/activities/:activityId`  | same editable activity fields                                              | updated activity and recalculated balances                             |
| `DELETE /assets/activities/:activityId` | —                                                                          | deleted activity and recalculated balances                             |

Use an ID-based activity request such as:

```json
{
  "kind": "Transfer",
  "source": { "assetId": "asset-a" },
  "destination": { "assetId": "asset-b" },
  "amount": 5000,
  "activityDate": "2026-09-27",
  "note": "September DPS instalment"
}
```

External endpoints are explicit values, for example `{ "endpoint": "outside" }`
or `{ "endpoint": "personal_use" }`; they are not pseudo-assets.

## Database and implementation plan

1. Add a committed migration in `packages/db/migrations` for `asset_types`,
   `assets`, and `asset_activities`, including user ownership foreign keys,
   endpoint/check constraints, and indexes for user/date and asset/date reads.
2. Mirror each table in its own Drizzle schema file and export it through the
   schema barrel.
3. Add request/response Zod schemas and tests to `packages/validation`.
4. Implement `D1AssetRepository`, `AssetService`, `AssetController`, and
   `asset.routes.ts`, then wire them at the route composition boundary. This
   follows the existing Route -> Controller -> Service -> Repository pattern.
5. Add integration tests for ownership isolation, every activity kind,
   activity edit/delete recalculation, negative-balance rejection, type deletion
   rejection, archival behavior, and receivable validation.
6. Replace the Asset UI's in-memory sample state with API queries/mutations.
   The UI must submit asset and type IDs, show API validation errors, invalidate
   dashboard/list/detail queries after mutation, and render returned series.

## UI changes required for the backend contract

- Keep the Add holding `openingValue` control only as a convenience: label it
  **Opening balance** and state that saving creates an opening activity.
- Remove `openingValue` and `openedOn` from Edit holding. The current value is
  already read-only; the API must reject it if submitted.
- Replace name-based selectors in record/edit activity with asset-ID selectors.
- The UI currently finds a lending holding by a name beginning with “Money
  lent”; replace this with backend-provided receivable eligibility.
- The obsolete `Recorded`/`Verified` badge is removed. Activities have no
  verification state in this release.

## Confirmed product decisions and remaining assumption

- Asset deletion archives the asset and retains its history.
- Receivables use the per-asset `isReceivable` flag described above; this is
  safer and more flexible than treating a user-editable type name as a rule.
- Activities have no `Recorded`/`Verified` status in this release.
- An asset with zero opening balance and later positive value displays a growth
  label of `New` rather than an artificial percentage.
- Until overdrafts are explicitly needed, the backend rejects any operation
  that would make a holding balance negative.
- The dashboard accepts arbitrary date ranges while the UI may initially keep
  its calendar-year and all-time choices.
