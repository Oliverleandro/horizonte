import React from 'react';
import { Plus, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
      {/* Friendly Icon Container */}
      <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 shadow-inner">
        <Icon size={32} className="stroke-[1.8]" />
      </div>

      <h3 className="text-base font-bold text-slate-800 tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 min-h-[48px] px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 inline-flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
