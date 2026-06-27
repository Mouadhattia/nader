import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GuestPage } from './pages/GuestPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/guest" replace />} />
        <Route path="/guest" element={<GuestPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/guest" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
