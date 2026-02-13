import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PlayCircle, Loader, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const AGENT_COLORS = {
  mistral: '#4F46E5',
  phi3: '#F59E0B',
  'llama3.1': '#8B5CF6'
};

const AGENT_ICONS = {
  Solver: '🧠',
  Critic: '🔍',
  Refiner: '✨',
  Judge: '⚖️'
};

const NewDebate = () => {
  const location = useLocation();
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [currentDebate, setCurrentDebate] = useState(null);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [loadingModel, setLoadingModel] = useState(null);

  // Load template prompt if coming from Templates page - only once
  useEffect(() => {
    if (location.state?.prompt && !templateLoaded) {
      const templatePrompt = location.state.prompt;
      console.log('Loading template prompt:', templatePrompt);
      setPrompt(templatePrompt);
      setTemplateLoaded(true);
    }
  }, [location.state, templateLoaded]);

  useEffect(() => {
    let interval;
    if (isDebating && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isDebating, startTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isDebating) return;

    setIsDebating(true);
    setError(null);
    setCurrentDebate({ steps: [], result: null });
    setStartTime(Date.now());
    setElapsedTime(0);
    setCurrentAgent(null);
    setLoadingModel(null);

    try {
      // Simulate loading sequence for better UX
      const agentSequence = [
        { agent: 'Solver', model: 'mistral', icon: '🧠' },
        { agent: 'Critic', model: 'phi3', icon: '🔍' },
        { agent: 'Refiner', model: 'llama3.1', icon: '✨' },
        { agent: 'Judge', model: 'mistral', icon: '⚖️' }
      ];

      let currentStepIndex = 0;

      // Start the debate request
      const debatePromise = axios.post(`${API}/debate`, { 
        prompt,
        category: category.trim() || null,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : []
      }, {
        timeout: 120000 // 2 minute timeout
      });

      // Simulate agent loading states
      const loadingInterval = setInterval(() => {
        if (currentStepIndex < agentSequence.length) {
          const current = agentSequence[currentStepIndex];
          setCurrentAgent(current.agent);
          setLoadingModel(current.model);
          currentStepIndex++;
        }
      }, 3000); // Update every 3 seconds

      const response = await debatePromise;
      clearInterval(loadingInterval);
      
      const { result, steps, final_confidence } = response.data;
      console.log('Debate response:', { result, steps, final_confidence });

      setCurrentDebate({ steps, result, final_confidence });
      setCurrentAgent(null);
      setLoadingModel(null);
    } catch (err) {
      console.error('Debate error:', err);
      let errorMessage = 'Failed to run debate';
      
      if (err.response?.status === 503) {
        errorMessage = 'Ollama service is not running. Please start Ollama using START_OLLAMA.bat or run "ollama serve" in a terminal.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setCurrentAgent(null);
      setLoadingModel(null);
    } finally {
      setIsDebating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start a New Debate</h1>
          <p className="text-gray-600">Enter your question and let the AI agents collaborate</p>
          {templateLoaded && (
            <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600">
              <Sparkles className="w-4 h-4" />
              <span>Template loaded - Edit the prompt below and start your debate</span>
            </div>
          )}
        </div>
        {isDebating && (
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">{elapsedTime}s</span>
          </div>
        )}
      </div>

      {/* Debate Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Question
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., What are the benefits of renewable energy?"
            disabled={isDebating}
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:bg-gray-50"
          />
          <div className="mt-2 text-xs text-gray-500">
            {prompt.length} characters
          </div>
        </div>

        {/* Category and Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isDebating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
            >
              <option value="">Select a category...</option>
              <option value="Technical">Technical</option>
              <option value="Business">Business</option>
              <option value="Education">Education</option>
              <option value="Analysis">Analysis</option>
              <option value="Problem Solving">Problem Solving</option>
              <option value="Creative">Creative</option>
              <option value="Research">Research</option>
              <option value="Other">Other</option>
            </select>
            <div className="mt-2 text-xs text-gray-500">
              Helps organize and analyze your debates
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., AI, machine learning, python"
              disabled={isDebating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
            />
            <div className="mt-2 text-xs text-gray-500">
              Separate tags with commas
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || isDebating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {isDebating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Processing Debate...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Start Multi-Agent Debate</span>
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* ChatGPT-Style Loading Animation */}
      {isDebating && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg mb-6 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AI Agents Collaborating</h3>
                <p className="text-indigo-100 text-sm">Multi-agent debate in progress...</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-white font-medium text-sm">{elapsedTime}s</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 space-y-4">
            {/* Show completed steps with typing effect */}
            {currentDebate?.steps?.map((step, idx) => {
              // Use confidence from backend if available, otherwise calculate
              const confidence = step.confidence || (() => {
                const baseScores = {
                  'Solver': 75,
                  'Critic': 82,
                  'Refiner': 88,
                  'Judge': 92
                };
                return baseScores[step.agent] || 80;
              })();
              
              const getConfidenceColor = (score) => {
                if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
                if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
                if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                return 'text-orange-600 bg-orange-50 border-orange-200';
              };
              
              return (
                <div key={idx} className="flex gap-4 animate-fadeIn">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {AGENT_ICONS[step.agent]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900">{step.agent}</span>
                      <span className="text-xs text-gray-500 uppercase font-medium">{step.model}</span>
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getConfidenceColor(confidence)}`}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <span>{confidence}% confidence</span>
                      </div>
                    </div>
                    <div className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {step.output}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Current agent processing with typing animation */}
            {currentAgent && (
              <div className="flex gap-4 animate-fadeIn">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg relative">
                    {AGENT_ICONS[currentAgent]}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Loader className="w-3 h-3 text-indigo-600 animate-spin" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{currentAgent}</span>
                    <span className="text-xs text-indigo-600 uppercase font-medium animate-pulse">{loadingModel}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-gray-500 text-sm italic">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting agents */}
            {isDebating && !currentDebate?.result && (
              <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
                <div className="flex -space-x-2">
                  {[
                    { agent: 'Solver', icon: '🧠' },
                    { agent: 'Critic', icon: '🔍' },
                    { agent: 'Refiner', icon: '✨' },
                    { agent: 'Judge', icon: '⚖️' }
                  ].filter(a => !currentDebate?.steps?.some(s => s.agent === a.agent) && a.agent !== currentAgent).map((agentInfo, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-lg opacity-50">
                      {agentInfo.icon}
                    </div>
                  ))}
                </div>
                <span>Waiting to process...</span>
              </div>
            )}
          </div>

          {/* Footer Progress */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="text-gray-900 font-bold">{currentDebate?.steps?.length || 0} / 4 agents</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentDebate?.steps?.length || 0) / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Debate Steps */}
      {currentDebate && currentDebate.steps.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Debate Progress</h2>
            <span className="text-sm text-gray-500">({currentDebate.steps.length} steps)</span>
          </div>
          {currentDebate.steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderLeftWidth: '4px', borderLeftColor: AGENT_COLORS[step.model] }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{AGENT_ICONS[step.agent] || '🤖'}</span>
                <div>
                  <span
                    className="text-sm font-bold uppercase"
                    style={{ color: AGENT_COLORS[step.model] }}
                  >
                    {step.agent}
                  </span>
                  <div className="text-xs text-gray-500">Model: {step.model}</div>
                </div>
                <span className="ml-auto text-xs text-gray-400">Step {idx + 1}</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{step.output}</p>
            </div>
          ))}
        </div>
      )}

      {/* Final Result */}
      {currentDebate?.result && !isDebating && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">✓</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">Final Answer</h2>
                <p className="text-green-700 text-sm">Consensus reached by all agents</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-green-900 font-bold text-lg">
                {currentDebate.final_confidence?.toFixed(1) || 'N/A'}% confidence
              </span>
            </div>
          </div>
          <p className="text-gray-800 leading-relaxed text-lg mb-4">{currentDebate.result}</p>
          <div className="flex items-center gap-6 pt-4 border-t border-green-200 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span>Completed in {elapsedTime}s</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Sparkles className="w-4 h-4" />
              <span>{currentDebate.steps.length} agent interactions</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="font-semibold">Quality:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const finalConf = currentDebate.final_confidence || 0;
                  const filled = star <= Math.ceil((finalConf / 100) * 5);
                  return (
                    <svg key={star} className={`w-4 h-4 ${filled ? 'text-yellow-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewDebate;
