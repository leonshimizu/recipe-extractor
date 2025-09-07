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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Extract Recipe
          </h1>
          <p className="text-gray-600 text-sm">
            Transform cooking videos into detailed recipes
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* URL Input */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-900 mb-2">
                Video URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="Paste TikTok, YouTube, or Instagram URL..."
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              />
              
              {/* Compact Platform Badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                  🎤 YouTube
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                  🎤 TikTok
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200">
                  📝 Instagram
                </span>
              </div>
            </div>
            
            {/* Location Selector */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-900 mb-2">
                Cost Location
              </label>
              <select
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900 bg-white"
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
              <p className="text-xs text-gray-500 mt-1">
                For ingredient cost estimates
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-2">
                Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any extra details you noticed..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none transition-all text-gray-900 placeholder-gray-400"
              />
            </div>
            
            {/* Error Message */}
            {error && (
              <div className={`rounded-xl p-3 ${error.startsWith('✓') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${error.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting...
                </span>
              ) : (
                "Extract Recipe"
              )}
            </button>
          </form>
        </div>

        {/* Compact Info Card */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mt-0.5">
              <span className="text-gray-600 text-sm">ℹ️</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Quality Levels
              </h3>
              <div className="text-xs text-gray-700 space-y-1">
                <div className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                  <span><strong>YouTube & TikTok:</strong> Full audio transcription</span>
                </div>
                <div className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 flex-shrink-0"></span>
                  <span><strong>Instagram:</strong> Text only (limited)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
