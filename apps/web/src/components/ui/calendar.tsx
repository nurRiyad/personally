'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover } from '@base-ui/react/popover';
import { Button } from './button';

type CalendarProps = {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

export function Calendar({
  value,
  onChange,
  disabled,
  ...props
}: CalendarProps) {
  const selected = value ? parseISO(value) : undefined;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(selected ?? new Date());
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button
            variant="secondary"
            type="button"
            disabled={disabled}
            {...props}
          />
        }
        className="w-full justify-start rounded-lg px-3 text-left font-normal"
      >
        <CalendarDays className="size-4 text-slate-500" aria-hidden="true" />
        <span className={value ? 'text-slate-950' : 'text-slate-500'}>
          {value ? format(selected!, 'MMM d, yyyy') : 'Pick a date'}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} className="z-[110]">
          <Popover.Popup className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl outline-none">
            <DayPicker
              mode="single"
              month={month}
              selected={selected}
              onMonthChange={setMonth}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, 'yyyy-MM-dd'));
                  setOpen(false);
                }
              }}
              showOutsideDays
              classNames={{
                months: 'flex flex-col',
                month: 'space-y-3',
                month_caption: 'flex items-center justify-center h-8',
                caption_label: 'text-sm font-semibold',
                nav: 'absolute inset-x-2 top-3 flex items-center justify-between',
                button_previous: 'size-8 rounded-lg p-0 hover:bg-slate-100',
                button_next: 'size-8 rounded-lg p-0 hover:bg-slate-100',
                chevron: 'size-4',
                weekdays: 'grid grid-cols-7',
                weekday: 'text-center text-xs font-medium text-slate-400',
                week: 'mt-1 grid grid-cols-7',
                day: 'flex size-9 items-center justify-center rounded-lg text-sm text-slate-700 hover:bg-slate-100',
                today: 'font-bold text-slate-950',
                selected: 'bg-slate-950 text-white hover:bg-slate-800',
                outside: 'text-slate-300',
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === 'left' ? (
                    <ChevronLeft className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  ),
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
