import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';

const Layout = () => {
  const { isDark } = useTheme();
  
  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
