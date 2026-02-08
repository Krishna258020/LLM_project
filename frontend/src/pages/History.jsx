import React, { useState, useEffect } from 'react';
import { Search, Clock, MessageSquare, Trash2, Download, RefreshCw, Star } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const History = () => {
  const [debates, setDebates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDebate, setSelectedDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadDebates();
  }, []);

  const loadDebates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/debates`);
      setDebates(response.data || []);
    } catch (error) {
      console.error('Failed to load debates:', error);
      setError('Failed to load debates. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const exportDebate = (debate) => {
    const dataStr = JSON.stringify(debate, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debate-${debate.id}.json`;
    link.click();
  };

  const toggleFavorite = async (debateId, currentFavoriteStatus) => {
    try {
      await axios.patch(`${API}/debates/${debateId}`, {
        is_favorite: !currentFavoriteStatus
      });
      // Update local state
      setDebates(debates.map(d => 
        d.id === debateId ? { ...d, is_favorite: !currentFavoriteStatus } : d
      ));
      if (selectedDebate && selectedDebate.id === debateId) {
        setSelectedDebate({ ...selectedDebate, is_favorite: !currentFavoriteStatus });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Failed to update favorite status');
    }
  };

  const filteredDebates = debates.filter(debate => {
    const matchesSearch = debate.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFavorite = !showFavoritesOnly || debate.is_favorite;
    return matchesSearch && matchesFavorite;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Debate History</h1>
          <p className="text-gray-600">Browse and search all your past debates</p>
        </div>
        <button
          onClick={loadDebates}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-gray-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-4 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search debates by question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors shadow-sm border ${
              showFavoritesOnly
                ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star className={`w-5 h-5 ${showFavoritesOnly ? 'fill-yellow-500' : ''}`} />
            <span className="font-medium">Favorites</span>
          </button>
        </div>
        {filteredDebates.length > 0 && (
          <div className="text-sm text-gray-500">
            Showing {filteredDebates.length} of {debates.length} debates
            {showFavoritesOnly && ' (favorites only)'}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debates...</p>
        </div>
      )}

      {/* Debates List */}
      {!loading && (
        <div className="space-y-3">
          {filteredDebates.length > 0 ? (
            filteredDebates.map((debate) => (
              <div
                key={debate.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => setSelectedDebate(debate)}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {debate.prompt}
                      </h3>
                      {debate.is_favorite && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{debate.steps.length} steps</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(debate.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(debate.id, debate.is_favorite);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        debate.is_favorite
                          ? 'text-yellow-500 hover:bg-yellow-50'
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                      title={debate.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-5 h-5 ${debate.is_favorite ? 'fill-yellow-500' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportDebate(debate);
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Export debate"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {searchTerm ? 'No debates found matching your search' : 'No debates yet'}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? 'Try a different search term' : 'Start a new debate to see it here'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDebate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={() => setSelectedDebate(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900 flex-1">
                  {selectedDebate.prompt}
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(selectedDebate.id, selectedDebate.is_favorite);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedDebate.is_favorite
                      ? 'text-yellow-500 hover:bg-yellow-50'
                      : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                  }`}
                  title={selectedDebate.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-6 h-6 ${selectedDebate.is_favorite ? 'fill-yellow-500' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(selectedDebate.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{selectedDebate.steps.length} steps</span>
                </div>
                {selectedDebate.is_favorite && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <span>Favorite</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Debate Process</h3>
              <div className="space-y-4 mb-6">
                {selectedDebate.steps.map((step, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{step.agent}</div>
                        <div className="text-xs text-gray-500">Model: {step.model}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed pl-10">{step.output}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <div className="font-bold text-green-900 text-lg">Final Answer</div>
                </div>
                <p className="text-gray-800 leading-relaxed">{selectedDebate.result}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex gap-3">
              <button
                onClick={() => exportDebate(selectedDebate)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setSelectedDebate(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
