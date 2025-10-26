import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'danger' // 'danger' or 'warning' or 'info'
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'border-red-500/30 bg-red-600/10',
    warning: 'border-yellow-500/30 bg-yellow-600/10',
    info: 'border-purple-500/30 bg-purple-600/10'
  };

  const buttonStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-purple-600 hover:bg-purple-700'
  };

  const iconColor = {
    danger: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-purple-400'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-black border border-white/20 max-w-md w-full shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className={`border-b ${variantStyles[variant]} p-4 sm:p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={iconColor[variant]} size={24} />
            <h3 className="text-lg sm:text-xl font-serif text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 sm:py-3 border border-white/20 text-white hover:bg-white/5 transition-colors uppercase tracking-wider text-sm font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 sm:py-3 ${buttonStyles[variant]} text-white transition-colors uppercase tracking-wider text-sm font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;