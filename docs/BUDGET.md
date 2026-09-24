# Budget feature

This is the implementation reference for the authenticated monthly-budget feature. It describes the behavior currently present in the staged code, not an aspirational product specification.

## Scope and user flow

The protected web route is `/budget`. A user works with one calendar month at a time, identified by a timezone-safe `YYYY-MM` key. A month is explicitly created when it does not exist; a `GET` never creates one.

Within an existing month, the user can review Income, Planned, Spent, and Remaining totals; manage recurring income sources and received-income entries; manage budget groups (called **blocks** in the UI) and recurring budget items; record and delete expenses; inspect source/item activity in the sidebar; edit a monthly note; and copy the planned structure to the next month. Copying can include recurring sources/items only or all sources/items. It always creates an empty note and does not copy income or expense history.

There is no demo seed data, shopping-list persistence, activity editing, reordering, group editing, or year-summary UI/API in this implementation.

## Frontend

`apps/web/src/app/budget/page.tsx` protects the route and renders `BudgetWorkspace` from `budget-ui.tsx`. The workspace fetches a normalized API month, maps it to the display model with `fromApi`, and refreshes after a successful mutation. `apps/web/src/lib/api/budget.ts` is the only budget API client and parses month responses with `budgetMonthResponseSchema` from `@personally/validation`.

`budget-data.ts` owns display-only types and helpers. Currency is displayed as whole Bangladeshi taka (`৳`), and display totals/percentages use integer amounts. The UI derives displayed summary/activity data from the mapped response even though the API also returns server-derived summaries and recent activity.

`budget-forms.tsx` uses React Hook Form. Date controls use the shared `Calendar` component and keep values as `YYYY-MM-DD` strings. Mutation requests send the loaded budget's `monthVersion`; after successful mutations the UI refreshes the full month.

The switcher starts at the current local month. Its previous/next arithmetic currently uses a 2026-based helper, and its options are only months already loaded in browser state; the available-months endpoint is not yet used. Preserve group/source/item IDs in future UI work. The top-level “Add expense” flow currently falls back from the selected item to a displayed category, then an item named `Food`; replace that with explicit item selection if the flow expands.

## API

All routes are mounted below `/budget`, require authentication, return `{ data: ... }`, and scope reads/writes to the authenticated user. `apps/api/src/routes/index.ts` constructs `BudgetController`, `BudgetService`, and `D1BudgetRepository` for the route tree.

| Method         | Path                                      | Purpose                                                        |
| -------------- | ----------------------------------------- | -------------------------------------------------------------- |
| GET            | `/budget/months?year=YYYY`                | List the user's stored months with summary and version.        |
| GET            | `/budget/months/:month`                   | Fetch one full month document; returns 404 if absent.          |
| POST           | `/budget/months`                          | Create an empty month.                                         |
| PATCH          | `/budget/months/:month`                   | Replace the monthly note.                                      |
| POST           | `/budget/months/:month/income-sources`    | Add an income source.                                          |
| PATCH / DELETE | `/budget/income-sources/:sourceId`        | Update or delete an income source.                             |
| POST           | `/budget/income-sources/:sourceId/income` | Record income received.                                        |
| DELETE         | `/budget/income-entries/:incomeEntryId`   | Delete a received-income entry.                                |
| POST           | `/budget/months/:month/groups`            | Add a group.                                                   |
| DELETE         | `/budget/groups/:groupId`                 | Delete an empty group.                                         |
| POST           | `/budget/months/:month/items`             | Add an item to a group in that month.                          |
| PATCH / DELETE | `/budget/items/:itemId`                   | Update or delete an item.                                      |
| POST           | `/budget/items/:itemId/expenses`          | Record an expense.                                             |
| DELETE         | `/budget/expenses/:expenseId`             | Delete an expense.                                             |
| POST           | `/budget/months/:month/copy`              | Copy recurring or all planned structure to a new target month. |

Request schemas live in `packages/validation/src/budget.ts`. Names are trimmed and limited to 120 characters, notes are nullable and limited to 2,000 characters, amounts are bounded integers, month keys are valid `YYYY-MM`, and activity dates are valid `YYYY-MM-DD`. Income and expenses must be positive; planned amounts may be zero. Activity dates must be inside their owning budget month.

Every mutation other than month creation requires a positive `monthVersion`. `budget_months.version` is incremented after mutation. A stale version returns `409 BUDGET_CONFLICT`; refresh and retry rather than silently overwriting another change.

An income source with entries cannot be deleted. A group with items cannot be deleted. An item with expenses cannot be deleted.

## Response and calculations

`GET /budget/months/:month` and every successful mutation return `BudgetMonth`, validated by `budgetMonthResponseSchema`. The response has the month ID/key/note/version, ordered income sources with histories and derived summaries, ordered groups with items and expense histories and derived summaries, and up to ten recent expenses with item/group metadata.

```text
planned   = sum(item.plannedAmount)
spent     = sum(expense.amount)
earned    = sum(incomeEntry.amount)
remaining = earned - spent
usage     = denominator === 0 ? 0 : min(100, round(numerator / denominator * 100))
```

Item `remaining` is planned minus spent; income-source `remaining` is planned minus earned. Store and calculate currency as integers: do not introduce floating-point currency values.

## Data model and migration

`packages/db/migrations/0004_monthly_budget.sql` is the migration source of truth; `packages/db/src/schema/budget.ts` mirrors it. The tables are:

- `budget_months`: owner, unique month key, note, timestamps, and optimistic-lock version.
- `budget_income_sources` and `budget_income_entries`: planned and actual income.
- `budget_groups` and `budget_items`: planned spending structure and metadata.
- `budget_expenses`: actual spending against an item.

Foreign keys use cascade/restrict behavior appropriate to their parent. Case-insensitive unique indexes prevent duplicate source, group, and item names within a month. Position columns preserve source/group/item ordering; new records take the next position.

For local database work, use Wrangler local D1 as documented in `docs/DEVELOPMENT.md`; never connect ordinary local development to production D1. Commit intentional migrations and Drizzle metadata together.

## Change checklist

1. Keep the dependency direction Route → Controller → Service → Repository → D1.
2. Update shared Zod schemas with request or response changes.
3. Scope all queries through the authenticated owner and retain version checks on writes.
4. Update the frontend client and mapper with any response-shape change.
5. Keep month/date keys as strings and currency as integers.
6. Add/update the committed migration and schema barrel for persisted-model changes.
