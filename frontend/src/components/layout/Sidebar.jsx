import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Sparkles, BookOpen, BarChart3, Settings, Activity, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState(null);
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/debate', icon: Sparkles, label: 'New Debate' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/history', icon: BookOpen, label: 'History' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/health`);
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Failed to load system health:', error);
      setSystemHealth(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ollamaStatus = systemHealth?.ollama_status === 'running';
  const dbStatus = systemHealth?.database_status === 'connected';
  const modelsCount = systemHealth?.models_available 
    ? Object.values(systemHealth.models_available).filter(Boolean).length 
    : 0;

  return (
    <div className={`w-64 h-screen ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r flex flex-col`}>
      {/* Logo */}
      <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>DebateOS</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Multi-Agent System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* System Status */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs font-semibold uppercase mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          System Status
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${ollamaStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Ollama</span>
            </div>
            <span className={`text-xs font-medium ${ollamaStatus ? 'text-green-600' : 'text-red-600'}`}>
              {ollamaStatus ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dbStatus ? 'bg-blue-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Database</span>
            </div>
            <span className={`text-xs font-medium ${dbStatus ? 'text-blue-600' : 'text-red-600'}`}>
              {dbStatus ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${modelsCount === 3 ? 'bg-purple-500' : 'bg-yellow-500'}`}></div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Models</span>
            </div>
            <span className={`text-xs font-medium ${modelsCount === 3 ? 'text-purple-600' : 'text-yellow-600'}`}>
              {modelsCount}/3
            </span>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-indigo-600">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.username || 'User'}
            </p>
            <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
