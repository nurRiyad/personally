'use client';

export function BackButton() {
  return (
    <button type="button" onClick={() => window.history.back()}>
      Back
    </button>
  );
}
