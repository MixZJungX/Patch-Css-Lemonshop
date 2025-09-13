import { createRoot } from 'react-dom/client';
import { Suspense } from 'react';
import App from './App.tsx';
import { LoadingFallback } from '@/components/LoadingFallback';
import './index.css';
import { forceVercelRebuild } from './force-vercel-rebuild';
import './lib/consoleHelpers';

// Force Vercel rebuild
forceVercelRebuild();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <Suspense fallback={<LoadingFallback />}>
    <App />
  </Suspense>
);
