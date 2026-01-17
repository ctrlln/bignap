
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/StudentsPage';
import { LocationsPage } from './pages/LocationsPage';
import { DegreesPage } from './pages/DegreesPage';
import { CertificationsPage } from './pages/CertificationsPage';
import { CoursesPage } from './pages/CoursesPage';
import { ProfilePage } from './pages/ProfilePage';

import { LoginPage } from './pages/LoginPage';


import { FeedbackProvider } from './contexts/FeedbackContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function RequireAuth({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !user.roles?.some(r => allowedRoles.includes(r))) {
    return <Navigate to="/" replace />; // Or forbidden page
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename="/bignap">
      <AuthProvider>
        <FeedbackProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }>
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
