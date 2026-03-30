import React from 'react';
import { Microscope, FileCheck, Users2, ShieldCheck } from 'lucide-react';

const StatsGrid = () => {
  const stats = [
    { label: 'Tests Conducted', val: '5,000+', icon: <Microscope size={22} />, color: '#60A5FA' },
    { label: 'Reports Generated', val: '12,000+', icon: <FileCheck size={22} />, color: '#34D399' },
    { label: 'Happy Patients', val: '8,000+', icon: <Users2 size={22} />, color: '#818CF8' },
    { label: 'Expert Pathologists', val: '50+', icon: <ShieldCheck size={22} />, color: '#FBBF24' }
  ];

  return (
    <div className="bg-[#0f172a] py-12"> 
      <section className="relative z-30 px-4 md:px-[10%]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 rounded-3xl overflow-hidden bg-[#1e293b] border border-white/5 shadow-2xl">
          
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className={`relative p-10 flex flex-col items-center lg:items-start text-center lg:text-left transition-all duration-500 hover:bg-white/[0.03] group
                ${i !== stats.length - 1 ? 'lg:border-r border-white/5' : ''}
                ${i < 2 ? 'border-b lg:border-b-0 border-white/5' : ''}`}
            >
              <div className="mb-4" style={{ color: stat.color }}>
                {stat.icon}
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl font-light text-white tracking-tight">
                  {stat.val}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StatsGrid;