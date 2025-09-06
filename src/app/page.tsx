import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-8">
            <span className="text-2xl">🍳</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-6 tracking-tight">
            Recipe Extractor
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Transform your favorite TikTok cooking videos into detailed, structured recipes with AI
          </p>
          <Link
            href="/new"
            className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors duration-200 text-base"
          >
            Get Started
            <span className="ml-2">→</span>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors duration-200">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-6">
              <span className="text-xl">🎬</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Multi-Platform Support</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Extract recipes from TikTok, Instagram, and YouTube videos seamlessly
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors duration-200">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-6">
              <span className="text-xl">🤖</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">AI-Powered</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Advanced AI extracts ingredients, steps, and cooking times automatically
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors duration-200">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-6">
              <span className="text-xl">📱</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Mobile-First PWA</h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Install as an app on your phone for quick recipe extraction on the go
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-light text-gray-900 text-center mb-12 tracking-tight">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-lg font-medium text-gray-700">1</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Paste URL</h3>
              <p className="text-gray-600 font-light leading-relaxed">Copy and paste any TikTok, Instagram, or YouTube recipe video URL</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-lg font-medium text-gray-700">2</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">AI Analysis</h3>
              <p className="text-gray-600 font-light leading-relaxed">Our AI analyzes the video content and extracts recipe details</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-lg font-medium text-gray-700">3</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Get Recipe</h3>
              <p className="text-gray-600 font-light leading-relaxed">Receive a beautifully formatted recipe with ingredients and steps</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gray-50 rounded-2xl p-12 border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4 tracking-tight">Ready to extract your first recipe?</h2>
            <p className="text-gray-600 mb-8 text-lg font-light">
              Turn any cooking video into a structured recipe in seconds
            </p>
            <Link
              href="/new"
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors duration-200"
            >
              Get Started Now
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}