import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_DATA } from '../constants';

const OverviewChart: React.FC = () => {
  return (
    <div className="relative h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={CHART_DATA}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#48bb78" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#48bb78" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            cursor={{ stroke: '#48bb78', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#48bb78" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Axis Labels (Manual to match design absolute positioning) */}
      <div className="absolute inset-0 flex items-end justify-between px-2 pointer-events-none">
        {CHART_DATA.map((d) => (
          <span key={d.name} className="text-xs text-gray-500 mb-[-20px]">{d.name}</span>
        ))}
      </div>
    </div>
  );
};

export default OverviewChart;