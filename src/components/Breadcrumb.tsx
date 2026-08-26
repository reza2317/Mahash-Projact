import React from 'react';
import { PageId } from '../types';

interface BreadcrumbItem {
  label: string;
  target?: PageId;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (page: PageId) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 overflow-x-auto whitespace-nowrap py-1">
      <button
        onClick={() => onNavigate('home')}
        className="text-[#173b82] hover:text-[#0f275a] font-semibold transition cursor-pointer"
      >
        خانه
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-slate-400">/</span>
          {item.target ? (
            <button
              onClick={() => onNavigate(item.target!)}
              className="text-[#173b82] hover:text-[#0f275a] font-semibold transition cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-700 font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
