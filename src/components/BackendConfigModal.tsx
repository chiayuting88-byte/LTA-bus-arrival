import React, { useState } from 'react';
import { BackendConfig } from '../types/bus';
import { X, Server, CheckCircle2, AlertCircle, Copy, Check, Code, ExternalLink } from 'lucide-react';

interface BackendConfigModalProps {
  config: BackendConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (newConfig: BackendConfig) => void;
  activeStopCode: string;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSaveConfig,
  activeStopCode,
}) => {
  const [useMock, setUseMock] = useState(config.useMockSimulation);
  const [baseUrl, setBaseUrl] = useState(config.backendBaseUrl);
  const [apiKey, setApiKey] = useState(config.ltaApiKey);
  const [refreshInterval, setRefreshInterval] = useState(config.autoRefreshIntervalSeconds);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'instructions' | 'sampleCode'>('settings');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      useMockSimulation: useMock,
      backendBaseUrl: baseUrl,
      ltaApiKey: apiKey,
      autoRefreshIntervalSeconds: Number(refreshInterval),
    });
    onClose();
  };

  const handleTestConnection = async () => {
    if (!baseUrl) {
      setTestStatus('error');
      setTestMessage('Please enter a backend base URL first (e.g. http://localhost:3000)');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Testing /api/busarrival endpoint...');

    try {
      const url = baseUrl
        ? `${baseUrl.replace(/\/$/, '')}/api/busarrival?BusStopCode=${activeStopCode}`
        : `/api/busarrival?BusStopCode=${activeStopCode}`;

      const res = await fetch(url, {
        headers: apiKey ? { AccountKey: apiKey } : undefined,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP error ${res.status}: ${res.statusText}`);
      }

      setTestStatus('success');
      setTestMessage(
        `Connected! Received ${
          data.Services ? data.Services.length : Object.keys(data).length
        } services for stop ${activeStopCode}.`
      );
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Connection test: ${err.message}`);
    }
  };

  const sampleExpressCode = `// server.js - Minimal Express proxy for LTA DataMall
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const LTA_API_KEY = process.env.LTA_API_KEY || '${apiKey || 'YOUR_LTA_DATAMALL_KEY'}';

app.get('/api/bus-arrival', async (req, res) => {
  const busStopCode = req.query.BusStopCode;
  if (!busStopCode) {
    return res.status(400).json({ error: 'BusStopCode is required' });
  }

  try {
    const ltaUrl = \`https://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=\${busStopCode}\`;
    const response = await fetch(ltaUrl, {
      headers: {
        'AccountKey': LTA_API_KEY,
        'accept': 'application/json'
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching LTA Data:', error);
    res.status(500).json({ error: 'Failed to fetch arrival data from LTA' });
  }
});

app.listen(3000, () => {
  console.log('SG Bus Proxy running on port 3000');
});`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Backend & LTA Data Connection</h3>
              <p className="text-xs text-slate-500">Configure your live backend proxy or toggle simulation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('sampleCode')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sampleCode'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sample Backend Proxy (Node.js)
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'instructions'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            LTA DataMall API Specs
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Mode switch */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Data Source Engine
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {useMock ? 'Offline High-Fidelity Simulation' : 'Custom Live Backend'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUseMock(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors ${
                      useMock
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-emerald-500 shadow-sm'
                        : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    Simulated LTA Engine
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseMock(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors ${
                      !useMock
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-emerald-500 shadow-sm'
                        : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    Real Backend URL
                  </button>
                </div>
              </div>

              {!useMock && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Backend Base URL
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="e.g. http://localhost:3000 or https://api.mybuses.sg"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Expected endpoint: <code>GET /api/bus-arrival?BusStopCode=01012</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      LTA AccountKey (Optional Header)
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Your LTA DataMall AccountKey (if passed via client)"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  {/* Test Connection Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing'}
                      className="px-3.5 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
                    >
                      {testStatus === 'testing' ? 'Testing Connection...' : 'Test Endpoint Connection'}
                    </button>
                  </div>

                  {testStatus !== 'idle' && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        testStatus === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : testStatus === 'error'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      {testStatus === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      )}
                      <span>{testMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Auto Refresh Setting */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Auto-Refresh Interval: <span className="font-mono">{refreshInterval} seconds</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>5s (Rapid)</span>
                  <span>15s (Standard)</span>
                  <span>60s (Battery Saver)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sampleCode' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Copy this sample Node.js proxy to connect to LTA DataMall:</span>
                <button
                  onClick={() => copyToClipboard(sampleExpressCode)}
                  className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {sampleExpressCode}
              </pre>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <h4 className="font-semibold text-slate-900 dark:text-white">LTA DataMall v2 Integration Guide</h4>
              <p>
                The Land Transport Authority of Singapore provides live bus arrival predictions through{' '}
                <strong>DataMall 2.0</strong>. Because LTA requires an <code>AccountKey</code> header and blocks
                direct browser CORS requests, a lightweight server proxy or serverless function is standard.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="font-medium text-slate-800 dark:text-slate-200">Official Endpoint:</div>
                <code className="text-emerald-700 dark:text-emerald-400 break-all text-[11px]">
                  GET https://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=01012
                </code>
                <div className="text-[11px] text-slate-500">
                  Required Header: <code>AccountKey: &lt;your_key&gt;</code>
                </div>
              </div>

              <div className="pt-1">
                <a
                  href="https://datamall.lta.gov.sg/content/datamall/en/request-api.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <span>Request Free LTA DataMall API Key</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Settings are preserved in browser storage</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
