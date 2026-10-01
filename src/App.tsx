import React, { Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Layout } from './components/ui/Layout';
import { LandingPage } from './pages/LandingPage';
import { useEffectiveReducedMotion } from './hooks/useReducedMotion';
import { Button } from './components/ui/Button';

// ── Lazy-loaded Secondary Routes ──────────────────────────────────────────────
const CampusPage = React.lazy(() =>
  import('./pages/CampusPage').then((m) => ({ default: m.CampusPage }))
);
const RoomPage = React.lazy(() =>
  import('./pages/RoomPage').then((m) => ({ default: m.RoomPage }))
);
const ChallengePage = React.lazy(() =>
  import('./pages/ChallengePage').then((m) => ({ default: m.ChallengePage }))
);
const ResultsPage = React.lazy(() =>
  import('./pages/ResultsPage').then((m) => ({ default: m.ResultsPage }))
);
const DashboardPage = React.lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const PortfolioPage = React.lazy(() =>
  import('./pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage }))
);
const SettingsPage = React.lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

// ── Accessible Route Loading Fallback ─────────────────────────────────────────
const PageLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    style={{
      flex: 1,
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-4)',
      color: 'var(--color-text-muted)',
    }}
  >
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
      Loading page...
    </span>
  </div>
);

// ── Route Chunk Error Boundary ────────────────────────────────────────────────
interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  RouteErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            flex: 1,
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            textAlign: 'center',
            padding: 'var(--space-6)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-danger)' }}>
            Unable to Load Page
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '440px' }}>
            A required application module could not be downloaded. Please check your network connection and reload.
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Page Wrapper (Framer Motion / Reduced Motion) ─────────────────────────────
const Page: React.FC<{ children: React.ReactNode; isImmediate?: boolean }> = ({
  children,
  isImmediate = false,
}) => {
  const reducedMotion = useEffectiveReducedMotion();

  const content = isImmediate ? (
    children
  ) : (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );

  if (reducedMotion) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {content}
    </motion.div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Page isImmediate><LandingPage /></Page>,
      },
      {
        path: 'campus',
        element: <Page><CampusPage /></Page>,
      },
      {
        path: 'room/:roomId',
        element: <Page><RoomPage /></Page>,
      },
      {
        path: 'challenge/:id',
        element: <Page><ChallengePage /></Page>,
      },
      {
        path: 'results/:attemptId',
        element: <Page><ResultsPage /></Page>,
      },
      {
        path: 'dashboard',
        element: <Page><DashboardPage /></Page>,
      },
      {
        path: 'portfolio',
        element: <Page><PortfolioPage /></Page>,
      },
      {
        path: 'settings',
        element: <Page><SettingsPage /></Page>,
      },
      {
        path: '*',
        element: <Page><NotFoundPage /></Page>,
      },
    ],
  },
]);

const App: React.FC = () => (
  <AnimatePresence mode="wait">
    <RouterProvider router={router} />
  </AnimatePresence>
);

export default App;
