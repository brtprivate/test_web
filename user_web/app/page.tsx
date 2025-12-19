'use client';

import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);
  const [testMessage, setTestMessage] = useState('Ready for testing');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="w-full max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Web - Test Page
            </h1>
            <p className="text-gray-600">
              Normal setup for testing
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Status: {testMessage}
              </p>
              <button
                onClick={() => setTestMessage('Test successful!')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Test Button
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 mb-2">
                Counter: {count}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCount(count + 1)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Increment
                </button>
                <button
                  onClick={() => setCount(count - 1)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Decrement
                </button>
                <button
                  onClick={() => setCount(0)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Test Information
              </h2>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Next.js 16.1.0</li>
                <li>✓ React 19.2.3</li>
                <li>✓ TypeScript</li>
                <li>✓ Tailwind CSS</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
