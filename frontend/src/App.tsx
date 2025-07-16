import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="vote" element={<div>Voting page coming soon!</div>} />
          <Route path="about" element={<div>About page coming soon!</div>} />
          <Route path="game/:gameId" element={<GamePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;