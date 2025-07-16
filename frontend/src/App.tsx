import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { VotePage } from './pages/VotePage';
import { AboutPage } from './pages/AboutPage';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="vote" element={<VotePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="game/:gameId" element={<GamePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;