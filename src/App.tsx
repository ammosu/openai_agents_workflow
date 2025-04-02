import React from 'react';
import TopNav from './components/TopNav';
import LeftPanel from './components/LeftPanel';
import CanvasArea from './components/CanvasArea';
import RightPanel from './components/RightPanel';
import './App.css'; // Will update this file for layout styles

function App() {
  return (
    <div className="app-container">
      <TopNav />
      <div className="main-content">
        <LeftPanel />
        <CanvasArea />
        <RightPanel /> {/* Optional: Can be conditionally rendered */}
      </div>
    </div>
  );
}

export default App;
