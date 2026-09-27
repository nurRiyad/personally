'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Leaf,
  Landmark,
  Plus,
  WalletCards,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog';
import { Select } from '../../components/ui/select';
import { ApiError } from '../../lib/api/client';
import {
  archiveAsset,
  assetsKey,
  createAsset,
  createAssetActivity,
  createAssetType,
  deleteAssetActivity,
  deleteAssetType,
  getAsset,
  getAssetActivities,
  getAssetDashboard,
  getAssets,
  getAssetTypes,
  patchAsset,
  patchAssetActivity,
  patchAssetType,
  type AssetActivity,
  type AssetCreateInput,
  type AssetDashboard,
  type AssetPatchInput,
  type AssetRecord,
  type AssetType,
  type AssetActivityInput,
} from '../../lib/api/assets';
import { AddAssetForm } from './add-asset-form';
import { AddAssetTypeForm } from './add-asset-type-form';
import { EditAssetForm } from './edit-asset-form';
import { EditActivityForm } from './edit-activity-form';
import { RecordActivityForm } from './record-activity-form';

type Tab = 'Overview' | 'Assets' | 'Activity';
const money = (value: number) => `৳${new Intl.NumberFormat('en-BD').format(value)}`;
const assetMixColors = ['#10b981', '#8b5cf6', '#38bdf8', '#f59e0b', '#f43f5e', '#6366f1', '#14b8a6', '#f97316'];
const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
const fromFor = (year: string) => (year === 'All time' ? '1970-01-01' : `${year}-01-01`);
const errorText = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Unable to save. Please try again.';

export function AssetsWorkspace() {
  const queryClient = useQueryClient();
  const currentYear = String(new Date().getFullYear());
  const [tab, setTab] = useState<Tab>('Overview');
  const [year, setYear] = useState(currentYear);
  const [dialog, setDialog] = useState<'activity' | 'asset' | 'type' | null>(null);
  const [editingType, setEditingType] = useState<AssetType | null>(null);
  const [deletingType, setDeletingType] = useState<AssetType | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);
  const [archivingAsset, setArchivingAsset] = useState<AssetRecord | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<AssetActivity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<AssetActivity | null>(null);
  const range = {
    from: fromFor(year),
    to: new Date().toISOString().slice(0, 10),
  };
  const typesQuery = useQuery({
    queryKey: [...assetsKey, 'types'],
    queryFn: getAssetTypes,
  });
  const assetsQuery = useQuery({
    queryKey: [...assetsKey, 'list', range],
    queryFn: () => getAssets({ ...range, includeArchived: true }),
  });
  const dashboardQuery = useQuery({
    queryKey: [...assetsKey, 'dashboard', range],
    queryFn: () => getAssetDashboard(range),
  });
  const activitiesQuery = useQuery({
    queryKey: [...assetsKey, 'activities', range],
    queryFn: () => getAssetActivities({ ...range, pageSize: 100 }),
  });
  const detailQuery = useQuery({
    queryKey: [...assetsKey, 'detail', selectedAssetId, range],
    queryFn: () => getAsset(selectedAssetId!, range),
    enabled: Boolean(selectedAssetId),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: assetsKey });
  const createTypeMutation = useMutation({
    mutationFn: createAssetType,
    onSuccess: invalidate,
  });
  const patchTypeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name: string } }) => patchAssetType(id, input),
    onSuccess: invalidate,
  });
  const deleteTypeMutation = useMutation({
    mutationFn: deleteAssetType,
    onSuccess: invalidate,
  });
  const createAssetMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: invalidate,
  });
  const patchAssetMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssetPatchInput }) => patchAsset(id, input),
    onSuccess: invalidate,
  });
  const archiveMutation = useMutation({
    mutationFn: archiveAsset,
    onSuccess: invalidate,
  });
  const createActivityMutation = useMutation({
    mutationFn: createAssetActivity,
    onSuccess: invalidate,
  });
  const patchActivityMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssetActivityInput }) => patchAssetActivity(id, input),
    onSuccess: invalidate,
  });
  const deleteActivityMutation = useMutation({
    mutationFn: deleteAssetActivity,
    onSuccess: invalidate,
  });
  const types = typesQuery.data ?? [];
  const allAssets = assetsQuery.data ?? [];
  const activeAssets = allAssets.filter((asset) => !asset.archivedAt);
  const archivedAssets = allAssets.filter((asset) => asset.archivedAt);
  const dashboard = dashboardQuery.data;
  const activities = activitiesQuery.data ?? [];
  const anyError = [
    createTypeMutation.error,
    patchTypeMutation.error,
    deleteTypeMutation.error,
    createAssetMutation.error,
    patchAssetMutation.error,
    archiveMutation.error,
    createActivityMutation.error,
    patchActivityMutation.error,
    deleteActivityMutation.error,
  ].find(Boolean);
  const loading =
    typesQuery.isLoading || assetsQuery.isLoading || dashboardQuery.isLoading || activitiesQuery.isLoading;
  const retry = () => {
    void typesQuery.refetch();
    void assetsQuery.refetch();
    void dashboardQuery.refetch();
    void activitiesQuery.refetch();
  };
  const titleAsset = useMemo(
    () => allAssets.find((asset) => asset.id === selectedAssetId),
    [allAssets, selectedAssetId],
  );

  const saveType = (name: string) => {
    const action = editingType
      ? patchTypeMutation.mutateAsync({ id: editingType.id, input: { name } })
      : createTypeMutation.mutateAsync({ name });
    void action
      .then(() => {
        setEditingType(null);
        setDialog(null);
      })
      .catch(() => undefined);
  };
  const saveAsset = (input: AssetCreateInput) =>
    void createAssetMutation
      .mutateAsync(input)
      .then(() => {
        setDialog(null);
        setTab('Assets');
      })
      .catch(() => undefined);
  const saveEditedAsset = (input: AssetPatchInput) =>
    editingAsset &&
    void patchAssetMutation
      .mutateAsync({ id: editingAsset.id, input })
      .then(() => setEditingAsset(null))
      .catch(() => undefined);
  const saveActivity = (input: AssetActivityInput) =>
    void createActivityMutation
      .mutateAsync(input)
      .then(() => {
        setDialog(null);
        setTab('Activity');
      })
      .catch(() => undefined);
  const saveEditedActivity = (input: AssetActivityInput) =>
    editingActivity &&
    void patchActivityMutation
      .mutateAsync({ id: editingActivity.id, input })
      .then(() => setEditingActivity(null))
      .catch(() => undefined);
  const confirmArchive = () =>
    archivingAsset &&
    void archiveMutation
      .mutateAsync(archivingAsset.id)
      .then(() => {
        setArchivingAsset(null);
        if (selectedAssetId === archivingAsset.id) setSelectedAssetId(null);
      })
      .catch(() => undefined);
  const confirmDeleteType = () =>
    deletingType &&
    void deleteTypeMutation
      .mutateAsync(deletingType.id)
      .then(() => setDeletingType(null))
      .catch(() => undefined);
  const confirmDeleteActivity = () =>
    deletingActivity &&
    void deleteActivityMutation
      .mutateAsync(deletingActivity.id)
      .then(() => setDeletingActivity(null))
      .catch(() => undefined);

  if (loading)
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8">
        <p className="text-sm text-slate-500">Loading your assets…</p>
      </main>
    );
  if (typesQuery.error || assetsQuery.error || dashboardQuery.error || activitiesQuery.error)
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8">
        <Card className="p-6">
          <h1 className="text-lg font-semibold">Could not load assets</h1>
          <p className="mt-2 text-sm text-slate-600">
            {errorText(typesQuery.error ?? assetsQuery.error ?? dashboardQuery.error ?? activitiesQuery.error)}
          </p>
          <Button className="mt-4" onClick={retry}>
            Try again
          </Button>
        </Card>
      </main>
    );

  return (
    <main className="page-transition mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Asset management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            A clearer picture of what you own.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track your savings, investments, and money movement in one trusted place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            label="Period"
            value={year}
            options={['All time', currentYear, String(Number(currentYear) - 1), String(Number(currentYear) - 2)]}
            onValueChange={setYear}
          />
          <Button onClick={() => setDialog('activity')}>
            <Plus className="size-4" /> Record activity
          </Button>
        </div>
      </header>
      <nav aria-label="Asset sections" className="mt-6 flex w-fit rounded-xl bg-slate-100 p-1">
        {(['Overview', 'Assets', 'Activity'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {item}
          </button>
        ))}
      </nav>
      {anyError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {errorText(anyError)}
        </p>
      )}
      {tab !== 'Activity' && dashboard && (
        <section aria-label="Asset summary" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total assets"
            value={money(dashboard.summary.totalAssets)}
            detail={`Across ${dashboard.summary.assetCount} tracked assets`}
            tone="bg-slate-950! text-white"
            icon={<WalletCards className="size-5" />}
          />
          <SummaryCard
            label={`${year === 'All time' ? 'Total' : year} growth`}
            value={`${dashboard.summary.periodChange >= 0 ? '+' : ''}${money(dashboard.summary.periodChange)}`}
            detail="Change during selected period"
            tone="bg-emerald-50 text-emerald-800"
            icon={<ArrowUpRight className="size-5" />}
          />
          <SummaryCard
            label="Liquid money"
            value={money(dashboard.summary.liquidMoney)}
            detail="Available when you need it"
            tone="bg-sky-50 text-sky-800"
            icon={<Banknote className="size-5" />}
          />
          <SummaryCard
            label="Money lent"
            value={money(dashboard.summary.moneyLent)}
            detail="Outstanding receivables"
            tone="bg-rose-50 text-rose-800"
            icon={<CircleDollarSign className="size-5" />}
          />
        </section>
      )}
      {tab === 'Overview' && dashboard && (
        <Overview dashboard={dashboard} activities={activities.slice(0, 4)} onViewActivity={() => setTab('Activity')} />
      )}
      {tab === 'Assets' && (
        <section className="mt-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Your assets</h2>
                <p className="mt-1 text-sm text-slate-500">Review holdings grouped by asset type.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-9 px-3"
                  onClick={() => {
                    setEditingType(null);
                    setDialog('type');
                  }}
                >
                  Create type
                </Button>
                <Button type="button" variant="secondary" className="min-h-9 px-3" onClick={() => setDialog('asset')}>
                  <Plus className="size-4" /> Add asset
                </Button>
              </div>
            </div>
            {types.length === 0 && (
              <p className="border-t border-slate-100 p-8 text-center text-sm text-slate-500">
                Create an asset type to start tracking a holding.
              </p>
            )}
            {types.map((type) => {
              const group = activeAssets.filter((asset) => asset.typeId === type.id);
              return (
                <section key={type.id} className="border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2 bg-slate-50/70 px-5 py-3 sm:px-6">
                    <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">
                      {type.name}{' '}
                      <span className="font-normal text-slate-500">
                        · {group.length} {group.length === 1 ? 'asset' : 'assets'} ·{' '}
                        {money(group.reduce((sum, asset) => sum + asset.currentValue, 0))}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      className="min-h-9 px-2"
                      aria-label={`Rename ${type.name}`}
                      onClick={() => {
                        setEditingType(type);
                        setDialog('type');
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-9 px-2 text-rose-700"
                      aria-label={`Delete ${type.name}`}
                      onClick={() => setDeletingType(type)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  {group.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">No active assets in this type yet.</p>
                  ) : (
                    group.map((asset) => (
                      <AssetRow
                        key={asset.id}
                        asset={asset}
                        onOpen={() => setSelectedAssetId(asset.id)}
                        onEdit={() => setEditingAsset(asset)}
                        onArchive={() => setArchivingAsset(asset)}
                      />
                    ))
                  )}
                </section>
              );
            })}
            {archivedAssets.length > 0 && (
              <section className="border-t border-slate-200 bg-slate-50">
                <div className="px-5 py-4 sm:px-6">
                  <h3 className="text-sm font-semibold text-slate-700">Archived assets</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    History is retained; archived balances are excluded from current totals.
                  </p>
                </div>
                {archivedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-4 border-t border-slate-100 px-5 py-4 opacity-70 sm:px-6"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                      <AssetIcon type={asset.typeName} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{asset.name}</span>
                      <span className="block text-xs text-slate-500">{asset.typeName} · archived</span>
                    </span>
                    <span className="text-sm font-semibold">{money(asset.currentValue)}</span>
                  </div>
                ))}
              </section>
            )}
          </Card>
        </section>
      )}
      {tab === 'Activity' && (
        <ActivityList activities={activities} onEdit={setEditingActivity} onDelete={setDeletingActivity} />
      )}

      <Dialog
        open={dialog === 'type'}
        onClose={() => {
          setDialog(null);
          setEditingType(null);
        }}
        title={editingType ? 'Edit asset type' : 'Create asset type'}
        description={editingType ? 'Rename this type without changing its assets.' : undefined}
      >
        <MutationError error={editingType ? patchTypeMutation.error : createTypeMutation.error} />
        <AddAssetTypeForm
          initialName={editingType?.name ?? ''}
          submitLabel={editingType ? 'Save changes' : 'Create type'}
          onCancel={() => {
            setDialog(null);
            setEditingType(null);
          }}
          onAdd={saveType}
        />
      </Dialog>
      <Dialog
        open={dialog === 'asset'}
        onClose={() => setDialog(null)}
        title="Add holding"
        description="Choose a type, then enter holding details."
      >
        <MutationError error={createAssetMutation.error} />
        <AddAssetForm assetTypes={types} onCancel={() => setDialog(null)} onAdd={saveAsset} />
      </Dialog>
      <Dialog
        open={dialog === 'activity'}
        onClose={() => setDialog(null)}
        title="Record asset activity"
        description="Activity changes are applied to balances automatically."
      >
        <MutationError error={createActivityMutation.error} />
        <RecordActivityForm assets={activeAssets} onCancel={() => setDialog(null)} onRecord={saveActivity} />
      </Dialog>
      <Dialog
        open={editingAsset !== null}
        onClose={() => setEditingAsset(null)}
        title="Edit asset"
        description="Update details and classification. Balances change through activity."
      >
        <MutationError error={patchAssetMutation.error} />
        {editingAsset && (
          <EditAssetForm
            asset={editingAsset}
            assetTypes={types}
            onCancel={() => setEditingAsset(null)}
            onSave={saveEditedAsset}
          />
        )}
      </Dialog>
      <Dialog
        open={editingActivity !== null}
        onClose={() => setEditingActivity(null)}
        title="Edit activity"
        description="Correcting this entry recalculates the affected balances."
      >
        <MutationError error={patchActivityMutation.error} />
        {editingActivity && (
          <EditActivityForm
            activity={editingActivity}
            assets={activeAssets}
            onCancel={() => setEditingActivity(null)}
            onSave={saveEditedActivity}
          />
        )}
      </Dialog>
      <Dialog
        open={selectedAssetId !== null}
        onClose={() => setSelectedAssetId(null)}
        title={titleAsset?.name ?? 'Asset details'}
        description={titleAsset ? `${titleAsset.typeName} · ${titleAsset.detail}` : undefined}
      >
        {detailQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading holding history…</p>
        ) : (
          detailQuery.data && <AssetDetailView asset={detailQuery.data} />
        )}
      </Dialog>
      <Dialog
        open={deletingType !== null}
        onClose={() => setDeletingType(null)}
        title="Delete asset type"
        description="Only types without assets can be deleted."
      >
        <Confirm
          text={`Delete ${deletingType?.name}?`}
          error={deleteTypeMutation.error}
          onCancel={() => setDeletingType(null)}
          onConfirm={confirmDeleteType}
        />
      </Dialog>
      <Dialog
        open={archivingAsset !== null}
        onClose={() => setArchivingAsset(null)}
        title="Archive asset"
        description="Its history will stay available, and the balance will leave current totals."
      >
        <Confirm
          text={`Archive ${archivingAsset?.name}?`}
          error={archiveMutation.error}
          onCancel={() => setArchivingAsset(null)}
          onConfirm={confirmArchive}
        />
      </Dialog>
      <Dialog
        open={deletingActivity !== null}
        onClose={() => setDeletingActivity(null)}
        title="Delete activity"
        description="This recalculates all affected balances."
      >
        <Confirm
          text={`Delete ${deletingActivity?.kind} activity for ${money(deletingActivity?.amount ?? 0)}?`}
          error={deleteActivityMutation.error}
          onCancel={() => setDeletingActivity(null)}
          onConfirm={confirmDeleteActivity}
        />
      </Dialog>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  icon: React.ReactNode;
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
  dashboard,
  activities,
  onViewActivity,
}: {
  dashboard: AssetDashboard;
  activities: AssetActivity[];
  onViewActivity: () => void;
}) {
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Portfolio value</h2>
        <p className="mt-1 text-sm text-slate-500">Monthly closing balances from your activity ledger.</p>
        <SeriesChart points={dashboard.series} />
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Asset mix</h2>
            <p className="mt-1 text-sm text-slate-500">Current value by type.</p>
          </div>
          <AssetMixChart items={dashboard.assetMix} />
        </div>
        <div className="mt-5 space-y-3">
          {dashboard.assetMix.length ? (
            dashboard.assetMix.map((item, index) => (
              <div key={item.typeId} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: assetMixColors[index % assetMixColors.length],
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{item.typeName}</span>
                <span className="text-sm font-semibold">{money(item.value)}</span>
                <span className="w-10 text-right text-xs text-slate-500">{item.percentage}%</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Add an asset to see your mix.</p>
          )}
        </div>
      </Card>
      <section className="grid gap-5 xl:col-span-2 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-950">Top growing assets</h2>
          <p className="mt-1 text-sm text-slate-500">Your strongest assets by growth during the selected period.</p>
          <div className="mt-5 space-y-3">
            {dashboard.topGrowingAssets.length ? (
              dashboard.topGrowingAssets.map((asset) => (
                <div key={asset.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{asset.name}</span>
                    <span className="text-xs text-slate-500">
                      {asset.typeName} · {money(asset.currentValue)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">{asset.growthLabel}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No assets grew during this period.</p>
            )}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className="text-sm font-semibold">Recent movement</h2>
              <p className="mt-1 text-xs text-slate-500">Latest ledger activity.</p>
            </div>
            <button type="button" onClick={onViewActivity} className="text-sm font-semibold text-emerald-700">
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
            {!activities.length && <p className="p-5 text-sm text-slate-500">No activity recorded yet.</p>}
          </div>
        </Card>
      </section>
    </div>
  );
}
function AssetMixChart({ items }: { items: AssetDashboard['assetMix'] }) {
  const positiveItems = items.map((item, index) => ({ ...item, index })).filter((item) => item.value > 0);
  const total = positiveItems.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const slices = positiveItems.map((item) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    return `${assetMixColors[item.index % assetMixColors.length]} ${start}% ${cursor}%`;
  });
  const background = slices.length ? `conic-gradient(${slices.join(', ')})` : '#e2e8f0';

  return (
    <span
      role="img"
      aria-label={total ? `Asset mix chart with ${positiveItems.length} asset types` : 'No asset mix data'}
      className="relative size-12 shrink-0 rounded-full"
      style={{ background }}
    >
      <span aria-hidden="true" className="absolute inset-[9px] rounded-full bg-white" />
    </span>
  );
}
function SeriesChart({ points }: { points: Array<{ date: string; value: number }> }) {
  if (!points.length)
    return (
      <div className="mt-6 flex h-44 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
        Record activity to build your value trend.
      </div>
    );
  const max = Math.max(...points.map((point) => point.value), 1);
  const coords = points
    .map(
      (point, index) =>
        `${points.length === 1 ? 50 : (index / (points.length - 1)) * 100},${100 - (point.value / max) * 90}`,
    )
    .join(' ');
  return (
    <div className="mt-6 h-44 rounded-xl bg-slate-50 p-4">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="Portfolio value history"
      >
        <polyline
          points={coords}
          fill="none"
          stroke="#0f766e"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-slate-500">
        <span>{dateLabel(points[0].date)}</span>
        <span>{money(points[points.length - 1].value)}</span>
        <span>{dateLabel(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
function AssetRow({
  asset,
  onOpen,
  onEdit,
  onArchive,
}: {
  asset: AssetRecord;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 border-b border-slate-100 px-5 py-4 hover:bg-slate-50 sm:px-6">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${asset.isReceivable ? 'bg-rose-100 text-rose-700' : asset.isLiquid ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}
      >
        <AssetIcon type={asset.typeName} receivable={asset.isReceivable} />
      </span>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-slate-900">{asset.name}</span>
        <span className="mt-1 block truncate text-xs text-slate-500">
          {asset.detail ||
            (asset.isReceivable ? 'Money owed to you' : asset.isLiquid ? 'Liquid holding' : 'Tracked holding')}
        </span>
      </button>
      <span className="text-right">
        <span className="block text-[11px] text-slate-400">Current value</span>
        <span className="mt-0.5 block text-sm font-semibold">{money(asset.currentValue)}</span>
      </span>
      <span
        className={`hidden text-right text-sm font-semibold sm:block ${asset.periodChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
      >
        {asset.periodChange >= 0 ? '+' : ''}
        {money(asset.periodChange)}
      </span>
      <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
        <Button variant="ghost" className="min-h-9 px-2" aria-label={`Edit ${asset.name}`} onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          className="min-h-9 px-2 text-rose-700"
          aria-label={`Archive ${asset.name}`}
          onClick={onArchive}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
function AssetIcon({ type, receivable = false }: { type: string; receivable?: boolean }) {
  const className = 'size-5';
  if (receivable) return <CircleDollarSign className={className} />;
  if (/land|property/i.test(type)) return <Leaf className={className} />;
  if (/fixed deposit/i.test(type)) return <Landmark className={className} />;
  if (/dps|deposit/i.test(type)) return <WalletCards className={className} />;
  return <Banknote className={className} />;
}
function ActivityList({
  activities,
  onEdit,
  onDelete,
}: {
  activities: AssetActivity[];
  onEdit: (activity: AssetActivity) => void;
  onDelete: (activity: AssetActivity) => void;
}) {
  const [filter, setFilter] = useState('All activity');
  const shown = activities.filter((activity) => filter === 'All activity' || activity.kind === filter);
  return (
    <section className="mt-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-semibold">Movement history</h2>
            <p className="mt-1 text-sm text-slate-500">Every entry has a source, destination, and date.</p>
          </div>
          <Select
            label="Filter activity"
            value={filter}
            options={[
              'All activity',
              'Opening',
              'Income',
              'Growth',
              'Transfer',
              'Contribution',
              'Lending',
              'Repayment',
              'External use',
            ]}
            onValueChange={setFilter}
          />
        </div>
        <div className="divide-y divide-slate-100">
          {shown.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${['Income', 'Growth', 'Repayment', 'Opening'].includes(activity.kind) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
              >
                {['Income', 'Growth', 'Repayment', 'Opening'].includes(activity.kind) ? (
                  <ArrowDownLeft className="size-5" />
                ) : (
                  <ArrowUpRight className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {activity.kind === 'Opening' ? 'Opening balance' : activity.kind}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {dateLabel(activity.activityDate)} · {activity.sourceName} → {activity.destinationName}
                </p>
                <p className="mt-1 truncate text-xs text-slate-400">{activity.note || 'No note added'}</p>
              </div>
              <span className="text-sm font-semibold">{money(activity.amount)}</span>
              <Button
                variant="ghost"
                className="min-h-9 px-2"
                aria-label={`Edit ${activity.kind}`}
                onClick={() => onEdit(activity)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                className="min-h-9 px-2 text-rose-700"
                aria-label={`Delete ${activity.kind}`}
                onClick={() => onDelete(activity)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {!shown.length && <p className="p-8 text-center text-sm text-slate-500">No matching activity found.</p>}
        </div>
      </Card>
    </section>
  );
}
function ActivityRow({ activity }: { activity: AssetActivity }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <ArrowDownLeft className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {activity.kind === 'Opening' ? 'Opening balance' : activity.kind}
        </span>
        <span className="block truncate text-xs text-slate-500">
          {activity.sourceName} → {activity.destinationName}
        </span>
      </span>
      <span className="text-sm font-semibold">{money(activity.amount)}</span>
    </div>
  );
}
function AssetDetailView({ asset }: { asset: Awaited<ReturnType<typeof getAsset>> }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Current value" value={money(asset.currentValue)} />
        <Metric label="Period change" value={`${asset.periodChange >= 0 ? '+' : ''}${money(asset.periodChange)}`} />
        <Metric label="Recorded activity" value={`${asset.activityCount} entries`} />
      </div>
      <section>
        <h3 className="text-sm font-semibold">Value trend</h3>
        <SeriesChart points={asset.series} />
      </section>
      <section>
        <h3 className="text-sm font-semibold">All activity</h3>
        <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {asset.activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
          {!asset.activities.length && (
            <p className="p-5 text-center text-sm text-slate-500">No activity recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
function Confirm({
  text,
  error,
  onCancel,
  onConfirm,
}: {
  text: string;
  error: unknown;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">{text} This action cannot be undone.</p>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {errorText(error)}
        </p>
      ) : null}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
}

function MutationError({ error }: { error: unknown }) {
  return error ? (
    <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
      {errorText(error)}
    </p>
  ) : null;
}
