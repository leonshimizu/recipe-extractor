'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, History, Settings, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DesktopSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Extract',
      icon: Home,
    },
    {
      href: '/history',
      label: 'History',
      icon: History,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-card/50 backdrop-blur-sm border-r">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b">
          <div className="w-8 h-8 bg-primary rounded-2xl flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Recipe Extractor</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon 
                  className={cn(
                    'w-5 h-5 transition-transform group-hover:scale-110',
                    isActive && 'fill-current'
                  )} 
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t text-xs text-muted-foreground">
          Recipe Extractor v1.0.0
        </div>
      </div>
    </aside>
  );
}