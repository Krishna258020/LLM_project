import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Brain, Target, Zap, Clock, Award, Lightbulb } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    trends: [],
    qualityScores: [],
    topicClusters: [],
    recommendations: null,
    sentimentAnalysis: null,
    performanceMetrics: null
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [trends, quality, clusters, recommendations, sentiment, performance] = await Promise.all([
        axios.get(`${API}/analytics/trends`).catch(err => ({ data: [] })),
        axios.get(`${API}/ai-insights/quality-scores`).catch(err => ({ data: [] })),
        axios.get(`${API}/ai-insights/topic-clusters`).catch(err => ({ data: [] })),
        axios.get(`${API}/ai-insights/recommendations`).catch(err => ({ 
          data: {
            top_categories: [],
            recommended_templates: [],
            best_time_to_debate: { hour: 14, count: 0, avg_duration: 0 },
            insights: ['Create your first debate to start seeing personalized insights!']
          }
        })),
        axios.get(`${API}/ai-insights/sentiment-analysis`).catch(err => ({ 
          data: {
            overall_distribution: { positive: 0, negative: 0, neutral: 0 },
            recent_sentiments: [],
            sentiment_by_category: {}
          }
        })),
        axios.get(`${API}/ai-insights/performance-metrics`).catch(err => ({ 
          data: {
            overall_stats: { total_debates: 0, avg_duration: 0, fastest_debate: 0, slowest_debate: 0, avg_result_length: 0 },
            weekly_comparison: { this_week: 0, last_week: 0, change_percent: 0 },
            top_categories: []
          }
        }))
      ]);

      setData({
        trends: trends.data || [],
        qualityScores: quality.data || [],
        topicClusters: clusters.data || [],
        recommendations: recommendations.data || {
          top_categories: [],
          recommended_templates: [],
          best_time_to_debate: { hour: 14, count: 0, avg_duration: 0 },
          insights: ['Create your first debate to start seeing personalized insights!']
        },
        sentimentAnalysis: sentiment.data || {
          overall_distribution: { positive: 0, negative: 0, neutral: 0 },
          recent_sentiments: [],
          sentiment_by_category: {}
        },
        performanceMetrics: performance.data || {
          overall_stats: { total_debates: 0, avg_duration: 0, fastest_debate: 0, slowest_debate: 0, avg_result_length: 0 },
          weekly_comparison: { this_week: 0, last_week: 0, change_percent: 0 },
          top_categories: []
        }
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Set default empty data structure
      setData({
        trends: [],
        qualityScores: [],
        topicClusters: [],
        recommendations: {
          top_categories: [],
          recommended_templates: [],
          best_time_to_debate: { hour: 14, count: 0, avg_duration: 0 },
          insights: ['Create your first debate to start seeing personalized insights!']
        },
        sentimentAnalysis: {
          overall_distribution: { positive: 0, negative: 0, neutral: 0 },
          recent_sentiments: [],
          sentiment_by_category: {}
        },
        performanceMetrics: {
          overall_stats: { total_debates: 0, avg_duration: 0, fastest_debate: 0, slowest_debate: 0, avg_result_length: 0 },
          weekly_comparison: { this_week: 0, last_week: 0, change_percent: 0 },
          top_categories: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'quality', label: 'Quality Scores', icon: Award },
    { id: 'topics', label: 'Topic Clusters', icon: Target },
    { id: 'sentiment', label: 'Sentiment', icon: Brain },
    { id: 'insights', label: 'AI Insights', icon: Lightbulb },
  ];

  const COLORS = ['#4F46E5', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
        <p className="text-gray-600">AI-powered analysis of your debate performance</p>
      </div>

      {/* Quick Stats */}
      {data.performanceMetrics && data.performanceMetrics.overall_stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{data.performanceMetrics.overall_stats.total_debates || 0}</span>
            </div>
            <p className="text-indigo-100 text-sm">Total Debates</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{data.performanceMetrics.overall_stats.avg_duration || 0}s</span>
            </div>
            <p className="text-purple-100 text-sm">Avg Duration</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{data.performanceMetrics.weekly_comparison?.change_percent || 0}%</span>
            </div>
            <p className="text-pink-100 text-sm">Week Change</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{data.performanceMetrics.overall_stats.fastest_debate || 0}s</span>
            </div>
            <p className="text-orange-100 text-sm">Fastest Debate</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Performance Trends */}
            {data.trends && data.trends.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Trends (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} name="Debates" />
                    <Line type="monotone" dataKey="avg_duration" stroke="#8B5CF6" strokeWidth={2} name="Avg Duration (s)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Trends (Last 7 Days)</h2>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No trend data available yet. Create some debates to see your performance trends!</p>
                </div>
              </div>
            )}

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Topic Distribution</h2>
                {data.topicClusters && data.topicClusters.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.topicClusters}
                        dataKey="debate_count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {data.topicClusters.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No topic data available yet</p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Categories</h2>
                {data.performanceMetrics?.top_categories && data.performanceMetrics.top_categories.length > 0 ? (
                  <div className="space-y-3">
                    {data.performanceMetrics.top_categories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{cat.category}</p>
                          <p className="text-sm text-gray-600">{cat.count} debates</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-indigo-600">{cat.avg_duration}s avg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No category data available yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Quality Scores Tab */}
        {activeTab === 'quality' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Debate Quality Scores</h2>
            <p className="text-gray-600 mb-6">AI-powered quality analysis based on length, speed, and content</p>
            
            {data.qualityScores && data.qualityScores.length > 0 ? (
              <div className="space-y-3">
                {data.qualityScores.slice(0, 20).map((debate) => (
                  <div key={debate.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        debate.quality_score >= 80 ? 'bg-green-500' :
                        debate.quality_score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}>
                        {debate.quality_score}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{debate.prompt}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>Length: {debate.length_score}</span>
                        <span>Speed: {debate.speed_score}</span>
                        <span>Keywords: {debate.keyword_score}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Award className={`w-6 h-6 ${
                        debate.quality_score >= 80 ? 'text-green-500' :
                        debate.quality_score >= 60 ? 'text-yellow-500' :
                        'text-red-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No quality scores available yet. Create some debates to see quality analysis!</p>
              </div>
            )}
          </div>
        )}

        {/* Topic Clusters Tab */}
        {activeTab === 'topics' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Topic Clustering Analysis</h2>
            <p className="text-gray-600 mb-6">Discover patterns in your debate topics</p>
            
            {data.topicClusters && data.topicClusters.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.topicClusters}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="debate_count" fill="#4F46E5" name="Debates" />
                    <Bar dataKey="popularity_score" fill="#8B5CF6" name="Popularity" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {data.topicClusters.map((cluster, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-bold text-gray-900 mb-2">{cluster.category}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Debates: {cluster.debate_count}</p>
                        <p>Avg Duration: {cluster.avg_duration}s</p>
                        <p>Avg Length: {cluster.avg_length} chars</p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${cluster.popularity_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No topic clusters available yet. Create debates with categories to see clustering analysis!</p>
              </div>
            )}
          </div>
        )}

        {/* Sentiment Tab */}
        {activeTab === 'sentiment' && data.sentimentAnalysis && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-900 font-semibold">Positive</span>
                  <span className="text-2xl font-bold text-green-600">
                    {data.sentimentAnalysis.overall_distribution?.positive || 0}
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(() => {
                        const dist = data.sentimentAnalysis.overall_distribution;
                        const total = (dist?.positive || 0) + (dist?.negative || 0) + (dist?.neutral || 0);
                        return total > 0 ? ((dist?.positive || 0) / total) * 100 : 0;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-semibold">Neutral</span>
                  <span className="text-2xl font-bold text-gray-600">
                    {data.sentimentAnalysis.overall_distribution?.neutral || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(() => {
                        const dist = data.sentimentAnalysis.overall_distribution;
                        const total = (dist?.positive || 0) + (dist?.negative || 0) + (dist?.neutral || 0);
                        return total > 0 ? ((dist?.neutral || 0) / total) * 100 : 0;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-900 font-semibold">Negative</span>
                  <span className="text-2xl font-bold text-red-600">
                    {data.sentimentAnalysis.overall_distribution?.negative || 0}
                  </span>
                </div>
                <div className="w-full bg-red-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(() => {
                        const dist = data.sentimentAnalysis.overall_distribution;
                        const total = (dist?.positive || 0) + (dist?.negative || 0) + (dist?.neutral || 0);
                        return total > 0 ? ((dist?.negative || 0) / total) * 100 : 0;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sentiment Analysis</h2>
              {data.sentimentAnalysis.recent_sentiments && data.sentimentAnalysis.recent_sentiments.length > 0 ? (
                <div className="space-y-3">
                  {data.sentimentAnalysis.recent_sentiments.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        item.sentiment === 'positive' ? 'bg-green-500' :
                        item.sentiment === 'negative' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 capitalize">{item.sentiment}</p>
                        <p className="text-xs text-gray-600">Confidence: {item.confidence}%</p>
                      </div>
                      {item.category && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                          {item.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No sentiment data available yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <>
            {data.recommendations ? (
              <>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 text-white mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
                  </div>
                  <p className="text-indigo-100 mb-6">Personalized recommendations based on your debate patterns</p>
                  
                  {data.recommendations.insights && data.recommendations.insights.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.recommendations.insights.map((insight, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <Lightbulb className="w-6 h-6 mb-2" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Categories */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Your Top Categories</h3>
                    {data.recommendations.top_categories && data.recommendations.top_categories.length > 0 ? (
                      <div className="space-y-3">
                        {data.recommendations.top_categories.map((cat, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-semibold text-gray-900">{cat.category}</p>
                              <p className="text-sm text-gray-600">{cat.usage_count} debates</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-indigo-600">{cat.avg_duration}s avg</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No category data yet. Create debates with categories to see insights!</p>
                      </div>
                    )}
                  </div>

                  {/* Recommended Templates */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Templates</h3>
                    {data.recommendations.recommended_templates && data.recommendations.recommended_templates.length > 0 ? (
                      <div className="space-y-3">
                        {data.recommendations.recommended_templates.map((tmpl, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <p className="font-semibold text-gray-900">{tmpl.name}</p>
                        <p className="text-sm text-gray-600 mb-2">{tmpl.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                            {tmpl.category}
                          </span>
                          <span className="text-gray-500">{tmpl.usage_count} uses</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No templates to recommend yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Best Time to Debate */}
            {data.recommendations.best_time_to_debate && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Optimal Debate Time</h3>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Clock className="w-12 h-12 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {data.recommendations.best_time_to_debate.hour}:00
                    </p>
                    <p className="text-gray-600">
                      {data.recommendations.best_time_to_debate.count > 0 
                        ? `Your most productive hour with ${data.recommendations.best_time_to_debate.count} debates`
                        : 'Create more debates to see patterns'}
                    </p>
                    {data.recommendations.best_time_to_debate.avg_duration > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Average duration: {data.recommendations.best_time_to_debate.avg_duration}s
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No AI Insights Available Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create some debates with categories to unlock personalized AI insights!
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Start by creating 3-5 categorized debates</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
