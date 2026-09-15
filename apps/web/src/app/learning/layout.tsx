import type { ReactNode } from 'react';
import { LearningProvider } from './learning-provider';
export default function LearningLayout({ children }: { children: ReactNode }) {
  return <LearningProvider>{children}</LearningProvider>;
}
