import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Category from './pages/Category';
import Post from './pages/Post';
import Archive from './pages/Archive';
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
            <Route path="/post/:slug" element={<Post />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
