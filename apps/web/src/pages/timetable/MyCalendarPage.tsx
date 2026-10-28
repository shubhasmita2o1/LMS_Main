import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { Calendar } from 'lucide-react';
import { myCalendar } from '../../lib/timetableApi';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function MyCalendarPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['timetable', 'calendar', 'me'],
    queryFn: () => myCalendar(),
  });

  const byDay: Record<number, typeof data> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const e of data) {
    const d = e.dayOfWeek ?? 0;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(e);
  }

  return (
    <AppLayout>
      <ModuleHeader
        title="My calendar"
        subtitle="Your scheduled classes for the week"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'My calendar' },
        ]}
        stats={[{ label: 'Events', value: data.length, variant: 'primary' }]}
      />
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {!isLoading && data.length === 0 && (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No classes on your calendar yet</p>
        </div>
      )}
      <div className="space-y-3">
        {DAYS.map((name, i) =>
          (byDay[i] || []).length ? (
            <div key={name} className="bg-white rounded-2xl border shadow-2xs">
              <div className="px-4 py-2 border-b text-xs font-bold text-slate-700">{name}</div>
              <ul className="divide-y">
                {(byDay[i] || []).map((e) => (
                  <li key={e.id} className="px-4 py-3 flex justify-between gap-3 text-sm">
                    <div>
                      <div className="font-bold text-slate-900">{e.title}</div>
                      <div className="text-xs text-slate-500">
                        {e.roomName || 'Room TBA'}
                        {e.facultyName ? ` · ${e.facultyName}` : ''}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-indigo-700 whitespace-nowrap">
                      {e.startTime}–{e.endTime}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </div>
    </AppLayout>
  );
}

export default MyCalendarPage;
