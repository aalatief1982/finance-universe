import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getTemplateStats, TemplateStats } from '@/services/templateService';
import { useUser } from '@/context/UserContext';

const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="bg-card rounded-lg p-4 shadow-sm border border-border/50">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold mt-1">{value}</div>
  </div>
);

const ringSize = 72;
const ringStroke = 8;

const TemplateStatsSection: React.FC = () => {
  const { user } = useUser();
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!user) return;
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, range]);

  useEffect(() => {
    const onTemplateUpdate = () => fetch();
    const onFocus = () => fetch();
    window.addEventListener('templateBankUpdated', onTemplateUpdate as EventListener);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('templateBankUpdated', onTemplateUpdate as EventListener);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getTemplateStats(range);
      setStats(res);
    } catch (e) {
      console.warn('Failed to fetch template stats', e);
    } finally {
      setLoading(false);
    }
  };

  // Always render the section (show debug banner when user is not available)
  // This helps confirm the section is mounted inside Settings while debugging.
  const showDevBanner = true;

  return (
    <section className="space-y-4 mt-4">
      {showDevBanner && (
        <div className="p-2 rounded-md bg-red-50 border border-red-100 text-red-700 text-sm text-center">Template Stats (dev): component mounted</div>
      )}
      <h2 className="flex items-center justify-center text-lg font-semibold">
        Template Builder — Stats
      </h2>
      <p className="text-sm text-muted-foreground text-center">Overview of template learning, coverage and efficiency</p>

      <div className="flex items-center justify-end space-x-2">
        <Button size="sm" variant="ghost" onClick={() => setRange('7d')}>7d</Button>
        <Button size="sm" variant="ghost" onClick={() => setRange('30d')}>30d</Button>
        <Button size="sm" variant="ghost" onClick={() => setRange('90d')}>90d</Button>
        <Button size="sm" onClick={fetch}>Refresh</Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading...</div>}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Templates" value={stats.totalTemplates} />
          <StatCard label="Ready" value={`${stats.readyTemplates}`} />
          <StatCard label="Learning Coverage" value={`${stats.learningCoverage.toFixed(1)}%`} />
          <StatCard label="Efficiency" value={`${stats.efficiency.toFixed(1)}%`} />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Success vs Fallback</h3>
            <div className="text-sm">Success: {stats.totalSuccess} — Fallbacks: {stats.totalFallback}</div>
            <div className="mt-3">
              {renderDonut(stats.totalSuccess, stats.totalFallback)}
            </div>
            <div className="mt-3 grid gap-2">
              {stats.mostUsed.slice(0,5).map((t, idx) => (
                <div key={t.id} className="flex items-center justify-between space-x-2">
                  <div className="truncate mr-2 text-sm">{idx+1}. {t.name}</div>
                  <div className="w-40">
                    <div className="bg-gray-200 rounded h-2 w-full overflow-hidden">
                      <div className="bg-primary h-2" style={{ width: `${Math.min(100, (t.count / (stats.mostUsed[0]?.count || 1)) * 100)}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t.count} uses</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Coverage & Efficiency</h3>
            <div className="flex items-center justify-around">
              {renderProgressRing('Efficiency', stats.efficiency, '#10b981')}
              {renderProgressRing('Learning Coverage', stats.learningCoverage, '#6366f1')}
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Top Fields</h4>
              <ul className="space-y-2">
                {stats.topFields.slice(0,8).map(f => (
                  <li key={f.fieldName} className="flex items-center justify-between">
                    <div className="text-sm truncate mr-2">{f.fieldName}</div>
                    <div className="flex items-center space-x-2 w-48">
                      <div className="bg-gray-200 rounded h-2 w-full overflow-hidden">
                        <div className="bg-secondary h-2" style={{ width: `${Math.min(100, (f.count / (stats.topFields[0]?.count || 1)) * 100)}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground">{f.count}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}

      {stats && (
        <Card className="p-4 mt-3">
          <h3 className="font-semibold mb-2">Field Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(stats.fieldStats).slice(0,8).map(s => (
              <div key={s.fieldName} className="bg-card rounded p-3 border border-border/50">
                <div className="font-medium truncate">{s.fieldName}</div>
                <div className="text-sm text-muted-foreground">Count: {s.count} • Coverage: {s.coverage.toFixed(1)}% • Avg Usage: {s.avgUsage.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

    </section>
  );
};

const renderDonut = (totalSuccess: number, totalFallback: number) => {
  const total = totalSuccess + totalFallback;
  const successPercentage = (totalSuccess / total) * 100;
  const fallbackPercentage = (totalFallback / total) * 100;

  return (
    <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
      <circle
        cx={ringSize / 2}
        cy={ringSize / 2}
        r={(ringSize - ringStroke) / 2}
        fill="none"
        stroke="#10b981"
        strokeWidth={ringStroke}
        strokeDasharray={`${successPercentage} ${100 - successPercentage}`}
        transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
      />
      <circle
        cx={ringSize / 2}
        cy={ringSize / 2}
        r={(ringSize - ringStroke) / 2}
        fill="none"
        stroke="#f87171"
        strokeWidth={ringStroke}
        strokeDasharray={`${fallbackPercentage} ${100 - fallbackPercentage}`}
        transform={`rotate(${successPercentage - 90} ${ringSize / 2} ${ringSize / 2})`}
      />
    </svg>
  );
};

const renderProgressRing = (label: string, percentage: number, color: string) => {
  const radius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={ringSize} height={ringSize}>
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={ringStroke}
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={ringStroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
        />
      </svg>
      <span className="text-xs mt-2">{label}</span>
    </div>
  );
};

export default TemplateStatsSection;
