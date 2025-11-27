'use client';

import Link from 'next/link';
import { useIncome } from '@/features/income/hooks/useIncome';

export default function AppHeader() {
    const { summary } = useIncome();

    return (
        <div className="flex items-center justify-between w-full bg-[#F3E5F5] px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-b-xl shadow-sm">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">You Earned :</p>
                <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                    {/* USDT Icon */}
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#26A17B" />
                        <path d="M17.495 17.6275V25.0375H14.53V17.6275C10.985 17.515 8.5 16.69 8.5 15.7075C8.5 14.725 10.985 13.9 14.53 13.7875V11.425H17.495V13.7875C21.04 13.9 23.525 14.725 23.525 15.7075C23.525 16.69 21.04 17.515 17.495 17.6275ZM16.0125 14.68C13.625 14.68 11.6 15.1375 11.6 15.7075C11.6 16.2775 13.625 16.735 16.0125 16.735C18.4 16.735 20.425 16.2775 20.425 15.7075C20.425 15.1375 18.4 14.68 16.0125 14.68ZM17.495 6.96249V9.79749H25.5V12.16H17.495V12.895H14.53V12.16H6.5V9.79749H14.53V6.96249H17.495Z" fill="white" />
                    </svg>
                    <span className="text-xs sm:text-sm md:text-base font-bold text-[#26A17B] truncate">
                        {summary?.totalIncome ? summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
                <Link
                    href="/withdraw"
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-[#FFA726] text-white text-[10px] sm:text-xs md:text-sm font-bold rounded-md sm:rounded-lg shadow-sm hover:bg-orange-500 transition-colors"
                >
                    <span className="whitespace-nowrap">Withdraw</span>
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
                <a
                    href="https://t.me/YourSupportLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-0.5 sm:gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-[#29B6F6] text-white flex-shrink-0">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-sm font-medium hidden sm:inline">Support</span>
                </a>
            </div>
        </div>
    );
}
