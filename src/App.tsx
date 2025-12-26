
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/StudentsPage';
import { LocationsPage } from './pages/LocationsPage';
import { DegreesPage } from './pages/DegreesPage';
import { CertificationsPage } from './pages/CertificationsPage';
import { CoursesPage } from './pages/CoursesPage';

function App() {
  return (
    <BrowserRouter basename="/bignap">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="degrees" element={<DegreesPage />} />
          <Route path="certifications" element={<CertificationsPage />} />
          <Route path="courses" element={<CoursesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
