import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const AlertModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' // 'success', 'error', 'warning', 'info'
}) => {
  if (!isOpen) return null;

  const config = {
    success: {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-600/10',
      borderColor: 'border-green-500/30'
    },
    error: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-600/10',
      borderColor: 'border-red-500/30'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/10',
      borderColor: 'border-yellow-500/30'
    },
    info: {
      icon: Info,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/10',
      borderColor: 'border-purple-500/30'
    }
  };

  const { icon: Icon, color, bgColor, borderColor } = config[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-black border border-white/20 max-w-md w-full shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className={`border-b ${borderColor} ${bgColor} p-4 sm:p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Icon className={color} size={24} />
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
        <div className="border-t border-white/10 p-4 sm:p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white transition-colors uppercase tracking-wider text-sm font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;