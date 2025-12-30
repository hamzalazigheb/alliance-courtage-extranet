import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="w-20 h-4 bg-gray-200 rounded"></div>
    </div>
    <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
    <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
    <div className="w-32 h-3 bg-gray-200 rounded"></div>
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
    <div className="h-64 bg-gray-100 rounded-lg flex items-end justify-around px-4 pb-4">
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="w-12 bg-gray-200 rounded-t"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        ></div>
      ))}
    </div>
  </div>
);

export const SkeletonActivity: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="w-40 h-6 bg-gray-200 rounded mb-6"></div>
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);




