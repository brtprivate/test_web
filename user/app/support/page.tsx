/**
 * Support Page
 * Customer support and help information
 */

'use client';

import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAlerts } from '@/hooks/useAlerts';
import AlertStack from '@/components/ui/AlertStack';

export default function SupportPage() {
  const { alerts, addAlert, removeAlert } = useAlerts({ autoDismissMs: 4000 });
  const supportMethods = [
    {
      title: 'Telegram Support',
      description: 'Get instant help via Telegram',
      icon: '💬',
      action: 'Open Telegram',
      onClick: () => {
        // Replace with your Telegram support link
        window.open('https://t.me/your_support_bot', '_blank');
      },
    },
    {
      title: 'Email Support',
      description: 'Send us an email',
      icon: '📧',
      action: 'Send Email',
      onClick: () => {
        window.location.href = 'mailto:support@aicryptobot.com';
      },
    },
    {
      title: 'FAQ',
      description: 'Frequently asked questions',
      icon: '❓',
      action: 'View FAQ',
      onClick: () => {
        console.info('ℹ️ FAQ section requested');
        addAlert({
          type: 'info',
          message: 'FAQ section coming soon!',
        });
      },
    },
  ];

  const faqs = [
    {
      question: 'How do I deposit funds?',
      answer: 'Go to the Wallet page and click on Deposit. Follow the instructions to add funds to your account.',
    },
    {
      question: 'What is the minimum withdrawal amount?',
      answer: 'The minimum withdrawal amount is $10 USDT.',
    },
    {
      question: 'How long does withdrawal take?',
      answer: 'Withdrawal requests are processed within 24-48 hours.',
    },
    {
      question: 'How do I invite friends?',
      answer: 'Go to the Friends page, copy your referral code, and share it with your friends.',
    },
    {
      question: 'What investment plans are available?',
      answer: 'Check the Investments page to see all available investment plans with their ROI percentages.',
    },
  ];

  return (
    <MobileLayout showBottomNav={false} showHeaderContent={true}>
      <AlertStack alerts={alerts} onClose={removeAlert} />
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Support Center
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            We're here to help you
          </p>
        </div>

        {/* Contact Methods */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <div className="space-y-3">
            {supportMethods.map((method, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">{method.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">
                      {method.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {method.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={method.onClick}
                  className="ml-2 flex-shrink-0"
                >
                  {method.action}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* FAQ Section */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Quick Links
          </h2>
          <div className="space-y-2">
            <Button
              variant="outline"
              fullWidth
              size="md"
              onClick={() => (window.location.href = '/withdraw')}
            >
              Withdraw Funds
            </Button>
            <Button
              variant="outline"
              fullWidth
              size="md"
              onClick={() => (window.location.href = '/friends')}
            >
              Referral Program
            </Button>
            <Button
              variant="outline"
              fullWidth
              size="md"
              onClick={() => (window.location.href = '/introduction')}
            >
              How It Works
            </Button>
          </div>
        </Card>

        {/* Business Hours */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
            Support Hours
          </h2>
          <div className="space-y-2 text-sm sm:text-base text-gray-700">
            <div className="flex justify-between">
              <span className="font-medium">Monday - Friday:</span>
              <span>9:00 AM - 6:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Saturday:</span>
              <span>10:00 AM - 4:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Sunday:</span>
              <span>Closed</span>
            </div>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}






