import React from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'max-w-lg'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={clsx(
        "relative bg-white w-full shadow-2xl transition-all duration-200 transform scale-100 opacity-100",
        maxWidth,
        "rounded-2xl md:rounded-2xl",
        "mobile-bottom-sheet" // Custom CSS class for mobile behavior
      )}>
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            <button 
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="text-[14px] text-slate-700">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-row gap-3 justify-end">
              {footer}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .mobile-bottom-sheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 20px 20px 0 0 !important;
            max-width: 100vw !important;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
};

export default Modal;
