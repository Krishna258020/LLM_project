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
      
      const { result, steps } = response.data;

      setCurrentDebate({ steps, result });
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

      {/* Loading Animation - Agent Pipeline */}
      {isDebating && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-2xl p-8 mb-6 shadow-xl">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-indigo-900 mb-2">
              Multi-Agent Debate in Progress
            </h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span className="text-indigo-700 font-medium">{elapsedTime}s elapsed</span>
            </div>
          </div>

          {/* Agent Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { agent: 'Solver', model: 'mistral', icon: '🧠', color: 'indigo' },
              { agent: 'Critic', model: 'phi3', icon: '🔍', color: 'amber' },
              { agent: 'Refiner', model: 'llama3.1', icon: '✨', color: 'purple' },
              { agent: 'Judge', model: 'mistral', icon: '⚖️', color: 'green' }
            ].map((agentInfo, idx) => {
              const isActive = currentAgent === agentInfo.agent;
              const isCompleted = currentDebate?.steps?.some(step => step.agent === agentInfo.agent);
              
              return (
                <div
                  key={agentInfo.agent}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-500 ${
                    isActive
                      ? `bg-${agentInfo.color}-100 border-${agentInfo.color}-400 shadow-lg scale-105`
                      : isCompleted
                      ? `bg-${agentInfo.color}-50 border-${agentInfo.color}-300`
                      : 'bg-white border-gray-200 opacity-50'
                  }`}
                >
                  {/* Completion Check */}
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  
                  {/* Loading Spinner */}
                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-6 h-6">
                      <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  )}

                  <div className="text-center">
                    <div className={`text-4xl mb-3 ${isActive ? 'animate-bounce' : ''}`}>
                      {agentInfo.icon}
                    </div>
                    <h4 className={`font-bold mb-1 ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                      {agentInfo.agent}
                    </h4>
                    <p className={`text-xs uppercase font-semibold ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {agentInfo.model}
                    </p>
                    
                    {isActive && (
                      <div className="mt-3 flex justify-center gap-1">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 relative"
                style={{ 
                  width: `${((currentDebate?.steps?.length || 0) / 4) * 100}%`,
                }}
              >
                <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {currentDebate?.steps?.length || 0} of 4 agents completed
            </p>
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
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-900">Final Answer</h2>
          </div>
          <p className="text-gray-800 leading-relaxed text-lg">{currentDebate.result}</p>
          <div className="mt-4 pt-4 border-t border-green-200 text-sm text-gray-600">
            Completed in {elapsedTime}s • {currentDebate.steps.length} agent interactions
          </div>
        </div>
      )}
    </div>
  );
};

export default NewDebate;
