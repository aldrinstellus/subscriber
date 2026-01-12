import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from './AuthProvider';
import { userApi } from '../services/api';

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !isSignedIn) {
        setChecking(false);
        return;
      }

      // Skip check if already on onboarding page
      if (location.pathname === '/onboarding') {
        setChecking(false);
        return;
      }

      try {
        const response = await userApi.getMe();
        const user = response.data.data;

        // Redirect to onboarding if not completed or user doesn't exist yet
        if (!user || !user.onboardingCompleted) {
          navigate('/onboarding');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // On error, redirect to onboarding (safer default for new users)
        navigate('/onboarding');
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [isLoaded, isSignedIn, navigate, location.pathname]);

  if (checking && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return <>{children}</>;
}
