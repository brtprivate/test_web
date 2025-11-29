/**
 * Introduction Page
 * Redesigned to match specific visual requirements
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import MobileLayout from '@/components/layout/MobileLayout';

export default function IntroductionPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <MobileLayout showBottomNav={true}>
      <div className={`min-h-screen bg-[#F3E5F5] p-6 space-y-8 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">
            AiCrypto: Redefining Crypto Trading with AI
          </h1>
          <p className="text-gray-600 text-lg">
            —A Compliance-Driven, Transparent, and Intelligent Crypto Platform
          </p>
        </div>

        {/* Company Info Section */}
        <div className="text-gray-800 leading-relaxed">
          <p>
            AiCrypto LLC is a legally incorporated entity in Colorado, USA
            ( Registration ID: <span className="text-blue-500">17078227</span> <span className="inline-block align-middle">📄</span> ), operating under Colorado's commercial laws
            and financial regulatory frameworks.
          </p>
        </div>

        {/* Certificate Verification Section */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">
            Certificate Verification:
          </h2>
          <p className="text-gray-800 leading-relaxed">
            Validate our credentials via the Colorado Secretary of State's Portal
            ( <a href="https://www.coloradosos.gov/biz/CertificateSearchCriteria.do" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">https://www.coloradosos.gov/biz/CertificateSearchCriteria.do</a> <span className="inline-block align-middle">📄</span> ) using our r
            egistration ID.
          </p>
        </div>

        {/* User Protection Section */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">
            User Protection:
          </h2>
          <p className="text-gray-800 leading-relaxed">
            All transactions are safeguarded by Colorado's Uniform Commercial Code
            (UCC) and Digital Asset Regulatory Act, ensuring enforceable rights and
            dispute resolution mechanisms.
          </p>
        </div>

        {/* Certificates Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 pb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full aspect-[3/4] shadow-xl rounded-sm overflow-hidden border-[6px] border-[#5D4037] bg-white">
              <div className="absolute inset-0 border-2 border-[#D7CCC8] m-1"></div>
              <Image src="/certificate_1.png" alt="Certificate of Document Filed" fill className="object-contain p-2" />
            </div>
            <p className="text-center font-bold text-[#1A237E] text-sm sm:text-base uppercase tracking-wide">
              CERTIFICATE OF DOCUMENT FILED
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full aspect-[3/4] shadow-xl rounded-sm overflow-hidden border-[6px] border-[#5D4037] bg-white">
              <div className="absolute inset-0 border-2 border-[#D7CCC8] m-1"></div>
              <Image src="/certificate_2.png" alt="Certificate of Fact of Good Standing" fill className="object-contain p-2" />
            </div>
            <p className="text-center font-bold text-[#1A237E] text-sm sm:text-base uppercase tracking-wide">
              CERTIFICATE OF FACT OF GOOD STANDING
            </p>
          </div>
        </div>

        {/* Why Choose AiEarn Section */}
        <div className="space-y-4 pb-8">
          <h2 className="text-xl font-bold text-gray-800">
            Why Choose AiCrypto?
          </h2>

          {/* <div className="w-full rounded-lg overflow-hidden shadow-sm">
            <Image
              src="/team.png"
              alt="AiCrypto Team"
              width={800}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div> */}

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>🚀</span> Elite Team & Cutting-Edge Technology
            </h3>
            <p className="text-gray-800 leading-relaxed">
              Industry Veterans: Founded by alumni of Binance (the world's largest crypto
              exchange) and OpenAI (pioneers in AI innovation), blending deep financial
              expertise with advanced AI research.
            </p>

            <h4 className="text-lg font-bold text-gray-800 pt-2">
              Proprietary AI Model:
            </h4>
            <p className="text-gray-800 leading-relaxed">
              Our AI-HedgeTrade™ Engine, enhanced on the ChatGPT-4 architecture,
              analyzes real-time on-chain data, market sentiment, and macroeconomic
              indicators, achieving an 82% annualized strategy success rate (Source: 2023
              Internal Backtesting Report).
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>💡</span> AiCrypto Mini App: Effortless Crypto Earnings
            </h3>

            <h4 className="text-gray-800 font-bold pt-1">
              Trading Power (TP):
            </h4>
            <p className="text-gray-800 leading-relaxed">
              Purchase TP to leverage our AI's decision-making capabilities for automated
              execution of low-risk arbitrage, trend-following, and volatility strategies—no
              manual trading required.
            </p>

            <h4 className="text-gray-800 font-bold pt-2">
              Transparent Earnings:
            </h4>
            <ul className="space-y-1 text-gray-800">
              <li className="flex items-start gap-2">
                <span>✅</span> Daily profits settled directly to your blockchain wallet.
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span> Full transparency with publicly accessible transaction histories.
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span> Third-party audit-ready interfaces (e.g., CertiK).
              </li>
            </ul>

            <div className="flex items-center gap-2 text-gray-800 pt-1">
              <span>🤝</span> Shared Growth Ecosystem
            </div>

            <h4 className="text-lg font-bold text-gray-800 pt-4">
              Referral Rewards:
            </h4>

            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-2 text-gray-800">
                  <span className="text-orange-500">🔸</span> Direct Rewards:
                </div>
                <p className="text-gray-800 pl-6">
                  Earn $15 when your invite invests $50–$1,000. If they invest $1,001 or more, you earn 5% of that deposit instantly.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-800">
                  <span className="text-orange-500">🔸</span> Level Income:
                </div>
                <p className="text-gray-800 pl-6">
                  Receive a one-time 2% income from every new investment generated within your network, up to 10 levels deep.
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-1">
              <p className="text-gray-800">
                Community-Driven:
              </p>
              <p className="text-gray-800 leading-relaxed">
                Join our official Telegram channel (<a href="https://t.me/News_AiCrypto" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@News_AiCrypto</a>) for exclusive market
                insights, strategy whitepapers, and regulatory updates.
              </p>
            </div>

            <h4 className="text-lg font-bold text-gray-800 pt-4">
              Security & Trust
            </h4>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-800">
                  <span>🔒</span> Asset Custody:
                </div>
                <p className="text-gray-800 leading-relaxed">
                  User funds are held with PrimeTrust, an FDIC-insured U.S. custodian, using
                  HSM cold storage for private keys.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-800">
                  <span>🛡️</span> Military-Grade Encryption:
                </div>
                <p className="text-gray-800 leading-relaxed">
                  End-to-end SOC-2 Type II compliant infrastructure with TLS 1.3 and AES-256
                  encryption.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-800">
                  <span>🌐</span> Accountability:
                </div>
                <p className="text-gray-800 leading-relaxed">
                  Quarterly third-party audits and an open-channel Community Oversight Board
                  for operational transparency.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </MobileLayout>
  );
}


