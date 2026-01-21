import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';



function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/activity/:activityId" element={<ActivityDetailPage />} />
    </Routes>
  );
}

export default App;
