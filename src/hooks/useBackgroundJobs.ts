'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface JobStatus {
  exists: boolean;
  id?: string;
  status?: 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStep?: string;
  message?: string;
  estimatedDuration?: number;
  recipeId?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

interface BackgroundJob {
  url: string;
  status: JobStatus;
  lastChecked: number;
}

export function useBackgroundJobs() {
  const [activeJobs, setActiveJobs] = useState<BackgroundJob[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const checkForBackgroundJobs = useCallback(async () => {
    // Get recent URLs from localStorage or other storage
    const recentUrls = getRecentExtractionUrls();
    
    if (recentUrls.length === 0) return;

    console.log('🔍 [BACKGROUND-JOBS] Checking status for', recentUrls.length, 'recent URLs');

    const jobPromises = recentUrls.map(async (url) => {
      try {
        const encodedUrl = encodeURIComponent(url);
        const response = await fetch(`/api/jobs/${encodedUrl}`);
        const status: JobStatus = await response.json();
        
        return { url, status, lastChecked: Date.now() };
      } catch (error) {
        console.warn('⚠️ [BACKGROUND-JOBS] Failed to check job for URL:', url, error);
        return null;
      }
    });

    const jobs = (await Promise.all(jobPromises)).filter(Boolean) as BackgroundJob[];
    const existingJobs = jobs.filter(job => job.status.exists);
    
    console.log('📊 [BACKGROUND-JOBS] Found', existingJobs.length, 'existing jobs');
    
    setActiveJobs(existingJobs);

    // Handle completed jobs
    existingJobs.forEach(job => {
      if (job.status.status === 'completed' && job.status.recipeId) {
        // Remove from recent URLs since it's completed
        removeFromRecentUrls(job.url);
        
        // Show success notification
        toast.success("Recipe Ready! 🎉 Your recipe extraction completed while you were away.", {
          action: {
            label: "View Recipe",
            onClick: () => router.push(`/recipes/${job.status.recipeId}`)
          }
        });
      } else if (job.status.status === 'failed') {
        // Remove from recent URLs since it failed
        removeFromRecentUrls(job.url);
        
        // Show error notification
        toast.error(`Extraction Failed: ${job.status.errorMessage || "The recipe extraction failed."}`);
      }
    });
  }, [router]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsPolling(true);
    intervalRef.current = setInterval(async () => {
      console.log('🔄 [BACKGROUND-JOBS] Polling job status...');
      await checkForBackgroundJobs();
    }, 5000); // Poll every 5 seconds
  }, [checkForBackgroundJobs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Check for background jobs on mount and when returning to page
  useEffect(() => {
    checkForBackgroundJobs();
    
    // Check when page becomes visible again (user returns to app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 [BACKGROUND-JOBS] Page became visible, checking for jobs...');
        checkForBackgroundJobs();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkForBackgroundJobs]);

  // Start/stop polling based on active jobs
  useEffect(() => {
    const processingJobs = activeJobs.filter(job => job.status.status === 'processing');
    
    if (processingJobs.length > 0 && !isPolling) {
      console.log('🔄 [BACKGROUND-JOBS] Starting polling for', processingJobs.length, 'active jobs');
      startPolling();
    } else if (processingJobs.length === 0 && isPolling) {
      console.log('🛑 [BACKGROUND-JOBS] No active jobs, stopping polling');
      stopPolling();
    }
  }, [activeJobs, isPolling, startPolling, stopPolling]);

  const addRecentUrl = (url: string) => {
    const recent = getRecentExtractionUrls();
    const updated = [url, ...recent.filter(u => u !== url)].slice(0, 5); // Keep last 5
    localStorage.setItem('recentExtractionUrls', JSON.stringify(updated));
    
    // Immediately check for this job
    setTimeout(() => checkForBackgroundJobs(), 1000);
  };

  const removeFromRecentUrls = (url: string) => {
    const recent = getRecentExtractionUrls();
    const updated = recent.filter(u => u !== url);
    localStorage.setItem('recentExtractionUrls', JSON.stringify(updated));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    activeJobs,
    isPolling,
    addRecentUrl,
    checkForBackgroundJobs
  };
}

function getRecentExtractionUrls(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('recentExtractionUrls');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
