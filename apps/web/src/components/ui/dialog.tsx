'use client';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { useRef, type ReactNode } from 'react';
export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const content = useRef<HTMLDivElement>(null);
  const close = () => {
    if (!content.current?.querySelector('form[aria-busy="true"]')) onClose();
  };
  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-[2px]" />
        <BaseDialog.Popup
          ref={content}
          className="fixed left-1/2 top-1/2 z-[101] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl outline-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <BaseDialog.Title className="text-lg font-semibold text-slate-950">
                {title}
              </BaseDialog.Title>
              {description && (
                <BaseDialog.Description className="mt-1 text-sm text-slate-500">
                  {description}
                </BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close
              aria-label="Close dialog"
              className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 focus-visible:ring-2"
            >
              ×
            </BaseDialog.Close>
          </div>
          <div className="mt-5">{children}</div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
