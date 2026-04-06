"use client"
import React from 'react';
import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

const SpeechToTextResult = dynamic(() => import('@/components/features/audio/SpeechToText'), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader className='h-4 w-4 animate-spin text-muted-foreground' />
        <p className="mt-4 text-muted-foreground">Loading transcription</p>
      </div>
    </div>
  ),
});

export default function SpeechToTextPage() {
  return <SpeechToTextResult />;
}