'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Landmark,
  Leaf,
  Plus,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog';
import { Select } from '../../components/ui/select';

type AssetKind =
  'Bank account' | 'Fixed deposit' | 'DPS' | 'Land' | 'Money lent';
type ActivityKind = 'Income' | 'Transfer' | 'Contribution' | 'Repayment';
type Asset = {
  id: string;
  name: string;
  kind: AssetKind;
  value: number;
  change: number;
  detail: string;
  tone: string;
};
type Activity = {
  id: string;
  date: string;
  title: string;
  kind: ActivityKind;
  amount: number;
  from: string;
  to: string;
  note: string;
  status: 'Recorded' | 'Verified';
};

const assets: Asset[] = [
  {
    id: 'city-bank',
    name: 'City Bank Savings',
    kind: 'Bank account',
    value: 186_500,
    change: 11_200,
    detail: 'Available balance',
    tone: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'brac-fd',
    name: 'BRAC Bank Fixed Deposit',
    kind: 'Fixed deposit',
    value: 400_000,
    change: 24_000,
    detail: 'Matures 15 Dec 2026',
    tone: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'dps',
    name: 'Monthly DPS',
    kind: 'DPS',
    value: 148_000,
    change: 30_000,
    detail: '৳5,000 monthly · 18 months left',
    tone: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'rangpur-land',
    name: 'Rangpur agricultural land',
    kind: 'Land',
    value: 1_240_000,
    change: 95_000,
    detail: 'Crop income ৳76,000 this year',
    tone: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'rahim',
    name: 'Money lent to Rahim',
    kind: 'Money lent',
    value: 65_000,
    change: -15_000,
    detail: 'Next repayment 10 Oct 2026',
    tone: 'bg-rose-100 text-rose-700',
  },
];

const activities: Activity[] = [
  {
    id: 'a1',
    date: '18 Sep 2026',
    title: 'Fixed-deposit interest received',
    kind: 'Income',
    amount: 6_000,
    from: 'BRAC Bank Fixed Deposit',
    to: 'City Bank Savings',
    note: 'Quarterly interest payment',
    status: 'Verified',
  },
  {
    id: 'a2',
    date: '11 Sep 2026',
    title: 'Crop sale recorded',
    kind: 'Income',
    amount: 28_000,
    from: 'Rangpur agricultural land',
    to: 'City Bank Savings',
    note: 'Aman rice sale',
    status: 'Verified',
  },
  {
    id: 'a3',
    date: '05 Sep 2026',
    title: 'DPS contribution',
    kind: 'Contribution',
    amount: 5_000,
    from: 'City Bank Savings',
    to: 'Monthly DPS',
    note: 'September instalment',
    status: 'Verified',
  },
  {
    id: 'a4',
    date: '02 Sep 2026',
    title: 'Loan repayment received',
    kind: 'Repayment',
    amount: 10_000,
    from: 'Money lent to Rahim',
    to: 'City Bank Savings',
    note: 'Partial repayment',
    status: 'Recorded',
  },
  {
    id: 'a5',
    date: '15 Aug 2026',
    title: 'Land value reviewed',
    kind: 'Transfer',
    amount: 60_000,
    from: 'Rangpur agricultural land',
    to: 'Asset value',
    note: 'Annual estimated market-value update',
    status: 'Verified',
  },
];

const tabs = ['Overview', 'Assets', 'Activity'] as const;
const currency = (value: number) =>
  `৳${new Intl.NumberFormat('en-BD').format(value)}`;

function AssetIcon({ kind }: { kind: AssetKind }) {
  const className = 'size-5';
  if (kind === 'Land') return <Leaf className={className} />;
  if (kind === 'Fixed deposit') return <Landmark className={className} />;
  if (kind === 'DPS') return <WalletCards className={className} />;
  if (kind === 'Money lent') return <CircleDollarSign className={className} />;
  return <Banknote className={className} />;
}

function GrowthChart() {
  return (
    <div
      className="mt-7 h-52 w-full"
      aria-label="Asset value growth from January to September 2026"
    >
      <svg
        viewBox="0 0 680 210"
        className="h-full w-full overflow-visible"
        role="img"
      >
        <defs>
          <linearGradient id="asset-growth" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[34, 78, 122, 166].map((y) => (
          <line
            key={y}
            x1="0"
            x2="680"
            y1={y}
            y2={y}
            stroke="#e2e8f0"
            strokeDasharray="3 6"
          />
        ))}
        <path
          d="M0 155 C46 145 64 150 96 141 S155 132 184 130 S236 119 269 123 S321 102 354 104 S411 96 438 85 S497 82 524 69 S583 52 616 48 S658 40 680 27 L680 188 L0 188 Z"
          fill="url(#asset-growth)"
        />
        <path
          d="M0 155 C46 145 64 150 96 141 S155 132 184 130 S236 119 269 123 S321 102 354 104 S411 96 438 85 S497 82 524 69 S583 52 616 48 S658 40 680 27"
          fill="none"
          stroke="#0f766e"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <circle
          cx="680"
          cy="27"
          r="5"
          fill="#0f766e"
          stroke="white"
          strokeWidth="3"
        />
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(
          (month, index) => (
            <text
              key={month}
              x={index * 85}
              y="208"
              fill="#64748b"
              fontSize="11"
            >
              {month}
            </text>
          ),
        )}
      </svg>
    </div>
  );
}

export function AssetsWorkspace() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const [year, setYear] = useState('2026');
  const [activityFilter, setActivityFilter] = useState('All activity');
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const total = assets.reduce((sum, asset) => sum + asset.value, 0);
  const yearlyChange = assets.reduce((sum, asset) => sum + asset.change, 0);
  const filteredActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activityFilter === 'All activity' || activity.kind === activityFilter,
      ),
    [activityFilter],
  );
  const visibleActivities =
    activeTab === 'Activity' ? filteredActivities : activities.slice(0, 4);
  return (
    <main className="page-transition mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Asset management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            A clearer picture of what you own.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track your savings, investments, and money movement in one trusted
            place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            label="Period"
            value={year}
            options={['All time', '2026', '2025']}
            onValueChange={setYear}
          />
          <Button onClick={() => setShowNewActivity(true)}>
            <Plus className="size-4" /> Record activity
          </Button>
        </div>
      </header>
      <nav
        aria-label="Asset sections"
        className="mt-6 flex w-fit rounded-xl bg-slate-100 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tab}
          </button>
        ))}
      </nav>
      {activeTab !== 'Activity' && (
        <section
          aria-label="Asset summary"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            icon={<WalletCards className="size-5" />}
            label="Total assets"
            value={currency(total)}
            detail="Across 5 tracked assets"
            tone="!bg-slate-950 text-white"
          />
          <SummaryCard
            icon={<TrendingUp className="size-5" />}
            label={`${year === 'All time' ? 'Total' : year} growth`}
            value={`+${currency(yearlyChange)}`}
            detail="+11.2% from opening value"
            tone="!bg-emerald-50 text-emerald-800"
          />
          <SummaryCard
            icon={<Banknote className="size-5" />}
            label="Liquid money"
            value={currency(186_500)}
            detail="Ready in bank accounts"
            tone="!bg-sky-50 text-sky-800"
          />
          <SummaryCard
            icon={<ShieldCheck className="size-5" />}
            label="Verified entries"
            value="4 of 5"
            detail="One entry needs review"
            tone="!bg-violet-50 text-violet-800"
          />
        </section>
      )}
      {activeTab === 'Overview' && (
        <Overview total={total} onViewAssets={() => setActiveTab('Assets')} />
      )}
      {activeTab === 'Assets' && (
        <section className="mt-6">
          <AssetsList onSelectAsset={setSelectedAsset} />
        </section>
      )}
      {activeTab === 'Activity' && (
        <ActivityLog
          activities={visibleActivities}
          filter={activityFilter}
          onFilterChange={setActivityFilter}
        />
      )}
      <Dialog
        open={showNewActivity}
        onClose={() => setShowNewActivity(false)}
        title="Record asset activity"
        description="Each entry becomes part of your permanent movement history."
      >
        <div className="space-y-3">
          {[
            [
              'Income received',
              'Record FD interest, crop sales, or loan interest.',
              ArrowDownLeft,
            ],
            [
              'Transfer between assets',
              'Move money without changing your total wealth.',
              ArrowUpRight,
            ],
            [
              'Add investment or contribution',
              'Record a DPS instalment or money put into an asset.',
              TrendingUp,
            ],
          ].map(([title, description, Icon]) => {
            const IconComponent = Icon as typeof ArrowDownLeft;
            return (
              <button
                key={title as string}
                type="button"
                onClick={() => setShowNewActivity(false)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
                  <IconComponent className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {title as string}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {description as string}
                  </span>
                </span>
                <ChevronRight className="ml-auto size-4 text-slate-400" />
              </button>
            );
          })}
        </div>
      </Dialog>
      <Dialog
        open={selectedAsset !== null}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.name ?? ''}
        description={
          selectedAsset ? `${selectedAsset.kind} · ${selectedAsset.detail}` : ''
        }
      >
        {selectedAsset && <AssetDetail asset={selectedAsset} year={year} />}
      </Dialog>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <Card className={`p-5 ${tone}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium opacity-75">{label}</p>
        <span className="opacity-80">{icon}</span>
      </div>
      <p className="mt-6 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs opacity-70">{detail}</p>
    </Card>
  );
}
function Overview({
  total,
  onViewAssets,
}: {
  total: number;
  onViewAssets: () => void;
}) {
  const assetGroups = [
    { name: 'Land & property', value: 1_240_000, color: 'bg-emerald-500' },
    { name: 'Fixed deposits', value: 400_000, color: 'bg-violet-500' },
    { name: 'Cash & bank', value: 186_500, color: 'bg-sky-500' },
    { name: 'DPS & savings', value: 148_000, color: 'bg-amber-500' },
    { name: 'Money lent', value: 65_000, color: 'bg-rose-500' },
  ];
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
      <Card className="overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Portfolio growth
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your total asset value is trending upward this year.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
            <p className="text-xs font-medium text-emerald-700">Sep 2026</p>
            <p className="text-sm font-semibold text-emerald-800">
              {currency(total)}
            </p>
          </div>
        </div>
        <GrowthChart />
      </Card>
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Asset mix</p>
            <p className="mt-1 text-sm text-slate-500">
              Where your value is held.
            </p>
          </div>
          <div className="size-12 rounded-full border-[9px] border-emerald-500 border-r-violet-500 border-b-sky-500 border-l-amber-500" />
        </div>
        <div className="mt-6 space-y-3">
          {assetGroups.map((group) => (
            <div key={group.name} className="flex items-center gap-3">
              <span className={`size-2.5 rounded-full ${group.color}`} />
              <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">
                {group.name}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {currency(group.value)}
              </span>
              <span className="w-8 text-right text-xs text-slate-500">
                {Math.round((group.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </Card>
      <section className="grid gap-5 xl:col-span-2 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Coming up
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The next actions that need your attention.
              </p>
            </div>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <CalendarClock className="size-4" />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            <Reminder
              title="Rahim repayment due"
              detail="10 Oct · ৳10,000 expected"
              tone="bg-rose-50 text-rose-700"
            />
            <Reminder
              title="FD interest expected"
              detail="15 Dec · BRAC Bank"
              tone="bg-violet-50 text-violet-700"
            />
            <Reminder
              title="Next DPS instalment"
              detail="05 Oct · ৳5,000"
              tone="bg-amber-50 text-amber-700"
            />
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Recent movement
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest recorded asset activity.
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAssets}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View assets
            </button>
          </div>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {activities.slice(0, 3).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 px-5 py-4 sm:px-6"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ArrowDownLeft className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {activity.title}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {activity.from} → {activity.to}
                  </span>
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {currency(activity.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
function AssetsList({
  onSelectAsset,
}: {
  onSelectAsset: (asset: Asset) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-950">All assets</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current value, returns, and important next steps.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {assets.length} total
        </span>
      </div>
      <div className="border-t border-slate-100">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelectAsset(asset)}
            className="group flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left last:border-b-0 hover:bg-slate-50 sm:px-6"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${asset.tone}`}
            >
              <AssetIcon kind={asset.kind} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">
                {asset.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {asset.kind} · {asset.detail}
              </span>
            </span>
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-slate-900">
                {currency(asset.value)}
              </span>
              <span
                className={`block text-xs font-medium ${asset.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
              >
                {asset.change >= 0 ? '+' : ''}
                {currency(asset.change)} this year
              </span>
            </span>
            <ChevronRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
          </button>
        ))}
      </div>
    </Card>
  );
}
function Reminder({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <span className={`size-2 rounded-full ${tone}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800">
          {title}
        </span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
      <ChevronRight className="size-4 text-slate-400" />
    </div>
  );
}
function ActivityLog({
  activities: activityItems,
  filter,
  onFilterChange,
}: {
  activities: Activity[];
  filter: string;
  onFilterChange: (value: string) => void;
}) {
  return (
    <section className="mt-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Movement history
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Every entry has a source, destination, and record status.
            </p>
          </div>
          <Select
            label="Filter activity"
            value={filter}
            options={[
              'All activity',
              'Income',
              'Transfer',
              'Contribution',
              'Repayment',
            ]}
            onValueChange={onFilterChange}
          />
        </div>
        <div className="divide-y divide-slate-100">
          {activityItems.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:px-6"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${activity.kind === 'Income' || activity.kind === 'Repayment' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
              >
                {activity.kind === 'Income' || activity.kind === 'Repayment' ? (
                  <ArrowDownLeft className="size-5" />
                ) : (
                  <ArrowUpRight className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {activity.title}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${activity.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                  >
                    {activity.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {activity.date} · {activity.from}{' '}
                  <span aria-hidden="true">→</span> {activity.to}
                </p>
                <p className="mt-1 text-xs text-slate-400">{activity.note}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {currency(activity.amount)}
              </p>
            </div>
          ))}
          {activityItems.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">
              No matching activity found.
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}
function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function AssetDetail({ asset, year }: { asset: Asset; year: string }) {
  const relatedActivity = activities.filter(
    (activity) => activity.from === asset.name || activity.to === asset.name,
  );
  const isDeclining = asset.change < 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <DetailMetric label="Current value" value={currency(asset.value)} />
        <DetailMetric
          label={`${year} change`}
          value={`${isDeclining ? '' : '+'}${currency(asset.change)}`}
        />
        <DetailMetric
          label="Recorded activity"
          value={`${relatedActivity.length} entries`}
        />
      </div>
      <section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Value trend
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isDeclining
                ? 'The outstanding value is decreasing as money is repaid.'
                : 'This asset has grown over the selected period.'}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isDeclining ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
          >
            {isDeclining ? 'Declining' : 'Growing'}
          </span>
        </div>
        <AssetGrowthChart declining={isDeclining} />
      </section>
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              All activity
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Every movement linked to this asset.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            Traceable history
          </span>
        </div>
        <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {relatedActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${activity.kind === 'Income' || activity.kind === 'Repayment' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
              >
                {activity.kind === 'Income' || activity.kind === 'Repayment' ? (
                  <ArrowDownLeft className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {activity.title}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {activity.date} · {activity.from} → {activity.to}
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {currency(activity.amount)}
              </span>
            </div>
          ))}
          {relatedActivity.length === 0 && (
            <p className="p-5 text-center text-sm text-slate-500">
              No activity recorded for this asset yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function AssetGrowthChart({ declining }: { declining: boolean }) {
  const color = declining ? '#e11d48' : '#059669';
  const path = declining
    ? 'M0 34 C38 37 62 42 94 45 S152 51 185 57 S245 60 278 70 S335 77 370 81 S430 92 460 97'
    : 'M0 102 C40 97 65 100 98 91 S156 86 190 80 S246 76 278 62 S335 57 370 49 S428 35 460 27';
  return (
    <div className="mt-3 h-28 rounded-xl bg-slate-50 p-3">
      <svg
        viewBox="0 0 460 100"
        className="h-full w-full"
        role="img"
        aria-label={
          declining
            ? 'Declining asset value chart'
            : 'Growing asset value chart'
        }
      >
        {[20, 50, 80].map((y) => (
          <line
            key={y}
            x1="0"
            x2="460"
            y1={y}
            y2={y}
            stroke="#e2e8f0"
            strokeDasharray="3 5"
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="3"
        />
        <circle
          cx="460"
          cy={declining ? 97 : 27}
          r="4"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
