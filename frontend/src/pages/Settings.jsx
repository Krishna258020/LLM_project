import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Moon, Sun, Save, Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appearance');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    debateAlerts: true,
    weeklyReport: false,
  });

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'system', label: 'System', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className={`p-8 ${isDark ? 'bg-gray-900' : ''}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 mb-6 border-b overflow-x-auto ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Appearance Settings</h2>
                <p className={isDark ? 'text-gray-400 mb-6' : 'text-gray-600 mb-6'}>Customize how DebateOS looks for you</p>
              </div>

              {/* Theme Toggle */}
              <div className={`border rounded-lg p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-gray-800' : 'bg-indigo-100'
                    }`}>
                      {isDark ? (
                        <Moon className="w-6 h-6 text-white" />
                      ) : (
                        <Sun className="w-6 h-6 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isDark ? 'Dark Mode' : 'Light Mode'}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isDark 
                          ? 'Switch to light mode for better visibility in bright environments'
                          : 'Switch to dark mode for reduced eye strain in low light'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      isDark ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        isDark ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Color Scheme Preview */}
              <div className={`border rounded-lg p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Color Scheme Preview</h3>
                <div className="grid grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-indigo-600 rounded-lg"></div>
                    <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-purple-600 rounded-lg"></div>
                    <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Accent</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-green-500 rounded-lg"></div>
                    <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Success</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-yellow-500 rounded-lg"></div>
                    <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Warning</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-red-500 rounded-lg"></div>
                    <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Error</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Settings</h2>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage your personal information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className={`w-full px-4 py-3 border rounded-lg ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-600'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={`w-full px-4 py-3 border rounded-lg ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-600'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || 'user'}
                    disabled
                    className={`w-full px-4 py-3 border rounded-lg capitalize ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-600'}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>System Configuration</h2>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Configure system settings and connections</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ollama URL
                  </label>
                  <input
                    type="text"
                    defaultValue="http://localhost:11434"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Database Host
                  </label>
                  <input
                    type="text"
                    defaultValue="localhost"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Database Port
                    </label>
                    <input
                      type="text"
                      defaultValue="3306"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Database Name
                    </label>
                    <input
                      type="text"
                      defaultValue="debate_database"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Notification Preferences</h2>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Choose what updates you want to receive</p>
              </div>

              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Notifications</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Receive email updates about your debates</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        settings.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-4 border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Debate Completion Alerts</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Get notified when debates finish</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, debateAlerts: !settings.debateAlerts })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      settings.debateAlerts ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        settings.debateAlerts ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-4 border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Weekly Report</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Receive weekly summary of your activity</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, weeklyReport: !settings.weeklyReport })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      settings.weeklyReport ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        settings.weeklyReport ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Security Settings</h2>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage your account security</p>
              </div>

              <div className="space-y-4">
                <div className={`p-4 border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Password</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Update your password regularly for better security</p>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium">
                    Change Password
                  </button>
                </div>

                <div className={`p-4 border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Two-Factor Authentication</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Add an extra layer of security to your account</p>
                  <button className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                    Enable 2FA (Coming Soon)
                  </button>
                </div>

                <div className={`p-4 border rounded-lg ${isDark ? 'border-red-900 bg-red-950' : 'border-red-200 bg-red-50'}`}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-900'}`}>Delete Account</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>Permanently delete your account and all data</p>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-lg"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
