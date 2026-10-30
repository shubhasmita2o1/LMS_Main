import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import {
  listTickets, createTicket, listMessages, addMessage, updateTicket, escalateTicket,
} from '../../lib/supportApi';
import type {
  SupportTicketPublic, SupportMessagePublic, TicketCategory, TicketPriority,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { Plus } from 'lucide-react';

export function HelpSupportPage() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles || [];
  const isStaff = roles.some((r) => ['tenant_admin', 'university_admin', 'staff', 'super_admin', 'faculty'].includes(r));

  const [tickets, setTickets] = useState<SupportTicketPublic[]>([]);
  const [selected, setSelected] = useState<SupportTicketPublic | null>(null);
  const [messages, setMessages] = useState<SupportMessagePublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [form, setForm] = useState({
    category: 'technical' as TicketCategory, subject: '', description: '', priority: 'medium' as TicketPriority,
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTickets((await listTickets()).items); }
    catch (e: any) { setError(e?.response?.data?.message || e.message || 'Failed to load tickets'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTicket = async (t: SupportTicketPublic) => {
    setSelected(t);
    try {
      const data = await listMessages(t.id);
      setMessages(data.items);
      setSelected(data.ticket);
    } catch (e: any) { alert(e?.response?.data?.message || e.message); }
  };

  const columns: Column<SupportTicketPublic>[] = [
    { key: 'subject', header: 'Subject', render: (t) => (
      <div><span className="font-bold text-slate-900 block">{t.subject}</span>
      <span className="text-xs text-slate-500 capitalize">{t.category.replace('_', ' ')} · L{t.escalationLevel}</span></div>
    )},
    { key: 'priority', header: 'Priority', render: (t) => (
      <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${t.priority === 'urgent' ? 'bg-red-100 text-red-800' : t.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{t.priority}</span>
    )},
    { key: 'status', header: 'Status', render: (t) => (
      <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-slate-100">{t.status.replace('_', ' ')}</span>
    )},
    { key: 'actions', header: '', render: (t) => (
      <button type="button" className="text-xs font-semibold text-sky-700 hover:underline" onClick={() => openTicket(t)}>Open</button>
    )},
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <ModuleHeader title="Support & Helpdesk" subtitle="Tickets, grievances and counseling requests" />
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#165239] text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> New ticket
          </button>
        </div>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>}
        {loading ? <div className="text-sm text-slate-500">Loading…</div> : <DataTable columns={columns} data={tickets} keyExtractor={(t) => t.id} />}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-bold">{selected.subject}</h3>
                <p className="text-xs text-slate-500 capitalize">{selected.category.replace('_', ' ')} · {selected.status.replace('_', ' ')} · {selected.priority}</p>
              </div>
              <button type="button" className="text-sm text-slate-500" onClick={() => setSelected(null)}>Close</button>
            </div>
            {isStaff && (
              <div className="flex flex-wrap gap-2">
                {(['open', 'in_progress', 'waiting_student', 'resolved', 'closed'] as const).map((s) => (
                  <button key={s} type="button" className="text-xs px-2 py-1 rounded border capitalize"
                    onClick={async () => { const t = await updateTicket(selected.id, { status: s }); setSelected(t); load(); }}>{s.replace('_', ' ')}</button>
                ))}
                <button type="button" className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-800"
                  onClick={async () => { const t = await escalateTicket(selected.id, 'Escalated'); setSelected(t); setMessages((await listMessages(selected.id)).items); load(); }}>Escalate</button>
              </div>
            )}
            <div className="space-y-3 border rounded-xl p-3 bg-slate-50 max-h-80 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className={`text-sm rounded-lg px-3 py-2 ${m.isInternalNote ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-200'}`}>
                  <div className="text-xs text-slate-500 mb-1">{m.isInternalNote ? 'Internal note' : 'Message'} · {new Date(m.createdAt).toLocaleString()}</div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]" placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
              {isStaff && (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note
                </label>
              )}
              <button type="button" className="px-3 py-2 text-sm rounded-lg bg-[#165239] text-white font-semibold" onClick={async () => {
                if (!reply.trim()) return;
                try {
                  await addMessage(selected.id, reply, internal);
                  setReply(''); setInternal(false);
                  const data = await listMessages(selected.id);
                  setMessages(data.items); setSelected(data.ticket); load();
                } catch (e: any) { alert(e?.response?.data?.message || e.message); }
              }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-3">
            <h3 className="text-lg font-bold">New support ticket</h3>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}>
              {(['academic', 'technical', 'hostel', 'finance_query', 'grievance', 'counseling', 'other'] as TicketCategory[]).map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" className="text-sm px-3" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="button" className="px-3 py-2 text-sm rounded-lg bg-[#165239] text-white font-semibold" onClick={async () => {
                try { await createTicket(form); setShowCreate(false); load(); }
                catch (e: any) { alert(e?.response?.data?.message || e.message); }
              }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
