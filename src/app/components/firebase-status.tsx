'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';

export default function FirebaseStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { db, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      setStatus('connecting');
      return;
    }
    if (!db) {
      setStatus('disconnected');
      return;
    }
    
    const connectedRef = ref(db, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    }, (error) => {
        console.error("Firebase connection status error:", error);
        setStatus('disconnected');
    });

    return () => unsubscribe();
  }, [db, authLoading]);

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return { 
            className: 'text-green-500', 
            text: 'Firebase Connected' 
        };
      case 'disconnected':
        return { 
            className: 'text-red-500', 
            text: 'Firebase Disconnected' 
        };
      default:
        return { 
            className: 'text-yellow-500 animate-pulse', 
            text: 'Connecting to Firebase...' 
        };
    }
  }

  const { className, text } = getStatusInfo();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center h-8 w-8">
            <svg
              className={cn("h-4 w-4", className)}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="8" />
            </svg>
             <span className="sr-only">{text}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
