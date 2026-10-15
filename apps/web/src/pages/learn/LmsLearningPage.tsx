import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ModuleHeader } from '../../components/common/ModuleHeader';
import {
  Play,
  Pause,
  CheckCircle2,
  Circle,
  FileText,
  Download,
  MessageSquare,
  Send,
  Volume2,
  Maximize2,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  videoUrl?: string;
  summary: string;
}

interface UnitModule {
  unitNumber: number;
  unitTitle: string;
  lessons: Lesson[];
}

const COURSE_MODULES: UnitModule[] = [
  {
    unitNumber: 1,
    unitTitle: 'Process Lifecycle & Multiprocessor Scheduling',
    lessons: [
      { id: 'l1', title: '1.1 Process State Transitions & Inodes', duration: '24:10', isCompleted: true, summary: 'Discussion of PCB (Process Control Block), fork() system call, and CPU context switching.' },
      { id: 'l2', title: '1.2 CPU Scheduling: CFS & Multi-Level Queues', duration: '32:45', isCompleted: true, summary: 'Completely Fair Scheduler (CFS) in Linux kernel, vruntime computation, and real-time scheduling.' },
      { id: 'l3', title: '1.3 POSIX Threads & User vs Kernel Threads', duration: '28:15', isCompleted: true, summary: 'Pthread library models: 1:1, M:N hybrid thread scheduling, and kernel LWP binding.' },
    ],
  },
  {
    unitNumber: 2,
    unitTitle: 'Concurrency, Mutexes & Classical Synchronization',
    lessons: [
      { id: 'l4', title: '2.1 Critical Section Problem & Peterson Solution', duration: '35:20', isCompleted: true, summary: 'Hardware atomic instructions (TestAndSet, CompareAndSwap) and software locking invariants.' },
      { id: 'l5', title: '2.2 Semaphores & Dining Philosophers Problem', duration: '41:10', isCompleted: false, summary: 'Counting vs binary semaphores, resource hierarchy solution, and deadlock prevention.' },
      { id: 'l6', title: '2.3 Banker’s Safety Algorithm & Deadlock Recovery', duration: '30:00', isCompleted: false, summary: 'Safe state matrices, resource allocation graphs, and preemption recovery mechanisms.' },
    ],
  },
  {
    unitNumber: 3,
    unitTitle: 'Virtual Memory & Demand Paging',
    lessons: [
      { id: 'l7', title: '3.1 Two-Level Page Tables & TLB Architecture', duration: '38:50', isCompleted: false, summary: 'Multi-level paging hardware address translation, TLB miss handlers, and EAT calculations.' },
      { id: 'l8', title: '3.2 Page Replacement Algorithms (LRU, Clock, WS)', duration: '29:40', isCompleted: false, summary: 'Belady anomaly, FIFO vs LRU approximations, second-chance clock algorithm, and working set models.' },
    ],
  },
];

export function LmsLearningPage() {
  const [modules, setModules] = useState<UnitModule[]>(COURSE_MODULES);
  const [activeLessonId, setActiveLessonId] = useState<string>('l5');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [userNote, setUserNote] = useState<string>(
    'Peterson algorithm requires memory barriers in out-of-order execution architectures (x86 vs ARM). Semaphores can lead to priority inversion if mutexes lack priority inheritance.'
  );
  const [isSavedNote, setIsSavedNote] = useState<boolean>(false);

  const [discussions, setDiscussions] = useState([
    { id: 'd1', author: 'Aarav Patel', time: 'Yesterday', text: 'Does Linux CFS scheduler support task priority nice values (-20 to +19) directly through weight decay factors?', role: 'Student' },
    { id: 'd2', author: 'Prof. Elena Rostova', time: '14 hours ago', text: 'Yes, exactly! Each nice level corresponds to roughly a 10% change in CPU bandwidth via pre-calculated priority tables.', role: 'Course Director' },
  ]);
  const [newQuestion, setNewQuestion] = useState('');

  // Find active lesson
  let activeLesson: Lesson | undefined;
  for (const mod of modules) {
    const found = mod.lessons.find((l) => l.id === activeLessonId);
    if (found) {
      activeLesson = found;
      break;
    }
  }

  // Calculate completion percentage
  const totalLessons = modules.flatMap((m) => m.lessons).length;
  const completedLessons = modules.flatMap((m) => m.lessons).filter((l) => l.isCompleted).length;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  const handleToggleComplete = () => {
    setModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((l) =>
          l.id === activeLessonId ? { ...l, isCompleted: !l.isCompleted } : l
        ),
      }))
    );
  };

  const handleSaveNote = () => {
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 2000);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setDiscussions([
      ...discussions,
      {
        id: String(Date.now()),
        author: 'Jordan Hayes (You)',
        time: 'Just now',
        text: newQuestion.trim(),
        role: 'Student',
      },
    ]);
    setNewQuestion('');
  };

  return (
    <AppLayout>
      <ModuleHeader
        title="Core LMS — Theory & Self-Paced Learning"
        subtitle="CS301: Operating Systems & Kernel Architecture • Taught by Prof. Elena Rostova"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Courses', href: '/courses' }, { label: 'Learning Portal' }]}
        stats={[
          { label: 'Syllabus Progress', value: `${progressPercent}%`, variant: 'success' },
          { label: 'Completed Lessons', value: `${completedLessons} / ${totalLessons}`, variant: 'primary' },
          { label: 'Total Duration', value: '42.5 hrs', variant: 'default' },
        ]}
      />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Course Units & Lesson Syllabus Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs h-fit space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-700">Course Completion Rate</span>
              <span className="font-extrabold text-primary-700">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
            {modules.map((mod) => (
              <div key={mod.unitNumber} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-100 text-primary-800">
                    Unit {mod.unitNumber}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 truncate">
                    {mod.unitTitle}
                  </h4>
                </div>

                <div className="space-y-1 pl-1">
                  {mod.lessons.map((lesson) => {
                    const isActive = lesson.id === activeLessonId;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs transition flex items-center justify-between gap-2 ${
                          isActive
                            ? 'bg-primary-50 text-primary-900 border border-primary-200 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {lesson.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{lesson.duration}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Main Lecture Player & Collaborative Notes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Simulated Video Player */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-800 relative group aspect-video flex flex-col justify-between">
            {/* Top Video Overlay */}
            <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-primary-600 px-2 py-0.5 rounded font-bold">
                  CS301 LECTURE
                </span>
                <span className="text-xs font-medium truncate max-w-sm">
                  {activeLesson?.title}
                </span>
              </div>
              <span className="text-xs text-slate-300">1080p HD • 60 FPS</span>
            </div>

            {/* Center Play Button Overlay */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-primary-600/90 text-white flex items-center justify-center hover:scale-110 hover:bg-primary-500 transition shadow-xl"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </button>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 bg-gradient-to-t from-black/90 to-transparent text-white space-y-2 z-10">
              {/* Scrub line */}
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden cursor-pointer">
                <div className="bg-primary-500 h-1.5 rounded-full w-2/5" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <Volume2 className="w-4 h-4 text-slate-300" />
                  <span className="text-[11px] text-slate-300">14:20 / {activeLesson?.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[11px]">1.0x Speed</span>
                  <Maximize2 className="w-4 h-4 text-slate-300 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Row: Mark Complete, Download Notes, Slides */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{activeLesson?.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{activeLesson?.summary}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleComplete}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeLesson?.isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{activeLesson?.isCompleted ? 'Completed ✓' : 'Mark Lesson Complete'}</span>
              </button>

              <button
                type="button"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Download Lecture Slides (PDF)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Study Notes Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Personal Lesson Notes & Bookmarks
                </h4>
              </div>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                {isSavedNote ? 'Saved ✓' : 'Save Notes'}
              </button>
            </div>
            <textarea
              rows={4}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono leading-relaxed"
            />
          </div>

          {/* Lesson Q&A Discussion Forum */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Lesson Discussion Thread ({discussions.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Faculty Monitored Forum</span>
            </div>

            <div className="space-y-3">
              {discussions.map((d) => (
                <div key={d.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{d.author}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {d.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{d.time}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed mt-1">{d.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddQuestion} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ask Prof. Rostova or classmates a question about this topic..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
export default LmsLearningPage;
