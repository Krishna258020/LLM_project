import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, TrendingUp, Clock, Zap, Activity, ArrowRight, Sparkles, Star, Tag, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const DashboardEnhanced = () => {
  const navigate = useNavigate();
  const [debates, setDebates] = useState([]);
  const [trends, setTrends] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [debatesRes, healthRes, trendsRes, favoritesRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/debates`),
        axios.get(`${API}/health`),
        axios.get(`${API}/analytics/trends`),
        axios.get(`${API}/debates/favorites`).catch(() => ({ data: [] })),
        axios.get(`${API}/categories`).catch(() => ({ data: [] }))
      ]);
      
      setDebates(debatesRes.data || []);
      setSystemHealth(healthRes.data);
      setTrends(trendsRes.data || []);
      setFavorites(favoritesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDebates = debates.length;
  const avgSteps = debates.length > 0 
    ? (debates.reduce((sum, d) => sum + d.steps.length, 0) / debates.length).toFixed(1)
    : 0;
  const avgDuration = debates.length > 0 && debates.some(d => d.duration_seconds)
    ? (debates.reduce((sum, d) => sum + (d.duration_seconds || 0), 0) / debates.filter(d => d.duration_seconds).length).toFixed(1)
    : '24';

  // Prepare chart data
  const chartData = trends.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    debates: t.count,
    avgTime: t.avg_duration ? parseFloat(t.avg_duration).toFixed(1) : 0
  }));

  // Category distribution
  const categoryData = categories.slice(0, 5).map(cat => ({
    name: cat || 'Uncategorized',
    count: debates.filter(d => d.category === cat).length
  }));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to DebateOS</h1>
        <p className="text-gray-600 text-lg">Multi-Agent LLM Debate System - Industry Ready</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <Activity className="w-10 h-10 opacity-20" />
          </div>
          <div className="text-4xl font-bold mb-1">{totalDebates}</div>
          <div className="text-indigo-100">Total Debates</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <Sparkles className="w-10 h-10 opacity-20" />
          </div>
          <div className="text-4xl font-bold mb-1">{avgSteps}</div>
          <div className="text-purple-100">Avg Steps</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <Activity className="w-10 h-10 opacity-20" />
          </div>
          <div className="text-4xl font-bold mb-1">{avgDuration}s</div>
          <div className="text-green-100">Avg Time</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
            <Star className="w-10 h-10 opacity-20" />
          </div>
          <div className="text-4xl font-bold mb-1">{favorites.length}</div>
          <div className="text-amber-100">Favorites</div>
        </div>
      </div>

      {/* Performance Trends Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Performance Trends (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="debates" stroke="#4F46E5" strokeWidth={2} name="Debates" />
              <Line yAxisId="right" type="monotone" dataKey="avgTime" stroke="#10B981" strokeWidth={2} name="Avg Time (s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/debate')}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl p-8 text-left transition-all shadow-xl hover:shadow-2xl group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlayCircle className="w-8 h-8" />
            </div>
            <ArrowRight className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Start New Debate</h3>
          <p className="text-indigo-100">Let AI agents collaborate on your question</p>
        </button>

        <button
          onClick={() => navigate('/templates')}
          className="bg-white border-2 border-gray-200 hover:border-indigo-300 rounded-2xl p-8 text-left transition-all shadow-lg hover:shadow-xl group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Browse Templates</h3>
          <p className="text-gray-600">Use pre-built debate templates</p>
        </button>
      </div>

      {/* Category Distribution */}
      {categoryData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            Debates by Category
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* System Status */}
      {systemHealth && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <div className="text-sm text-gray-600 mb-1">Ollama</div>
                <div className="font-bold text-gray-900">{systemHealth?.ollama_status || 'Unknown'}</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <div className="text-sm text-gray-600 mb-1">Database</div>
                <div className="font-bold text-gray-900">{systemHealth?.database_status || 'Unknown'}</div>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div>
                <div className="text-sm text-gray-600 mb-1">Models</div>
                <div className="font-bold text-gray-900">
                  {systemHealth?.models_available && typeof systemHealth.models_available === 'object'
                    ? `${Object.values(systemHealth.models_available).filter(Boolean).length}/3 Active`
                    : '0/3 Active'
                  }
                </div>
              </div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Favorite Debates
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {favorites.slice(0, 3).map((debate) => (
              <div
                key={debate.id}
                onClick={() => navigate('/history')}
                className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl cursor-pointer transition-colors group border border-amber-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {debate.prompt}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{debate.steps.length} steps</span>
                      <span>•</span>
                      <span>{new Date(debate.timestamp).toLocaleDateString()}</span>
                      {debate.category && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600">{debate.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4">
          <div className="text-2xl mb-2">🧠</div>
          <div className="font-bold text-gray-900">Solver</div>
          <div className="text-sm text-gray-600">Initial answer</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-bold text-gray-900">Critic</div>
          <div className="text-sm text-gray-600">Reviews quality</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="text-2xl mb-2">✨</div>
          <div className="font-bold text-gray-900">Refiner</div>
          <div className="text-sm text-gray-600">Improves answer</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="text-2xl mb-2">⚖️</div>
          <div className="font-bold text-gray-900">Judge</div>
          <div className="text-sm text-gray-600">Final decision</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEnhanced;
