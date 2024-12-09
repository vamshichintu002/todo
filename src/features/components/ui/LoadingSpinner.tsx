import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}