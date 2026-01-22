import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';
import { useMultiTabDetection } from './utils/tabDetection';
import { MultiTabWarningDialog } from './components/MultiTabWarningDialog';



function App() {
  const hasMultipleTabs = useMultiTabDetection();

  return (
    <>
      <MultiTabWarningDialog open={hasMultipleTabs} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/activity/:activityId" element={<ActivityDetailPage />} />
      </Routes>
    </>
  );
}

export default App;
