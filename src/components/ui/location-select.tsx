'use client';

import { useState } from 'react';
import { Check, ChevronDown, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Location {
  code: string;
  name: string;
  flag: string;
  currency: string;
  priceMultiplier: number;
  description: string;
}

export const LOCATIONS: Location[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    priceMultiplier: 1.0,
    description: 'Standard US grocery prices'
  },
  {
    code: 'Guam',
    name: 'Guam',
    flag: '🇬🇺',
    currency: 'USD',
    priceMultiplier: 1.3,
    description: '20-40% higher than mainland US'
  },
  {
    code: 'Hawaii',
    name: 'Hawaii',
    flag: '🏝️',
    currency: 'USD',
    priceMultiplier: 1.25,
    description: '25% higher than mainland US'
  },
  {
    code: 'Canada',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    priceMultiplier: 1.1,
    description: 'Converted to USD equivalent'
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    priceMultiplier: 1.2,
    description: 'Converted from pounds to USD'
  },
  {
    code: 'Australia',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    priceMultiplier: 1.15,
    description: 'Converted to USD equivalent'
  },
  {
    code: 'Japan',
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    priceMultiplier: 1.05,
    description: 'Converted from yen to USD'
  },
  {
    code: 'EU',
    name: 'European Union',
    flag: '🇪🇺',
    currency: 'EUR',
    priceMultiplier: 1.1,
    description: 'Average EU prices in USD'
  }
];

interface LocationSelectProps {
  value: string;
  onValueChange: (location: string) => void;
  className?: string;
  compact?: boolean;
}

export default function LocationSelect({ 
  value, 
  onValueChange, 
  className,
  compact = false 
}: LocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // Check if current value is a custom location (not in predefined list)
  const selectedLocation = LOCATIONS.find(loc => loc.code === value);
  const isCurrentCustom = !selectedLocation && value !== LOCATIONS[0].code;
  
  // Use predefined location or show custom value
  const displayLocation = selectedLocation || {
    code: value,
    name: value,
    flag: '🌍',
    currency: 'USD',
    priceMultiplier: 1,
    description: 'Custom location'
  };

  const handleSelect = (location: Location) => {
    onValueChange(location.code);
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const handleCustomSubmit = () => {
    if (customLocation.trim()) {
      onValueChange(customLocation.trim());
      setIsOpen(false);
      setIsCustomMode(false);
      setCustomLocation('');
    }
  };

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 px-2 text-xs justify-between min-w-[80px] sm:min-w-[100px] hover:bg-accent/50 border border-border/30"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{displayLocation.flag}</span>
            <span className="truncate font-medium">
              <span className="sm:hidden">{displayLocation.code}</span>
              <span className="hidden sm:inline">{displayLocation.name}</span>
            </span>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => {
                setIsOpen(false);
                setIsCustomMode(false);
                setCustomLocation('');
              }}
            />
            
            {/* Dropdown */}
            <div className="absolute top-full right-0 z-50 mt-1 w-72 bg-popover border rounded-lg shadow-lg">
              <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                {/* Predefined Locations */}
                {LOCATIONS.map((location) => (
                  <button
                    key={location.code}
                    onClick={() => handleSelect(location)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 text-left rounded-md hover:bg-accent transition-colors text-xs",
                      location.code === value && "bg-accent ring-1 ring-primary/20"
                    )}
                  >
                    <span className="text-base">{location.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{location.name}</div>
                      <div className="text-muted-foreground truncate text-xs">{location.description}</div>
                    </div>
                    {location.code === value && (
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
                
                {/* Separator */}
                <div className="border-t border-border my-2" />
                
                {/* Custom Location Section */}
                {!isCustomMode ? (
                  <button
                    onClick={() => setIsCustomMode(true)}
                    className="w-full flex items-center gap-3 p-2.5 text-left rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Add custom location</div>
                      <div className="text-xs">Enter your city/country</div>
                    </div>
                  </button>
                ) : (
                  <div className="p-2.5 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Custom Location</div>
                    <div className="flex gap-2">
                      <Input
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        placeholder="Enter location..."
                        className="h-7 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCustomSubmit();
                          } else if (e.key === 'Escape') {
                            setIsCustomMode(false);
                            setCustomLocation('');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleCustomSubmit}
                        className="h-7 px-2 text-xs"
                        disabled={!customLocation.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Press Enter to add or Escape to cancel
                    </div>
                  </div>
                )}
                
                {/* Show current custom location if selected */}
                {isCurrentCustom && (
                  <>
                    <div className="border-t border-border my-2" />
                    <div className="p-2.5 bg-accent/50 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="text-base">🌍</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{value}</div>
                          <div className="text-muted-foreground truncate text-xs">Current custom location</div>
                        </div>
                        <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Cost Location</span>
      </div>
      
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-12 px-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{displayLocation.flag}</span>
            <div className="text-left">
              <div className="font-medium">{displayLocation.name}</div>
              <div className="text-xs text-muted-foreground">{displayLocation.description}</div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => {
                setIsOpen(false);
                setIsCustomMode(false);
                setCustomLocation('');
              }}
            />
            
            {/* Dropdown */}
            <Card className="absolute top-full left-0 right-0 z-50 mt-2 shadow-lg">
              <CardContent className="p-2 space-y-1 max-h-80 overflow-y-auto">
                {LOCATIONS.map((location) => (
                  <button
                    key={location.code}
                    onClick={() => handleSelect(location)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-accent transition-colors",
                      location.code === value && "bg-accent ring-1 ring-primary"
                    )}
                  >
                    <span className="text-xl">{location.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{location.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {location.currency}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {location.description}
                      </div>
                    </div>
                    {location.code === value && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        Ingredient costs will be estimated based on typical grocery store prices in this location
      </div>
    </div>
  );
}
