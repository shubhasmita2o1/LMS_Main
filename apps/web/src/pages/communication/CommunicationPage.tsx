import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_ANNOUNCEMENTS, type Announcement } from '../../data/mockData';
import {
  Plus,
  X,
} from 'lucide-react';

export function CommunicationPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic' as Announcement['category'],
    priority: 'Normal' as Announcement['priority'],
    targetAudience: 'All Campus' as Announcement['targetAudience'],
    content: '',
  });

  const columns: Column<Announcement>[] = [
    {
      key: 'title',
      header: 'Announcement Subject',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block">{a.title}</span>
          <span className="text-xs text-slate-400 mt-0.5 block">{a.author}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (a) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {a.category}
        </span>
      ),
    },
    {
      key: 'targetAudience',
      header: 'Recipient Scope',
      sortable: true,
      render: (a) => (
        <span className="text-xs font-medium text-slate-700">{a.targetAudience}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (a) => (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            a.priority === 'Urgent'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : a.priority === 'High'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {a.priority}
        </span>
      ),
    },
    {
      key: 'publishedAt',
      header: 'Published At',
      sortable: true,
      render: (a) => <span className="text-xs text-slate-500">{a.publishedAt}</span>,
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnc: Announcement = {
      id: `anc-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      publishedAt: 'Just now',
      author: 'Office of the Vice Chancellor',
      priority: formData.priority,
      targetAudience: formData.targetAudience,
      content: formData.content,
    };
    setAnnouncements([newAnc, ...announcements]);
    setIsCreateOpen(false);
  };

  const filtered = announcements.filter((a) => {
    if (categoryFilter === 'All') return true;
    return a.category === categoryFilter;
  });

  return (
    <AppLayout>
      <ModuleHeader
        title="Campus Communication & Bulletins Hub"
        subtitle="Broadcast campus-wide official circulars, emergency announcements, and targeted student notices"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Communication' }]}
        stats={[
          { label: 'Active Bulletins', value: announcements.length, variant: 'primary' },
          { label: 'High Priority', value: 2, variant: 'danger' },
          { label: 'Delivery Rate', value: '100% In-App', variant: 'success' },
        ]}
        primaryAction={{
          label: 'Broadcast Announcement',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Search circulars by subject, keyword, or author..."
        exportTitle="campus_announcements"
        onRowClick={(a) => {
          setSelectedAnnouncement(a);
          setIsDetailOpen(true);
        }}
        filterComponent={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Category:</span>
            {['All', 'Academic', 'Exam', 'Placement'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  categoryFilter === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        }
      />

      {/* Announcement Detail Drawer */}
      {selectedAnnouncement && (
        <DetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedAnnouncement.title}
          subtitle={`By ${selectedAnnouncement.author} • ${selectedAnnouncement.publishedAt}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800">
              {selectedAnnouncement.category}
            </span>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Audience:</span>
                <strong className="text-slate-900">{selectedAnnouncement.targetAudience}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Priority:</span>
                <strong className="text-slate-900">{selectedAnnouncement.priority}</strong>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Official Circular Text
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedAnnouncement.content}
              </p>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Broadcast Announcement Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Broadcast Campus Circular</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Headline</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Schedule Revision for Mid-Term Exams"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Exam">Exam Schedule</option>
                    <option value="Placement">Placement</option>
                    <option value="Emergency">Emergency Alert</option>
                    <option value="Sports / Events">Sports / Events</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent Broadcast</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="All Campus">All Campus (Students, Faculty, Staff)</option>
                  <option value="Undergraduates">Undergraduates Only</option>
                  <option value="Faculty">Faculty & Department Chairs Only</option>
                  <option value="Postgraduates">Postgraduates & Researchers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Circular Content</label>
                <textarea
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Detailed notification message body..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20"
                >
                  Dispatch Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
export default CommunicationPage;
