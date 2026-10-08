import type { ReactNode } from 'react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

export interface FeatureProps {
  flag: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditional feature rendering driven by tenant plan feature flags.
 *
 * Example:
 *   <Feature flag="advanced_analytics" fallback={<UpgradeNotice />}>
 *     <AnalyticsCharts />
 *   </Feature>
 */
export function Feature({ flag, fallback = null, children }: FeatureProps) {
  const { enabled, loading } = useFeatureFlag(flag);

  if (loading) {
    return null;
  }

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default Feature;
