import type { ReactNode } from 'react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

interface FeatureProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally render children based on tenant feature flag.
 * Example: <Feature flag="advanced_analytics">...</Feature>
 */
export function Feature({ flag, children, fallback = null }: FeatureProps) {
  const { enabled, loading } = useFeatureFlag(flag);

  if (loading) return null;
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
}
