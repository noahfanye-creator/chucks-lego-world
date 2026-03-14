import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Category from './pages/Category';
import Post from './pages/Post';
import Archive from './pages/Archive';
import About from './pages/About';
import ReportsList from './pages/ReportsList';
import ReportReviewDetail from './pages/ReportReviewDetail';
import ReportReviewNotebook from './pages/ReportReviewNotebook';
import ReportReviewAiSummary from './pages/ReportReviewAiSummary';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/premarket" element={<Category type="premarket" />} />
            <Route path="/intraday" element={<Category type="intraday" />} />
            <Route path="/postmarket" element={<Category type="postmarket" />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/about" element={<About />} />
            <Route path="/post/:slug" element={<Post />} />
            <Route path="/reports" element={<ReportsList />} />
            <Route path="/reports/review/:code" element={<ReportReviewDetail />} />
            <Route path="/reports/review/:code/notebook" element={<ReportReviewNotebook />} />
            <Route path="/reports/review/:code/ai-summary" element={<ReportReviewAiSummary />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
