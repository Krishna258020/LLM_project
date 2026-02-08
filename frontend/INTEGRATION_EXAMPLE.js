// Example React component for Multi-Agent Debate System
// This shows how to integrate the backend API with your frontend

import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DebateInterface() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runDebate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API}/debate`, {
        prompt: prompt
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API}/health`);
      console.log('Health Status:', response.data);
      alert(JSON.stringify(response.data, null, 2));
    } catch (err) {
      alert('Failed to check health: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🤖 Multi-Agent Debate System</h1>

      {/* Health Check Button */}
      <button onClick={checkHealth} style={{ marginBottom: '20px' }}>
        Check Ollama Status
      </button>

      {/* Input Area */}
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your question here..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={runDebate}
        disabled={loading || !prompt.trim()}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Debating... (this may take 30-90s)' : 'Start Debate'}
      </button>

      {/* Loading State */}
      {loading && (
        <div style={{ marginTop: '20px', color: '#666' }}>
          <p>⏳ Running multi-agent debate...</p>
          <p style={{ fontSize: '14px' }}>
            Solver → Critic → Refiner → Judge
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '5px',
            color: '#c62828'
          }}
        >
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div style={{ marginTop: '20px' }}>
          {/* Final Answer */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#e8f5e9',
              border: '2px solid #4caf50',
              borderRadius: '5px',
              marginBottom: '20px'
            }}
          >
            <h2>✅ Final Answer</h2>
            <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
              {result.result}
            </p>
          </div>

          {/* Debate Steps */}
          <div>
            <h3>📊 Debate Steps</h3>
            {result.steps.map((step, index) => (
              <div
                key={index}
                style={{
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <strong>
                    Step {index + 1}: {step.agent}
                  </strong>{' '}
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    ({step.model})
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#333',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {step.output}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div
        style={{
          marginTop: '40px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '5px',
          fontSize: '14px'
        }}
      >
        <strong>ℹ️ Info:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Make sure Ollama is running: <code>ollama serve</code></li>
          <li>
            Required models: mistral, phi3, llama3.1
          </li>
          <li>Expected response time: 30-90 seconds</li>
          <li>All processing happens locally on your machine</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// Alternative: Simple Hook-based Implementation
// ============================================

export function useDebate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDebate = async (prompt) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API}/debate`, { prompt });
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API}/health`);
      return response.data;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return { runDebate, checkHealth, loading, error };
}

// Usage example:
// const { runDebate, loading } = useDebate();
// const result = await runDebate("What is AI?");
