import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Pedestal from './routes/pedestal';
import Display from './routes/display';
import './index.scss';

function App() {
  return (
    <div className='app'>
      <Routes>
        <Route path="/" element={
          <div className="menu">
            <a href="#/pedestal">Pedestal</a>
            <a href="#/display">Display</a>
          </div>
        } />
        <Route path="/pedestal" element={<Pedestal />} />
        <Route path="/display" element={<Display />} />
      </Routes>
    </div>
  );
}

export default App;