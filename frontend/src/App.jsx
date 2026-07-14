import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CommunityReports } from './pages/CommunityReports';
import { CostsPage } from './pages/CostsPage';
import { Dashboard } from './pages/Dashboard';
import { DayTimeline } from './pages/DayTimeline';
import { DestinationPage } from './pages/DestinationPage';
import { PlacesMap } from './pages/PlacesMap';
import { ProfileSettings } from './pages/ProfileSettings';
import { TripPlanner } from './pages/TripPlanner';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="destination" element={<DestinationPage />} />
        <Route path="planner" element={<TripPlanner />} />
        <Route path="timeline" element={<DayTimeline />} />
        <Route path="places" element={<PlacesMap />} />
        <Route path="costs" element={<CostsPage />} />
        <Route path="community" element={<CommunityReports />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
