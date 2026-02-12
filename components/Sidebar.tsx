
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: View;
  onNavigate: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate }) => {
  const navItems: { label: string; view: View; icon: string }[] = [
    { label: 'Dashboard', view: 'dashboard', icon: 'dashboard' },
    { label: 'Analysis', view: 'analysis', icon: 'analytics' },
    { label: 'Settings', view: 'settings', icon: 'settings' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed left-0 top-0 bottom-0 w-[280px] bg-slate-900/90 backdrop-blur-2xl z-[70] border-r border-white/10 transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-10">
          <div className="size-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30 border border-white/20">
            AM
          </div>
          <p className="text-white text-xl font-bold leading-tight tracking-tight">Alex Morgan</p>
          <p className="text-primary/80 text-xs font-mono font-bold mt-1 uppercase tracking-widest">Premium Account</p>
        </div>

        <nav className="flex-1 px-4">
          <ul className="flex flex-col gap-3 font-mono">
            {navItems.map((item) => (
              <li 
                key={item.view}
                onClick={() => { onNavigate(item.view); onClose(); }}
                className={`flex h-14 items-center gap-4 rounded-xl px-4 cursor-pointer transition-all border ${
                  currentView === item.view 
                    ? 'bg-primary/20 text-white border-primary/30' 
                    : 'text-gray-400 hover:bg-white/5 border-transparent hover:border-white/10'
                }`}
              >
                <span className={`material-symbols-outlined text-[24px] ${currentView === item.view ? 'text-primary' : 'group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <p className={`text-sm font-bold leading-tight truncate uppercase tracking-widest ${currentView === item.view ? 'text-white' : ''}`}>
                  {item.label}
                </p>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition-colors">
            <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">help</span>
            </div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-300">Support Center</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
