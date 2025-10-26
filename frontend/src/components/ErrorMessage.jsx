import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-serif font-bold text-white mb-4">
          Oops! Something went wrong
        </h2>
        <p className="text-red-400 text-lg mb-6">{message}</p>
        <button onClick={onRetry} className="btn-primary glow-primary">
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage;