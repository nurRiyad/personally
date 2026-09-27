import { AssetsProvider } from './assets-provider';
import { AssetsWorkspace } from './assets-ui';

export default function Assets() {
  return (
    <AssetsProvider>
      <AssetsWorkspace />
    </AssetsProvider>
  );
}
