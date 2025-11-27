/**
 * Trading Status Component
 * Shows AI trading status and My Trade Power with tabs
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import Card from './Card';

interface Trade {
  id: string;
  pair: string;
  type: 'Long' | 'Short';
  leverage: number;
  entryPrice: number;
  latestPrice: number;
  time: string;
  performance: number;
}

interface TradingStatusProps {
  investments?: any[];
  isLoading?: boolean;
}

// Seeded random number generator for consistent daily data
const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

// Generate random AI trading data with daily seed
const generateAITrades = (dateSeed: string): Trade[] => {
  const pairs = ['SUPER/USDT', 'ETHW/USDT', 'ACE/USDT', 'POWD/USDT', 'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT'];
  const types: ('Long' | 'Short')[] = ['Long', 'Short'];

  // Create seed from date string
  const seed = dateSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = seededRandom(seed);

  return Array.from({ length: 20 }, (_, i) => {
    const pair = pairs[Math.floor(random() * pairs.length)];
    const type = types[Math.floor(random() * types.length)];
    const leverage = Math.floor(random() * 15) + 10; // 10-25X
    const basePrice = random() * 1 + 0.2; // 0.2-1.2 for better price display
    const entryPrice = parseFloat(basePrice.toFixed(7));
    // Generate positive performance (40-65% range like in the image)
    const performancePercent = random() * 25 + 40; // 40-65%
    const priceChangePercent = performancePercent / leverage; // Reverse calculate price change
    const priceChange = (priceChangePercent / 100) * entryPrice;
    const latestPrice = parseFloat((entryPrice + priceChange).toFixed(7));
    const performance = parseFloat(performancePercent.toFixed(2));

    // Generate random date (last 7 days)
    const daysAgo = Math.floor(random() * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const hours = Math.floor(random() * 24);
    const minutes = Math.floor(random() * 60);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = `${month}-${day} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}(UTC-5)`;

    return {
      id: `ai-${i}-${dateSeed}`,
      pair,
      type,
      leverage,
      entryPrice,
      latestPrice,
      time,
      performance,
    };
  });
};

// Get today's date string for seeding
const getTodayDateString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
};

export default function TradingStatus({ investments = [], isLoading = false }: TradingStatusProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'my'>('ai');
  const [aiTrades, setAiTrades] = useState<Trade[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize and update AI trades daily
  useEffect(() => {
    const updateAITrades = () => {
      if (typeof window === 'undefined') return;

      const todayDateString = getTodayDateString();
      const storedDate = localStorage.getItem('aiTradesLastUpdate');

      // If same day and we have stored data, use it
      if (storedDate === todayDateString) {
        const storedTrades = localStorage.getItem('aiTrades');
        if (storedTrades) {
          try {
            const parsedTrades = JSON.parse(storedTrades);
            setAiTrades(parsedTrades);
            return;
          } catch (e) {
            // If parsing fails, generate new
          }
        }
      }

      // New day or no stored data, generate new trades
      // Generate 20 trades for View More functionality
      const newTrades = generateAITrades(todayDateString);
      // Extend to 20 items by generating more with slightly different seeds/indices if needed, 
      // but for now let's just modify generateAITrades to return 20 items.
      // Since generateAITrades is defined outside, we'll assume it's updated or we call it multiple times.
      // Actually, let's update generateAITrades to return 20 items in the helper function update below.

      setAiTrades(newTrades);
      localStorage.setItem('aiTradesLastUpdate', todayDateString);
      localStorage.setItem('aiTrades', JSON.stringify(newTrades));
    };

    // Initialize on mount
    updateAITrades();

    // Check for day change every hour
    const interval = setInterval(updateAITrades, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const myActiveInvestments = useMemo(() => {
    if (!investments || investments.length === 0) return [];
    return investments
      .filter((inv: any) => inv?.status === 'active')
      .sort((a: any, b: any) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
  }, [investments]);

  const investmentSummary = useMemo(() => {
    if (myActiveInvestments.length === 0) {
      return {
        totalInvested: 0,
        totalEarned: 0,
        avgDailyROI: 0,
      };
    }

    const totalInvested = myActiveInvestments.reduce((sum: number, inv: any) => {
      return sum + (parseFloat(inv?.amount) || 0);
    }, 0);

    const totalEarned = myActiveInvestments.reduce((sum: number, inv: any) => {
      return sum + (parseFloat(inv?.totalEarned) || 0);
    }, 0);

    const avgDailyROI =
      myActiveInvestments.reduce((sum: number, inv: any) => {
        return sum + (parseFloat(inv?.plan?.dailyROI ?? inv?.dailyROI) || 0);
      }, 0) / myActiveInvestments.length;

    return {
      totalInvested,
      totalEarned,
      avgDailyROI,
    };
  }, [myActiveInvestments]);

  const renderMyTradePower = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={`my-skeleton-${i}`} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      );
    }

    if (myActiveInvestments.length === 0) {
      return (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-500 text-sm sm:text-base">No active trade power yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-0 divide-y divide-gray-100">
        {myActiveInvestments.map((inv: any) => {
          // Use startDate or fallback to createdAt, then default to now
          const startDateStr = inv?.startDate || inv?.createdAt;
          const startDate = startDateStr ? new Date(startDateStr) : new Date();

          // Calculate difference in milliseconds
          const diffTime = Math.abs(Date.now() - startDate.getTime());
          // Convert to days, floor it, and add 1 to count the starting day as Day 1
          const daysRunning = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

          const amount = parseFloat(inv?.amount) || 0;

          // Format date as YYYY-MM-DD HH:mm:ss
          const dateStr = startDate.toISOString().replace('T', ' ').split('.')[0];

          // Calculate progress for 20-day cycle
          const maxDays = 20;
          const progressPercent = Math.min(daysRunning / maxDays, 1);
          const circumference = 2 * Math.PI * 24; // 2 * pi * radius (r=24)
          const strokeDashoffset = circumference * (1 - progressPercent);

          return (
            <div
              key={inv?._id || inv?.id}
              className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              {/* Left: Circular Progress */}
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  {/* Background Circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="#F3F4F6"
                      strokeWidth="4"
                      fill="none"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="#A855F7"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                    <span className="font-bold text-gray-900">{daysRunning}</span>
                    <span className="text-[10px] text-gray-500">Day</span>
                  </div>
                </div>

                {/* Middle: Status and Date */}
                <div>
                  <p className="text-lg font-medium text-gray-800 mb-0.5">Active</p>
                  <p className="text-sm text-gray-500">{dateStr}</p>
                </div>
              </div>

              {/* Right: Amount and Icon */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-xl font-bold text-[#84CC16]">
                  +{amount}
                </span>
                {/* Cube Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Determine displayed trades based on expansion
  const displayedTrades = isExpanded ? aiTrades : aiTrades.slice(0, 5);

  return (
    <Card className="overflow-hidden border-0 shadow-sm rounded-3xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 px-4 text-center font-bold text-base sm:text-lg transition-colors relative ${activeTab === 'ai'
            ? 'text-[#6366F1]'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Ai Trading status
          {activeTab === 'ai' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1]"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-3 px-4 text-center font-medium text-base sm:text-lg transition-colors relative ${activeTab === 'my'
            ? 'text-[#6366F1]'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          My Trade Power
          {activeTab === 'my' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1]"></span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'ai' ? (
        isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : aiTrades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm sm:text-base">No AI trades available</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100">
            {displayedTrades.map((trade) => (
              <div
                key={trade.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  {/* Left: Pair and Badges */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {trade.pair}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                      {trade.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                      {trade.leverage}X
                    </span>
                  </div>

                  {/* Right: Time */}
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {trade.time.split(' ')[0]}
                    </p>
                    <p className="text-xs text-gray-400">
                      {trade.time.split(' ')[1]}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  {/* Left: Prices */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    <div>
                      <p className="text-xs text-gray-400">Entry Price:</p>
                      <p className="text-sm font-medium text-gray-900">{trade.entryPrice.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Latest Price:</p>
                      <p className="text-sm font-medium text-gray-900">{trade.latestPrice.toFixed(6)}</p>
                    </div>
                  </div>

                  {/* Right: Profit */}
                  <div>
                    <span className="text-xl font-bold text-[#22C55E]">
                      +{trade.performance.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* View More Button */}
            <div className="p-4 text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                {isExpanded ? 'View Less' : 'View More'}
                <svg
                  className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        )
      ) : (
        renderMyTradePower()
      )}
    </Card>
  );
}

