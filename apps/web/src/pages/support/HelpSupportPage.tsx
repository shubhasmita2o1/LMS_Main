import { useState, useMemo } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  MessageSquare,
  FileText,
  HelpCircle,
  PhoneCall,
  Send,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DetailDrawer } from '../../components/common/DetailDrawer';
import { MOCK_TICKETS, SupportTicket } from '../../data/mockData';

// Extended realistic ticket data
const EXTENDED_TICKETS: (SupportTicket & {
  description?: string;
  department?: string;
  comments?: { id: string; author: string; role: string; text: string; time: string }[];
})[] = [
  {
    ...MOCK_TICKETS[0],
    department: 'LMS Infrastructure Engineering',
    description:
      'During the OS Virtual Lab session on Operating System Process Scheduling, Docker containers spun up on workstation cluster Node-04 fail to bind port 8080 due to an orphaned socket error. Students in Section A are unable to submit their output logs.',
    comments: [
      {
        id: 'c1',
        author: 'Jordan Hayes',
        role: 'Student',
        text: 'Issue reproduces consistently on all 4 machines in Row C of Lab 304.',
        time: 'Today 09:15 AM',
      },
      {
        id: 'c2',
        author: 'Marcus Young',
        role: 'LMS DevOps',
        text: 'Investigating Kubernetes port-forwarding ingress rule. Resetting daemon socket.',
        time: 'Today 10:20 AM',
      },
    ],
  },
  {
    ...MOCK_TICKETS[1],
    department: 'Bursar & Student Accounts',
    description:
      'Student made a wire transfer payment of $2,400 for Fall 2026 Installment #2 on Oct 10th via Chase Bank. Bank confirmation code is TXN-998812, but portal still lists the installment as pending balance.',
    comments: [
      {
        id: 'c3',
        author: 'Chloe Tremblay',
        role: 'Student',
        text: 'Attached bank wire transfer receipt PDF showing funds debited from my account.',
        time: 'Yesterday 02:45 PM',
      },
      {
        id: 'c4',
        author: 'Finance Desk',
        role: 'Bursar',
        text: 'ACH clearing settlement verified. Updating ledger to reflect payment clearance.',
        time: 'Yesterday 04:10 PM',
      },
    ],
  },
  {
    ...MOCK_TICKETS[2],
    department: 'Examination Office',
    description:
      'Formal student petition requesting moderation review for Question 4B in the Continuous Assessment #2 test for CS303 Applied Machine Learning. Question prompt had an ambiguous matrix dimension specification.',
    comments: [
      {
        id: 'c5',
        author: 'Dr. Sarah Jenkins',
        role: 'Exam Controller',
        text: 'Board of Examiners reviewed question phrasing. 2 bonus grace marks awarded to all candidate papers.',
        time: 'Oct 11 04:30 PM',
      },
    ],
  },
  {
    id: 'tkt-1304',
    ticketNo: 'HD-9845',
    subject: 'Hostel Wi-Fi MAC Address Whitelist Registration',
    category: 'Network Access',
    priority: 'Low',
    status: 'Open',
    creatorName: 'Aarav Patel',
    creatorRole: 'Student',
    assignedTo: 'Campus IT Network Operations',
    createdAt: '2026-10-15 11:05 AM',
    slaDue: '22 hours remaining',
    department: 'Campus IT Network Operations',
    description: 'New laptop hardware replacement MAC address: 3C:52:82:11:9A:F0 needs 802.1X campus network authentication profile.',
    comments: [],
  },
  {
    id: 'tkt-1305',
    ticketNo: 'HD-9848',
    subject: 'Emergency Classroom Projector Replacement in Hall B-102',
    category: 'Classroom Tech',
    priority: 'Urgent',
    status: 'In Progress',
    creatorName: 'Prof. Elena Rostova',
    creatorRole: 'Faculty',
    assignedTo: 'Audio-Visual Tech Support',
    createdAt: '2026-10-15 10:50 AM',
    slaDue: '45 mins remaining',
    department: 'Facilities & AV Services',
    description: 'Projector bulb burned out before upcoming CS301 Database Systems lecture scheduled at 11:30 AM.',
    comments: [
      {
        id: 'c6',
        author: 'AV Tech Team',
        role: 'Technician',
        text: 'Technician dispatched on-site with replacement 4K laser unit.',
        time: 'Today 11:00 AM',
      },
    ],
  },
];

const KNOWLEDGE_BASE = [
  {
    category: 'LMS & Virtual Labs',
    questions: [
      {
        q: 'How do I submit practical code assignments in the Virtual Lab?',
        a: 'Navigate to Practical & Virtual Labs from the sidebar, select your course experiment, and either write your implementation directly in the web IDE or upload your repository archive. Ensure all automated unit tests pass before pressing Final Submission.',
      },
      {
        q: 'Why am I seeing "Container Port Already Bound" in practical sessions?',
        a: 'This typically occurs if a previous session was closed without halting running background daemons. Click "Reset Sandbox" from the top right of the lab terminal to spin up a clean isolated environment.',
      },
    ],
  },
  {
    category: 'Examinations & Hall Tickets',
    questions: [
      {
        q: 'What is the attendance threshold to download an examination Hall Ticket?',
        a: 'As per university academic regulations, students must maintain a minimum of 75% aggregate attendance in each registered theory and laboratory course. Shortage cases must submit Dean-approved medical certificates at least 7 days prior.',
      },
      {
        q: 'How do I apply for re-evaluation or paper review after results release?',
        a: 'Within 7 calendar days of grade publication on the Results & Gradebook portal, click "Request Review" next to the course letter grade and pay the nominal statutory processing fee.',
      },
    ],
  },
  {
    category: 'Finance & Payments',
    questions: [
      {
        q: 'Where do I download my official stamped tax and fee receipt?',
        a: 'Visit the Finance & Fees portal, locate the cleared invoice under Payment History, and click "Print Official Receipt". All receipts include a verifiable cryptographic QR seal for bank educational loan audit.',
      },
      {
        q: 'Can tuition installments be paid through third-party education loan portals?',
        a: 'Yes. Select "NEFT/RTGS Transfer" on the invoice screen to view your unique student virtual account number (VAN) for direct wire remittance by your loan provider.',
      },
    ],
  },
];

export function HelpSupportPage() {
  const [tickets, setTickets] = useState(EXTENDED_TICKETS);
  const [activeTab, setActiveTab] = useState<'tickets' | 'kb' | 'emergency'>('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<(typeof EXTENDED_TICKETS)[0] | null>(null);

  // New Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState<{
    subject: string;
    category: SupportTicket['category'];
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    description: string;
  }>({
    subject: '',
    category: 'LMS Access',
    priority: 'Medium',
    description: '',
  });

  // New Comment state inside detail drawer
  const [commentText, setCommentText] = useState('');

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        searchTerm === '' ||
        t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim()) return;

    const created: (typeof EXTENDED_TICKETS)[0] = {
      id: `tkt-${Date.now()}`,
      ticketNo: `HD-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'Open',
      creatorName: 'Demo User (Session)',
      creatorRole: 'Faculty / Student',
      assignedTo: 'Helpdesk Central Queue',
      createdAt: 'Just now',
      slaDue: '24 hours remaining',
      department: 'Central Academic Support',
      description: newTicket.description,
      comments: [],
    };

    setTickets([created, ...tickets]);
    setIsCreateModalOpen(false);
    setNewTicket({ subject: '', category: 'LMS Access', priority: 'Medium', description: '' });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;

    const newComment = {
      id: `c_${Date.now()}`,
      author: 'You (Current User)',
      role: 'Staff / Student',
      text: commentText,
      time: 'Just now',
    };

    const updated = {
      ...selectedTicket,
      comments: [...(selectedTicket.comments || []), newComment],
    };

    setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
    setCommentText('');
  };

  const handleStatusChange = (newStatus: 'Open' | 'In Progress' | 'Resolved') => {
    if (!selectedTicket) return;
    const updated = { ...selectedTicket, status: newStatus };
    setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
  };

  const columns: Column<(typeof EXTENDED_TICKETS)[0]>[] = [
    {
      key: 'ticketNo',
      header: 'Ticket ID',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
          {row.ticketNo}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Category',
      render: (row) => (
        <div className="max-w-md">
          <p
            onClick={() => setSelectedTicket(row)}
            className="text-xs font-bold text-slate-900 hover:text-primary-600 cursor-pointer line-clamp-1"
          >
            {row.subject}
          </p>
          <span className="inline-block mt-0.5 text-[11px] text-slate-500 font-medium">
            Category: {row.category}
          </span>
        </div>
      ),
    },
    {
      key: 'creator',
      header: 'Requester',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{row.creatorName}</p>
          <p className="text-[11px] text-slate-400">{row.creatorRole}</p>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned Desk',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          {row.assignedTo}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => {
        const priorityColors = {
          Urgent: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
          High: 'bg-amber-100 text-amber-800 border-amber-200',
          Medium: 'bg-sky-100 text-sky-800 border-sky-200',
          Low: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${
              priorityColors[row.priority as keyof typeof priorityColors] || priorityColors.Low
            }`}
          >
            {row.priority}
          </span>
        );
      },
    },
    {
      key: 'slaDue',
      header: 'SLA Window',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={
              row.status === 'Resolved'
                ? 'text-emerald-600 font-medium'
                : 'text-amber-700 font-semibold'
            }
          >
            {row.slaDue}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const statusColors = {
          Open: 'bg-amber-50 text-amber-700 border-amber-200',
          'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
          Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
              statusColors[row.status as keyof typeof statusColors] || statusColors.Open
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => setSelectedTicket(row)}
          className="text-xs font-semibold text-primary-600 hover:text-primary-800 hover:underline"
        >
          View Ticket
        </button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <ModuleHeader
          title="Campus Helpdesk & Grievance Redressal"
          subtitle="Submit IT service requests, dispute fee or grading discrepancies, track SLA countdowns, and explore institutional self-service guides."
          breadcrumbs={[
            { label: 'Campus Services' },
            { label: 'Helpdesk & Support' },
          ]}
          stats={[
            { label: 'Open Tickets', value: tickets.filter((t) => t.status !== 'Resolved').length },
            { label: 'Average Response', value: '14 mins' },
            { label: 'SLA Compliance', value: '98.4%' },
            { label: 'Knowledge Base', value: '142 Guides' },
          ]}
          primaryAction={{
            label: 'Submit Service Request',
            onClick: () => setIsCreateModalOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-1.5 flex space-x-1">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'tickets'
                ? 'bg-primary-50 text-primary-700 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            Support Tickets &amp; Grievances
          </button>
          <button
            onClick={() => setActiveTab('kb')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'kb'
                ? 'bg-primary-50 text-primary-700 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Self-Service Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'emergency'
                ? 'bg-primary-50 text-primary-700 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            Campus Emergency Helplines
          </button>
        </div>

        {/* Tab 1: Support Tickets Table */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tickets by ID, subject, requester..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <DataTable
                data={filteredTickets}
                columns={columns}
                keyExtractor={(row) => row.id}
                exportTitle="University_Helpdesk_Tickets"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Knowledge Base */}
        {activeTab === 'kb' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {KNOWLEDGE_BASE.map((sec, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-primary-700 font-bold text-sm pb-2 border-b border-slate-100">
                  <FileText className="w-4 h-4" />
                  {sec.category}
                </div>
                <div className="space-y-4">
                  {sec.questions.map((faq, fIdx) => (
                    <div key={fIdx} className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-900 flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                        {faq.q}
                      </h4>
                      <p className="text-xs text-slate-600 pl-5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Emergency Helplines */}
        {activeTab === 'emergency' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                24/7 Rapid Response
              </span>
              <h4 className="text-sm font-bold text-slate-900">Campus Security &amp; Quick Dispatch</h4>
              <p className="text-xs text-slate-500">Security Gatehouse &amp; Patrol Units</p>
              <p className="text-base font-bold text-rose-600 font-mono">+1 (555) 911-CAMP</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                Health Center
              </span>
              <h4 className="text-sm font-bold text-slate-900">Chief Medical Officer &amp; Ambulance</h4>
              <p className="text-xs text-slate-500">Infirmary Building A, Ground Floor</p>
              <p className="text-base font-bold text-primary-700 font-mono">+1 (555) 234-MED1</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Wellbeing
              </span>
              <h4 className="text-sm font-bold text-slate-900">Student Counseling &amp; Mental Health</h4>
              <p className="text-xs text-slate-500">Confidential Toll-free Guidance</p>
              <p className="text-base font-bold text-emerald-700 font-mono">+1 (800) 555-WELL</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                Ombudsman
              </span>
              <h4 className="text-sm font-bold text-slate-900">Anti-Ragging &amp; Ethics Grievance</h4>
              <p className="text-xs text-slate-500">Statutory Compliance Board</p>
              <p className="text-base font-bold text-amber-700 font-mono">+1 (555) 438-SAFE</p>
            </div>
          </div>
        )}

        {/* Submit Ticket Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LifeBuoy className="w-5 h-5 text-primary-600" />
                  <h3 className="text-base font-bold text-slate-900">Submit Service Request</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Request Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as SupportTicket['category'] })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="LMS Access">LMS Access &amp; Virtual Labs</option>
                    <option value="Fee Discrepancy">Fee Receipt &amp; Bursar Discrepancy</option>
                    <option value="Grade Correction">Grade Correction &amp; Exam Paper Review</option>
                    <option value="Network Access">Hostel Wi-Fi &amp; Network Whitelisting</option>
                    <option value="Classroom Tech">Classroom Audio-Visual Tech</option>
                    <option value="Library">Library Book Loan &amp; Digital Repository</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="Low">Low - General query</option>
                    <option value="Medium">Medium - Regular support</option>
                    <option value="High">High - Impairing academic progress</option>
                    <option value="Urgent">Urgent - Exam or live class blocking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject Summary
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of the problem..."
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Detailed Narrative &amp; Steps to Reproduce
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide full context, machine numbers, or transaction IDs..."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 shadow-xs"
                  >
                    Dispatch Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detailed Ticket Slide-over Drawer */}
        {selectedTicket && (
          <DetailDrawer
            isOpen={true}
            onClose={() => setSelectedTicket(null)}
            title={`Ticket ${selectedTicket.ticketNo}: ${selectedTicket.subject}`}
            subtitle={`Created by ${selectedTicket.creatorName} (${selectedTicket.creatorRole}) • ${selectedTicket.createdAt}`}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold block mb-0.5">
                    Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => handleStatusChange('Open')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedTicket.status === 'Open'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleStatusChange('In Progress')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedTicket.status === 'In Progress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange('Resolved')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedTicket.status === 'Resolved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Resolved
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold block mb-0.5">
                    Priority
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {selectedTicket.priority} Priority
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold block mb-0.5">
                    Assigned Desk
                  </span>
                  <span className="font-medium text-slate-800">{selectedTicket.assignedTo}</span>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold block mb-0.5">
                    SLA Window
                  </span>
                  <span className="font-semibold text-amber-700">{selectedTicket.slaDue}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Problem Description
                </h4>
                <p className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedTicket.description || 'No additional narrative provided.'}
                </p>
              </div>

              {/* Discussion & Resolution Thread */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary-600" />
                  Ticket Discussion &amp; Updates ({(selectedTicket.comments || []).length})
                </h4>
                <div className="space-y-3 mb-4">
                  {(selectedTicket.comments || []).map((cmt) => (
                    <div
                      key={cmt.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {cmt.author}{' '}
                          <span className="font-normal text-slate-400">({cmt.role})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{cmt.time}</span>
                      </div>
                      <p className="text-slate-700">{cmt.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type an update or resolution note..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reply
                  </button>
                </form>
              </div>
            </div>
          </DetailDrawer>
        )}
      </div>
    </AppLayout>
  );
}
