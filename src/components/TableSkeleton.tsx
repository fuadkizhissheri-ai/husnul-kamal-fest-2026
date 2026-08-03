import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export default function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="luxury-glass rounded-[28px] border border-[#C8A86B]/30 p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-white/10 rounded-full w-1/4 mb-4"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center space-x-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-white/10 rounded-full flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
