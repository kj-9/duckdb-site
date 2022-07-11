import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';

import { NavBar } from './components/navbar';
import { Shell } from './components/shell';

ReactDOM.render(
  <React.StrictMode>
    <NavBar>
      <Shell />
    </NavBar>
  </React.StrictMode>,
  document.getElementById('root'),
);
