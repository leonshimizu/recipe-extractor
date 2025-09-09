'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  DollarSign, 
  Scale, 
  Download, 
  Upload, 
  Trash2, 
  Info,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

type Currency = 'USD' | 'EUR' | 'JPY' | 'GBP' | 'AUD' | 'CAD';
type Location = 'US' | 'UK' | 'EU' | 'AU' | 'CA' | 'JP' | 'GU';
type Units = 'US' | 'metric';

export default function SettingsPage() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [location, setLocation] = useState<Location>('US');
  const [units, setUnits] = useState<Units>('US');
  const [notifications, setNotifications] = useState(true);

  const handleExportHistory = () => {
    toast.success('History exported successfully!');
  };

  const handleImportData = () => {
    toast.info('Import functionality would open file picker');
  };

  const handleClearDuplicates = () => {
    toast.success('Duplicates cleared successfully!');
  };

  const locationOptions = [
    { value: 'US', label: 'United States', flag: '🇺🇸' },
    { value: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
    { value: 'EU', label: 'European Union', flag: '🇪🇺' },
    { value: 'AU', label: 'Australia', flag: '🇦🇺' },
    { value: 'CA', label: 'Canada', flag: '🇨🇦' },
    { value: 'JP', label: 'Japan', flag: '🇯🇵' },
    { value: 'GU', label: 'Guam', flag: '🇬🇺' },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
    { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
    { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Customize your Recipe Extractor experience
        </p>
      </div>

      {/* Regional Settings */}
      <Card className="p-6 rounded-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Regional Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure location and currency preferences
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Default Location
              </Label>
              <Select value={location} onValueChange={(value: Location) => setLocation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.flag}</span>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Currency
              </Label>
              <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="units" className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Measurement Units
            </Label>
            <Select value={units} onValueChange={(value: Units) => setUnits(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">US (Fahrenheit, cups, lbs)</SelectItem>
                <SelectItem value="metric">Metric (Celsius, ml, kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 rounded-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Preferences</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your app behavior
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notifications" className="text-base">
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive updates when recipes are processed
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6 rounded-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Data Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Export, import, and manage your recipe data
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Export History</Label>
              <p className="text-sm text-muted-foreground">
                Download all your recipes as JSON
              </p>
            </div>
            <Button variant="outline" onClick={handleExportHistory}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Import Data</Label>
              <p className="text-sm text-muted-foreground">
                Import recipes from a JSON file
              </p>
            </div>
            <Button variant="outline" onClick={handleImportData}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Clear Duplicates</Label>
              <p className="text-sm text-muted-foreground">
                Remove duplicate recipes from your history
              </p>
            </div>
            <Button variant="outline" onClick={handleClearDuplicates}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-xl">🍳</span>
          </div>
          <div>
            <h3 className="font-semibold">Recipe Extractor</h3>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>Extract structured recipes from video URLs with ease</span>
        </div>
      </Card>
    </div>
  );
}