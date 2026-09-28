import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Layout } from './components/ui/Layout';
import { LandingPage }   from './pages/LandingPage';
import { CampusPage }    from './pages/CampusPage';
import { RoomPage }      from './pages/RoomPage';
import { ChallengePage } from './pages/ChallengePage';
import { ResultsPage }   from './pages/ResultsPage';
import { DashboardPage } from './pages/DashboardPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { SettingsPage }  from './pages/SettingsPage';
import { NotFoundPage }  from './pages/NotFoundPage';

// Framer Motion page transition wrapper
const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
  >
    {children}
  </motion.div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Page><LandingPage /></Page>,
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
