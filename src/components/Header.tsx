'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-gray-800 transition-colors duration-200">
              <span className="text-white text-lg">🍳</span>
            </div>
            <span className="text-lg font-medium text-gray-900 hidden sm:block">Recipe Extractor</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link
              href="/new"
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive('/new') 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Extract Recipe
            </Link>
            <Link
              href="/history"
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive('/history') 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              History
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  isActive('/new') 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Extract Recipe
              </Link>
              <Link
                href="/history"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  isActive('/history') 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                History
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
