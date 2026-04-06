"use client"
import React from 'react';
import dynamic from 'next/dynamic';

const AudioGeneration = dynamic(() => import('@/components/features/audio/AudioGeneration'), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading generation results...</p>
      </div>
    </div>
  ),
});

export default function AudoiGenerationPage() {
  return <AudioGeneration />;
}