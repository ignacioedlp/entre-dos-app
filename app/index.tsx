import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, token } = useAuth();

  // The profile and token are stored separately. A profile on its own is not
  // an authenticated session and would otherwise route into the app while all
  // API calls are sent without Authorization.
  if (!user || !token) return <Redirect href="/(auth)/welcome" />;
  if (!user.coupleId) return <Redirect href="/(auth)/link" />;
  if (!user.onboardingCompleted) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(app)/" />;
}
