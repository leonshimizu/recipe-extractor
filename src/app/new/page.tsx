'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewRecipePage() {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('Guam');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url, notes, location })
        });
      
      if (!res.ok) {
        throw new Error('Failed to extract recipe');
      }
      
        const data = await res.json();
        if (data.isExisting) {
          // Show a brief message that we found an existing recipe
          setError('✓ Recipe already exists! Redirecting to existing recipe...');
          setTimeout(() => {
            router.push(`/recipes/${data.id}`);
          }, 1500);
        } else {
          router.push(`/recipes/${data.id}`);
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4 tracking-tight">
            Extract Recipe
          </h1>
          <p className="text-gray-600 text-base font-light">
            Transform your favorite TikTok cooking videos into detailed recipes with AI
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-6">
          <form onSubmit={onSubmit} className="space-y-8">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-900 mb-3">
                Recipe URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/..."
                required
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-2 font-light">
                Supports TikTok, Instagram, and YouTube URLs
              </p>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-900 mb-3">
                Cost Location
              </label>
              <select
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 appearance-none bg-white"
              >
                <option value="Guam">Guam</option>
                <option value="Hawaii">Hawaii</option>
                <option value="United States">United States</option>
                <option value="Japan">Japan</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
                <option value="Philippines">Philippines</option>
                <option value="South Korea">South Korea</option>
                <option value="Singapore">Singapore</option>
              </select>
              <p className="text-xs text-gray-500 mt-2 font-light">
                Ingredient costs will be estimated based on this location
              </p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-3">
                Additional Notes <span className="text-gray-400 font-light">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any ingredients, steps, or details you noticed in the video..."
                rows={4}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            {error && (
              <div className={`rounded-xl p-4 ${error.startsWith('✓') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-medium ${error.startsWith('✓') ? 'text-green-800' : 'text-red-800'}`}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-4 px-6 rounded-xl font-medium hover:bg-gray-800 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting Recipe...
                </span>
              ) : (
                "Extract Recipe"
              )}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
