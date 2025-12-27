
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/StudentsPage';
import { LocationsPage } from './pages/LocationsPage';
import { DegreesPage } from './pages/DegreesPage';
import { CertificationsPage } from './pages/CertificationsPage';
import { CoursesPage } from './pages/CoursesPage';
import { ProfilePage } from './pages/ProfilePage';


import { FeedbackProvider } from './contexts/FeedbackContext';

import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter basename="/bignap">
      <AuthProvider>
        <FeedbackProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="degrees" element={<DegreesPage />} />
              <Route path="certifications" element={<CertificationsPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
