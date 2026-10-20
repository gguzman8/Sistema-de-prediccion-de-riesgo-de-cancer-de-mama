import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Mammograms from './pages/Mammograms';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Review from './pages/Review';
import Result from './pages/Result';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mamografias" element={<Mammograms />} />
        <Route path="/pacientes" element={<Patients />} />
        <Route path="/pacientes/:id" element={<PatientDetail />} />
        <Route path="/revision/:patientId?" element={<Review />} />
        <Route path="/resultado" element={<Result />} />
        <Route path="/configuracion" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}