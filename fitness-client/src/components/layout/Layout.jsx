import React from 'react';
import { Outlet } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout-container">
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;