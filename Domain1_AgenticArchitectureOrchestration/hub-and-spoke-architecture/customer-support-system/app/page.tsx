'use client';

import { useState } from 'react';

interface SupportResponse {
  success: boolean;
  customerId: string;
  response: string;
  timestamp: string;
}

export default function Home() {
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SupportResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Request failed');
      }

      const data = (await response.json()) as SupportResponse;
      setResult(data);
      setCustomerId('');
      setDescription('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <main className="w-full max-w-2xl">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">
            🎧 Customer Support System
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            AI-powered support with specialized subagents for billing, technical, and account issues
          </p>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-green-900 dark:text-green-100 mb-4">
                ✅ Support Response Received
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Customer ID
                  </p>
                  <p className="text-green-700 dark:text-green-300">{result.customerId}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    AI Response
                  </p>
                  <div className="bg-white dark:bg-zinc-800 rounded p-4 mt-2 text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                    {result.response}
                  </div>
                </div>
                <div suppressHydrationWarning>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Processed: {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Customer ID
              </label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g., CUST-12345"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Issue Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue... (e.g., I was charged twice, my service keeps timing out, etc.)"
                rows={6}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !customerId || !description}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? '🔄 Processing...' : '📨 Submit Support Request'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-black dark:text-white mb-4">Example Issues:</h3>
            <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>• "I was charged twice for my subscription this month. Can I get a refund?"</p>
              <p>• "My API service keeps timing out. I'm getting connection refused errors every 5 minutes."</p>
              <p>• "I need to update my email address and upgrade my account tier."</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
