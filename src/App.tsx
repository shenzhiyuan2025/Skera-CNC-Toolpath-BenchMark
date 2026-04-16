import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Home } from './pages/Home';
import { Examples } from './pages/Examples';
import { ToolpathBenchmark } from './pages/ToolpathBenchmark';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ToolpathBenchmark />} />
          <Route path="/a2ui" element={<Home />} />
          <Route path="/examples" element={<Examples />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
