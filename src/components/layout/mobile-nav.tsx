'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t md:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-colors min-w-0 flex-1',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'fill-current')} />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}