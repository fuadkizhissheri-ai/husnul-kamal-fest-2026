'use client';

import React from 'react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return <div className="w-full min-h-screen font-sans">{children}</div>;
}
