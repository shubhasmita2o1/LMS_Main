import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { Calendar, Plus, AlertTriangle } from 'lucide-react';
import { listEntries, listRooms, createRoom, createEntry, cancelEntry } from '../../lib/timetableApi';
import { useAuthStore } from '../../stores/authStore';
import type { DayOfWeek } from '@university-lms/shared';
import { api } from '../../lib/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TimetablePage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = (user?.roles || []).some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin'].includes(r)
  );

  const [formOpen, setFormOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [form, setForm] = useState({
    courseId: '',
    facultyId: '',
    roomId: '',
    dayOfWeek: 1 as DayOfWeek,
    startTime: '09:00',
    endTime: '10:00',
    force: false,
  });
  const [roomForm, setRoomForm] = useState({ name: '', code: '', capacity: 40, roomType: 'classroom' as const });

  const entriesQ = useQuery({
    queryKey: ['timetable', 'entries'],
    queryFn: () => listEntries({ limit: 200 }),
  });
  const roomsQ = useQuery({
    queryKey: ['timetable', 'rooms'],
    queryFn: () => listRooms({ limit: 100 }),
  });
  const coursesQ = useQuery({
    queryKey: ['courses', 'mini'],
    queryFn: async () => {
      const { data } = await api.get('/courses', { params: { limit: 100 } });
      return (data.data?.items || data.data || []) as Array<{ id: string; name: string; code: string }>;
    },
  });
  const facultyQ = useQuery({
    queryKey: ['faculty', 'mini'],
    queryFn: async () => {
      const { data } = await api.get('/faculty', { params: { limit: 100 } });
      return (data.data?.items || data.data || []) as Array<{
        id: string;
        firstName?: string;
        lastName?: string;
        employeeId?: string;
      }>;
    },
    enabled: canManage,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createEntry({
        courseId: form.courseId,
        facultyId: form.facultyId,
        roomId: form.roomId || null,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        force: form.force,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
      setFormOpen(false);
      setConflicts([]);
      setForm((f) => ({ ...f, force: false }));
    },
    onError: (err: any) => {
      const list = err?.response?.data?.error?.details?.conflicts;
      if (Array.isArray(list)) {
        setConflicts(list.map((c: any) => c.message));
      }
    },
  });

  const roomMut = useMutation({
    mutationFn: () => createRoom(roomForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable', 'rooms'] });
      setRoomOpen(false);
      setRoomForm({ name: '', code: '', capacity: 40, roomType: 'classroom' });
    },
  });

  const cancelMut = useMutation({
    mutationFn: cancelEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  });

  const byDay = useMemo(() => {
    const map: Record<number, typeof entriesQ.data extends infer T ? any[] : any[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    for (const e of entriesQ.data?.items || []) {
      if (!map[e.dayOfWeek]) map[e.dayOfWeek] = [];
      map[e.dayOfWeek].push(e);
    }
    return map;
  }, [entriesQ.data]);

  return (
    <AppLayout>
      <ModuleHeader
        title="Timetable"
        subtitle="Weekly class schedule, rooms, and conflict-aware slots"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Timetable' }]}
        stats={[
          { label: 'Slots', value: entriesQ.data?.total ?? 0, variant: 'primary' },
          { label: 'Rooms', value: roomsQ.data?.total ?? 0, variant: 'default' },
        ]}
        primaryAction={
          canManage
            ? {
                label: 'Add slot',
                onClick: () => setFormOpen(true),
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
        secondaryAction={
          canManage
            ? {
                label: 'Add room',
                onClick: () => setRoomOpen(true),
              }
            : undefined
        }
      />

      {roomOpen && canManage && (
        <form
          className="mb-4 bg-white rounded-2xl border p-4 space-y-2 shadow-2xs"
          onSubmit={(e) => {
            e.preventDefault();
            roomMut.mutate();
          }}
        >
          <h3 className="text-sm font-bold">New room</h3>
          <div className="grid sm:grid-cols-4 gap-2">
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Name"
              value={roomForm.name}
              onChange={(e) => setRoomForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Code"
              value={roomForm.code}
              onChange={(e) => setRoomForm((f) => ({ ...f, code: e.target.value }))}
              required
            />
            <input
              type="number"
              className="rounded-xl border px-3 py-2 text-sm"
              value={roomForm.capacity}
              onChange={(e) => setRoomForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
            />
            <button type="submit" className="rounded-xl bg-indigo-600 text-white text-sm font-bold px-3">
              Save room
            </button>
          </div>
        </form>
      )}

      {formOpen && canManage && (
        <form
          className="mb-4 bg-white rounded-2xl border p-4 space-y-3 shadow-2xs"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <h3 className="text-sm font-bold">Schedule class</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              required
            >
              <option value="">Course</option>
              {(coursesQ.data || []).map((c: any) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={form.facultyId}
              onChange={(e) => setForm((f) => ({ ...f, facultyId: e.target.value }))}
              required
            >
              <option value="">Faculty</option>
              {(facultyQ.data || []).map((f: any) => (
                <option key={f.id || f._id} value={f.id || f._id}>
                  {[f.firstName, f.lastName].filter(Boolean).join(' ') || f.employeeId || f.id}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={form.roomId}
              onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
            >
              <option value="">Room (optional)</option>
              {(roomsQ.data?.items || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={form.dayOfWeek}
              onChange={(e) =>
                setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) as DayOfWeek }))
              }
            >
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="time"
              className="rounded-xl border px-3 py-2 text-sm"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            />
            <input
              type="time"
              className="rounded-xl border px-3 py-2 text-sm"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            />
          </div>
          {conflicts.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Conflicts
              </div>
              {conflicts.map((c) => (
                <div key={c}>{c}</div>
              ))}
              <label className="flex items-center gap-2 mt-2 font-semibold">
                <input
                  type="checkbox"
                  checked={form.force}
                  onChange={(e) => setForm((f) => ({ ...f, force: e.target.checked }))}
                />
                Force save anyway (admin)
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold"
              disabled={createMut.isPending}
            >
              Save slot
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl border text-sm font-semibold"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-7 gap-2">
        {DAYS.map((day, i) => (
          <div key={day} className="bg-white rounded-2xl border border-slate-200 min-h-[160px] shadow-2xs">
            <div className="px-2 py-2 border-b text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {day}
            </div>
            <div className="p-2 space-y-1.5">
              {(byDay[i] || []).map((e: any) => (
                <div
                  key={e.id}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] ${
                    e.status === 'cancelled'
                      ? 'bg-slate-50 text-slate-400 line-through'
                      : e.status === 'substituted'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-indigo-50 border-indigo-100'
                  }`}
                >
                  <div className="font-bold text-slate-800">
                    {e.startTime}–{e.endTime}
                  </div>
                  <div className="text-slate-600 truncate">{e.courseCode || e.courseName}</div>
                  <div className="text-slate-400 truncate">{e.roomName || 'No room'}</div>
                  {canManage && e.status === 'scheduled' && (
                    <button
                      type="button"
                      className="text-[10px] font-bold text-rose-600 mt-0.5"
                      onClick={() => cancelMut.mutate(e.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

export default TimetablePage;
