import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../components/AuthProvider';
import { Mail, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { userApi, authApi } from '../services/api';

type Step = 'welcome' | 'connect' | 'complete';

export default function Onboarding() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check URL params for OAuth callback - compute initial state
  const oauthCallback = useMemo(() => {
    const connected = searchParams.get('connected');
    return connected === 'gmail' || connected === 'outlook' ? connected : null;
  }, [searchParams]);

  const [step, setStep] = useState<Step>(() => oauthCallback ? 'connect' : 'welcome');
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>(() =>
    oauthCallback ? [oauthCallback] : []
  );

  // Clear URL parameter after OAuth callback
  useEffect(() => {
    if (oauthCallback) {
      setSearchParams({}, { replace: true });
    }
  }, [oauthCallback, setSearchParams]);

  // Fetch existing connected accounts on mount
  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      try {
        const response = await userApi.getConnectedAccounts();
        if (response.data?.accounts) {
          const providers = response.data.accounts.map((acc: { provider: string }) => acc.provider.toLowerCase());
          setConnectedAccounts(prev => {
            const combined = [...new Set([...prev, ...providers])];
            return combined;
          });
        }
      } catch {
        // Ignore errors - user may not have any connected accounts
      }
    };
    fetchConnectedAccounts();
  }, []);

  const handleConnectGmail = async () => {
    try {
      const response = await authApi.getGmailOAuthUrl();
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to get Gmail OAuth URL:', error);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const response = await authApi.getOutlookOAuthUrl();
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to get Outlook OAuth URL:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await userApi.completeOnboarding();
      navigate('/');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      navigate('/');
    }
  };

  const firstName = user?.firstName || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        {step === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName}!</h1>
              <p className="text-gray-500 mt-2">
                Let us set up your subscription tracker. We can automatically find your subscriptions by scanning your email.
              </p>
            </div>
            <button
              onClick={() => setStep('connect')}
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'connect' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Connect Your Email</h1>
              <p className="text-gray-500 mt-2">
                We will scan for subscription receipts and automatically add them to your tracker.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConnectGmail}
                disabled={connectedAccounts.includes('gmail')}
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg font-medium hover:border-primary-300 hover:bg-primary-50 transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                <span className="w-6 h-6 flex items-center justify-center text-red-500 font-bold">G</span>
                <span className="flex-1 text-left">{connectedAccounts.includes('gmail') ? 'Gmail Connected' : 'Connect Gmail'}</span>
                {connectedAccounts.includes('gmail') && <CheckCircle className="w-5 h-5 text-green-500" />}
              </button>

              <button
                onClick={handleConnectOutlook}
                disabled={connectedAccounts.includes('outlook')}
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg font-medium hover:border-primary-300 hover:bg-primary-50 transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                <span className="w-6 h-6 flex items-center justify-center text-blue-600 font-bold">O</span>
                <span className="flex-1 text-left">{connectedAccounts.includes('outlook') ? 'Outlook Connected' : 'Connect Outlook / Hotmail'}</span>
                {connectedAccounts.includes('outlook') && <CheckCircle className="w-5 h-5 text-green-500" />}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-4">
                We only read subscription-related emails. Your data is private and secure.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStep('complete')} className="flex-1 py-2 px-4 text-gray-600 hover:text-gray-800">Skip for now</button>
                <button onClick={() => setStep('complete')} className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">Continue</button>
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">You are All Set!</h1>
              <p className="text-gray-500 mt-2">
                {connectedAccounts.length > 0
                  ? 'We are scanning your emails for subscriptions. This may take a few minutes.'
                  : 'You can manually add subscriptions or connect your email later from Settings.'}
              </p>
            </div>
            <button onClick={handleComplete} className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
              Go to Dashboard
            </button>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-8">
          {(['welcome', 'connect', 'complete'] as const).map((s) => (
            <div key={s} className={`w-2 h-2 rounded-full transition-colors ${s === step ? "bg-primary-600" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
