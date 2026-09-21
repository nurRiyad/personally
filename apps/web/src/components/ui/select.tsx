'use client';

import { Select as BaseSelect } from '@base-ui/react/select';

type SelectProps = {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
};

function CaretIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-4"
    >
      <path d="M11 6.5H5L8 10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-4"
    >
      <path d="m3 8 3 3 7-7" />
    </svg>
  );
}

export function Select({ label, value, options, onValueChange }: SelectProps) {
  const items = options.map((option) => ({ label: option, value: option }));
  return (
    <BaseSelect.Root
      items={items}
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) onValueChange(nextValue);
      }}
    >
      <BaseSelect.Label className="sr-only">{label}</BaseSelect.Label>
      <BaseSelect.Trigger className="inline-flex min-h-11 min-w-28 items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-[border-color,box-shadow] hover:border-slate-300 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-200 data-[popup-open]:border-slate-400 data-[popup-open]:ring-2 data-[popup-open]:ring-slate-100">
        <BaseSelect.Value />
        <BaseSelect.Icon className="text-slate-400">
          <CaretIcon />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} className="z-50 outline-none">
          <BaseSelect.Popup className="min-w-[var(--anchor-width)] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10 outline-none data-[side=bottom]:animate-in data-[side=top]:animate-in">
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option}
                  value={option}
                  className="relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm text-slate-600 outline-none data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950 data-[selected]:font-semibold"
                >
                  <BaseSelect.ItemIndicator className="absolute left-2 flex items-center text-slate-950">
                    <CheckIcon />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText>{option}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
