import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReportsList from './pages/ReportsList';
import ReportReviewDetail from './pages/ReportReviewDetail';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/review/:code" element={<ReportReviewDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
