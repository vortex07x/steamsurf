import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-secondary border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <p className="text-text-secondary text-lg">Loading videos...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;