import React from 'react';
import OverviewChart from '../components/OverviewChart';
import ProgressRing from '../components/ProgressRing';

const ProgressPage: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-xl font-semibold">Detailed Progress</h1>
             <p className="text-sm text-gray-500">Track your learning journey and performance</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 card p-4">
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Activity Overview</h3>
             <div className="h-64">
               <OverviewChart />
             </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4">
             <div className="card p-4 bg-green-50 border-green-100 flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-green-700 mb-1">12</span>
                <span className="text-[10px] text-green-600 font-semibold uppercase tracking-wider">Study Hours This Week</span>
             </div>
             <div className="card p-4 bg-blue-50 border-blue-100 flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-blue-700 mb-1">85%</span>
                <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Average Quiz Score</span>
             </div>
             <div className="card p-4 bg-indigo-50 border-indigo-100 flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-indigo-700 mb-1">24</span>
                <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Notes Created</span>
             </div>
          </div>
       </div>

       {/* Subject Breakdown */}
       <div>
         <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Subject Breakdown</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Physics', 'Chemistry', 'Math', 'Literature'].map((sub, i) => (
               <div key={sub} className="card p-4 flex flex-col items-center hover:border-gray-300 transition-colors">
                  <div className="mb-3">
                     <ProgressRing progress={70 + (i * 5)} size={80} strokeWidth={6} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">{sub}</h4>
                  <span className="text-[10px] text-gray-500 font-medium">Grade A-</span>
               </div>
            ))}
         </div>
       </div>
    </div>
  );
};

export default ProgressPage;