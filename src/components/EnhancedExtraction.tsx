'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Zap, Brain, Database, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractionStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'complete' | 'error';
  message?: string;
}

interface EnhancedExtractionProps {
  url: string;
  location?: string;
  onComplete?: (recipeId: string) => void;
  onError?: (error: string) => void;
}

export default function EnhancedExtraction({ url, location = 'Guam', onComplete, onError }: EnhancedExtractionProps) {
  
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing...');
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);
  
  // Debug: Component render state
  // console.log('🎬 [ENHANCED-EXTRACTION] Component rendered with timer state:', {
  //   elapsedTime,
  //   estimatedDuration,
  //   hasTimer: !!timerRef.current
  // });

  const [steps, setSteps] = useState<ExtractionStep[]>([
    {
      id: 'metadata',
      label: 'Video Metadata',
      icon: <Clock className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'content',
      label: 'Content Analysis',
      icon: <Zap className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'transcription',
      label: 'Audio Transcription',
      icon: <Brain className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'ai',
      label: 'AI Processing',
      icon: <Brain className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'saving',
      label: 'Saving Recipe',
      icon: <Database className="w-4 h-4" />,
      status: 'pending'
    }
  ]);

  const updateStep = (stepId: string, status: ExtractionStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ));
  };

  const startExtraction = async () => {
    
    try {
      abortControllerRef.current = new AbortController();
      
      // Start the timer immediately
      const startTime = Date.now();
      // console.log('⏰ [ENHANCED-EXTRACTION] Starting timer at:', new Date(startTime).toISOString());
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        // Only log every 30 seconds to reduce noise (for debugging long extractions)
        if (elapsed % 30 === 0 && elapsed > 0) {
          console.log('⏰ [ENHANCED-EXTRACTION] Timer update - Elapsed:', elapsed, 'Estimated:', estimatedDuration);
        }
        setElapsedTime(elapsed);
      }, 1000);
      
      const response = await fetch('/api/extract-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, notes: '', location }),
        signal: abortControllerRef.current.signal
      });
      
      // console.log('📡 [ENHANCED-EXTRACTION] Response status:', response.status);
      // console.log('📡 [ENHANCED-EXTRACTION] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        if (response.status === 409) {
          console.log('⚠️ [ENHANCED-EXTRACTION] Duplicate processing detected, extraction already in progress');
          setCurrentMessage('Another extraction is in progress for this URL...');
          return; // Don't throw error for 409, just exit gracefully
        }
        throw new Error('Failed to start extraction');
      }

      if (!response.body) {
        throw new Error('No response stream');
      }

      // console.log('📖 [ENHANCED-EXTRACTION] Starting to read stream...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('📖 [ENHANCED-EXTRACTION] Stream reading completed');
          break;
        }

        const chunk = decoder.decode(value);
        // console.log('📖 [ENHANCED-EXTRACTION] Received chunk:', chunk);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              // console.log('📖 [ENHANCED-EXTRACTION] Parsed data:', data);
              
              if (data.error) {
                console.error('❌ [ENHANCED-EXTRACTION] Received error:', data);
                throw new Error(data.message || data.error);
              }

              if (data.complete) {
                console.log('✅ [ENHANCED-EXTRACTION] Extraction completed successfully!');
                console.log('✅ [ENHANCED-EXTRACTION] Recipe ID:', data.id);
                setIsComplete(true);
                setProgress(100);
                setCurrentMessage('Recipe extracted successfully!');
                
                // Immediate navigation without artificial delay
                toast.success('Recipe extracted successfully!');
                
                if (onComplete) {
                  console.log('🔄 [ENHANCED-EXTRACTION] Calling onComplete callback');
                  onComplete(data.id);
                } else {
                  console.log('🔄 [ENHANCED-EXTRACTION] Navigating to recipe page:', `/recipes/${data.id}`);
                  // Small delay for user to see completion, then navigate
                  setTimeout(() => {
                    router.push(`/recipes/${data.id}`);
                  }, 500);
                }
                return;
              }

              // Update progress
              if (data.progress !== undefined) {
                // console.log('📊 [ENHANCED-EXTRACTION] Progress update:', data.progress);
                setProgress(data.progress);
              }
              
              // Update timing information
              if (data.estimatedDuration !== undefined) {
                // console.log('⏰ [ENHANCED-EXTRACTION] Received estimated duration:', data.estimatedDuration);
                setEstimatedDuration(data.estimatedDuration);
              }

              if (data.message) {
                // console.log('💬 [ENHANCED-EXTRACTION] Message update:', data.message);
                setCurrentMessage(data.message);
              }

              // Update step status
              if (data.step) {
                // console.log('👣 [ENHANCED-EXTRACTION] Step update:', data.step, 'message:', data.message);
                // Mark previous steps as complete
                const stepOrder = ['metadata', 'content', 'transcription', 'ai', 'saving'];
                const currentIndex = stepOrder.indexOf(data.step);
                
                stepOrder.forEach((stepId, index) => {
                  if (index < currentIndex) {
                    updateStep(stepId, 'complete');
                  } else if (index === currentIndex) {
                    updateStep(stepId, 'active', data.message);
                  }
                });
              }

            } catch (parseError) {
              console.warn('⚠️ [ENHANCED-EXTRACTION] Failed to parse SSE data:', parseError);
              console.warn('⚠️ [ENHANCED-EXTRACTION] Raw line:', line);
            }
          }
        }
      }

    } catch (err) {
      // Don't show error for aborted requests (React Strict Mode cleanup)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🔄 [ENHANCED-EXTRACTION] Request aborted (likely React Strict Mode cleanup)');
        return;
      }
      
      console.error('❌ [ENHANCED-EXTRACTION] Extraction error:', err);
      console.error('❌ [ENHANCED-EXTRACTION] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        stack: err instanceof Error ? err.stack : undefined,
        url,
        location
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setCurrentMessage('Extraction failed');
      
      // Mark current step as error
      setSteps(prev => prev.map(step => 
        step.status === 'active' 
          ? { ...step, status: 'error', message: errorMessage }
          : step
      ));

      toast.error('Failed to extract recipe. Please try again.');
      
      if (onError) {
        console.log('🔄 [ENHANCED-EXTRACTION] Calling onError callback');
        onError(errorMessage);
      }
    }
  };

  // Reset hasStarted flag when URL changes
  useEffect(() => {
    hasStartedRef.current = false;
    // console.log('🔄 [ENHANCED-EXTRACTION] Reset hasStarted flag for new URL:', url);
  }, [url]);

  // Start extraction on mount (with guard against double execution)
  useEffect(() => {
    if (url && !isComplete && !error && progress === 0 && !hasStartedRef.current) {
      // console.log('🎬 [ENHANCED-EXTRACTION] Starting extraction (guarded)');
      
      // Add a small delay to prevent React Strict Mode double execution
      const timeoutId = setTimeout(() => {
        if (!isComplete && !error && !hasStartedRef.current) {
          hasStartedRef.current = true; // Set flag only when actually starting
          console.log('🚀 [ENHANCED-EXTRACTION] Starting extraction for:', url);
          startExtraction();
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isComplete, error, progress]);

  // Cleanup timer on unmount or completion
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Stop timer when complete or error
  useEffect(() => {
    if ((isComplete || error) && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isComplete, error]);

  const getStepIcon = (step: ExtractionStep) => {
    if (step.status === 'complete') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (step.status === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return step.icon;
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isComplete ? 'Extraction Complete!' : 'Extracting Recipe...'}
              </h3>
              <Badge 
                variant={error ? 'destructive' : isComplete ? 'default' : 'secondary'}
                className="text-xs"
              >
                {error ? 'Failed' : isComplete ? 'Complete' : `${Math.round(progress)}%`}
              </Badge>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            {/* Timer and Estimation */}
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Elapsed: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Est. Total: {Math.floor(estimatedDuration / 60)}:{(estimatedDuration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {currentMessage}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Steps */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-medium mb-4">Extraction Steps</h4>
          <div className="space-y-3">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                  step.status === 'active' && "bg-primary/5 border border-primary/20",
                  step.status === 'complete' && "bg-green-50 dark:bg-green-950/20",
                  step.status === 'error' && "bg-red-50 dark:bg-red-950/20"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-full",
                  step.status === 'pending' && "bg-muted",
                  step.status === 'active' && "bg-primary/10 text-primary",
                  step.status === 'complete' && "bg-green-100 dark:bg-green-900",
                  step.status === 'error' && "bg-red-100 dark:bg-red-900"
                )}>
                  {getStepIcon(step)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "font-medium text-sm",
                      step.status === 'complete' && "text-green-700 dark:text-green-300",
                      step.status === 'error' && "text-red-700 dark:text-red-300"
                    )}>
                      {step.label}
                    </p>
                    
                    {step.status === 'active' && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-75" />
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-150" />
                      </div>
                    )}
                  </div>
                  
                  {step.message && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Indicators */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-medium mb-4">Extraction Quality</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl mb-1">🎥</div>
              <p className="text-xs text-muted-foreground">Video Metadata</p>
              <p className="text-sm font-medium">
                {steps.find(s => s.id === 'metadata')?.status === 'complete' ? 'Extracted' : 'Processing...'}
              </p>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl mb-1">🎤</div>
              <p className="text-xs text-muted-foreground">Audio Transcript</p>
              <p className="text-sm font-medium">
                {steps.find(s => s.id === 'transcription')?.status === 'complete' ? 'Available' : 'Processing...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
