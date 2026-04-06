import React, { useState, useEffect } from 'react';
import { STREAK_DAYS, RECENT_NOTES, UPCOMING_TESTS } from '../constants';
import { Sparkles, BookOpen, FlaskConical, Rocket, CheckCircle2, ChevronRight, Flame, CalendarDays, Zap, BadgeCheck, Bot } from 'lucide-react';
import { getColorClass } from '../utils';
import { auth } from '../services/firebase';
import { supabase } from '../services/supabase';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [userName, setUserName] = useState<string>('Vivek');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('firebase_uid', user.uid)
          .single();
        
        if (data?.full_name) {
          setUserName(data.full_name.split(' ')[0]);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  return (
    <div className="space-y-6">
      {/* Compact Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Welcome back, {userName}</h1>
          <p className="text-sm text-gray-500">You've studied for 5 days in a row. Keep it up!</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('My Notes')} className="btn-primary">
            <Zap size={14} />
            Resume Session
          </button>
          <button onClick={() => onNavigate('AI Tutor')} className="btn-secondary">
            <Bot size={14} />
            Ask AI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Streak Widget */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Flame size={16} className="text-orange-500" />
              Study Streak
            </h2>
            <span className="text-xs font-medium text-gray-500">Week 14</span>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {STREAK_DAYS.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={`w-full aspect-square rounded-md flex items-center justify-center text-[10px] font-medium border ${
                  item.status === 'complete' 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                    : item.status === 'missed' 
                      ? 'bg-red-50 border-red-100 text-red-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  {item.label}
                </div>
                <span className="text-[10px] text-gray-400 uppercase">{item.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-indigo-600" />
              <div className="text-xs">
                <p className="font-semibold text-gray-900">Keep up the momentum!</p>
                <p className="text-gray-500">You're doing great this week.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Focus Widget */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen size={16} className="text-green-600" />
              Today's Focus
            </h2>
            <span className="text-xs font-medium text-gray-500">In Progress</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">DNA Replication</h4>
              <p className="text-[10px] text-gray-500 uppercase">Biology • 45 min left</p>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-[10px] font-medium text-gray-500">
              <span>Progress</span>
              <span>68%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
          <button onClick={() => onNavigate('My Notes')} className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-black transition-colors">
            Resume Session
          </button>
        </div>

        {/* AI Insights Widget */}
        <div className="card p-4 bg-indigo-600 border-indigo-600 text-white flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-indigo-200" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-100">AI Insights</h3>
          </div>
          <p className="text-xs leading-relaxed text-indigo-50 italic flex-1">
            "Review 'Mitosis' before your Bio quiz tomorrow to boost your performance."
          </p>
          <button onClick={() => onNavigate('AI Tutor')} className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-md transition-colors border border-white/20">
            View All Insights
          </button>
        </div>

        {/* Recent Activity / Notes Table */}
        <div className="card lg:col-span-2">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Notes</h2>
            <button onClick={() => onNavigate('My Notes')} className="text-xs text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="table-container border-none rounded-none">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">Title</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Last Edited</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_NOTES.slice(0, 4).map((note, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="table-cell font-medium">{note.title}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getColorClass(note.folder)}`}>
                        {note.folder}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 text-xs">{note.date}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-600">Synced</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Tests */}
        <div className="card flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming Tests</h3>
            <button onClick={() => onNavigate('Tests')} className="text-[10px] font-bold text-indigo-600 hover:underline">View Schedule</button>
          </div>
          
          <div className="p-4 flex-1">
            {/* Featured Next Test */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl mb-4 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                <FlaskConical size={60} className="text-indigo-600" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full uppercase tracking-tighter">Next Up</span>
                  <span className="text-[10px] text-indigo-600 font-bold">In 2 Days</span>
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-1">{UPCOMING_TESTS[0].name}</h4>
                <p className="text-xs text-gray-500 mb-4">{UPCOMING_TESTS[0].subject} • {UPCOMING_TESTS[0].month} {UPCOMING_TESTS[0].day}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-gray-500">AI Readiness Score</span>
                    <span className="text-indigo-600">82%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
                
                <button onClick={() => onNavigate('AI Tutor')} className="mt-4 w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
                  <Rocket size={14} />
                  Boost Readiness
                </button>
              </div>
            </div>

            {/* Other Tests List */}
            <div className="space-y-3">
              {UPCOMING_TESTS.slice(1, 3).map((test, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex flex-col items-center justify-center border border-gray-200 group-hover:bg-white group-hover:border-indigo-200 transition-colors">
                      <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">{test.month}</span>
                      <span className="text-sm font-bold text-gray-900 leading-none mt-0.5">{test.day}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{test.name}</p>
                      <p className="text-[10px] text-gray-500">{test.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                          {i}
                        </div>
                      ))}
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <CalendarDays size={16} />
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              <span className="font-bold text-gray-900">Pro Tip:</span> Students who study 3 days before a test score 15% higher.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;