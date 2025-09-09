'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface URLInputProps {
  onExtract: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function URLInput({ onExtract, isLoading = false, className }: URLInputProps) {
  const [url, setUrl] = useState('');

  const isValidUrl = (() => {
    const trimmedUrl = url.trim().toLowerCase();
    if (trimmedUrl.length === 0) return false;
    
    // Check if it looks like a URL and contains supported domains
    const hasHttp = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
    const supportedDomains = [
      'youtube.com',
      'youtu.be', 
      'tiktok.com',
      'instagram.com'
    ];
    
    const containsSupportedDomain = supportedDomains.some(domain => 
      trimmedUrl.includes(domain)
    );
    
    return hasHttp && containsSupportedDomain;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isValidUrl && !isLoading) {
      onExtract(url);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="url"
          placeholder="Paste video URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-14 text-base rounded-2xl"
          disabled={isLoading}
        />
        
        <Button
          type="submit"
          size="lg"
          disabled={!isValidUrl || isLoading}
          className="w-full h-14 text-base rounded-2xl font-semibold"
        >
          {isLoading ? 'Extracting...' : 'Extract Recipe'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Paste a video URL to generate a structured recipe.
      </p>
    </div>
  );
}