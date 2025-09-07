# 🍳 Recipe Extractor

Transform your favorite cooking videos from TikTok, YouTube, and Instagram into detailed, structured recipes with AI-powered transcription and extraction.

## ✨ Features

### 🎤 **High-Quality Audio Transcription**
- **YouTube & TikTok**: Full audio transcription using OpenAI Whisper API
- **yt-dlp Integration**: Downloads video audio for accurate speech-to-text
- **Spoken Content Capture**: Gets all ingredients, steps, and cooking tips mentioned in videos

### 🤖 **AI-Powered Recipe Extraction**
- **OpenAI GPT-4o-mini**: Intelligent recipe structuring and formatting
- **Comprehensive Analysis**: Extracts ingredients, steps, timing, equipment, and tags
- **Smart Inference**: Fills in missing details based on cooking context

### 💰 **Cost Estimation & Nutrition**
- **Location-Based Pricing**: Ingredient costs for 10+ regions (Guam, Hawaii, US, Japan, etc.)
- **Nutritional Information**: Calories, protein, carbs, fat, fiber, sugar, sodium
- **Per-Serving & Total Values**: Complete nutritional breakdown

### 📱 **Modern Web Experience**
- **PWA Ready**: Install as an app on your phone with offline support
- **Mobile-First Design**: Optimized for touch and mobile usage
- **Search & Filter**: Find recipes by name, ingredients, or tags
- **Recipe History**: Save and manage all your extracted recipes
- **Duplicate Detection**: Automatically finds existing recipes

### 🎬 **Multi-Platform Support**
- **🎤 YouTube**: High-quality audio transcription + video metadata
- **🎤 TikTok**: High-quality audio transcription + video metadata  
- **📝 Instagram**: Basic text extraction (title + description only)

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **[Neon Database](https://neon.tech)** - PostgreSQL database (free tier available)
- **[OpenAI API](https://platform.openai.com)** - For GPT-4o-mini and Whisper API
- **yt-dlp** - Video downloader (auto-installed via npm)

### Setup

1. **Clone and install:**
```bash
git clone https://github.com/leonshimizu/recipe-extractor.git
cd recipe-extractor/recipe-nextjs
npm install
```

2. **Environment Setup:**
```bash
# Create environment file
touch .env.local

# Add your API keys and database URL:
echo "DATABASE_URL=your_neon_database_url" >> .env.local
echo "OPENAI_API_KEY=your_openai_api_key" >> .env.local
echo "IG_OEMBED_TOKEN=your_instagram_token_optional" >> .env.local
```

**Required Environment Variables:**
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key (needs GPT-4 and Whisper access)
- `IG_OEMBED_TOKEN` - Instagram oEmbed token (optional, for Instagram support)

3. **Database Setup:**
```bash
npm run db:push
```

4. **Run Development:**
```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 🔧 How It Works

### 1. **Video Input**
- User pastes a TikTok, YouTube, or Instagram URL
- System detects platform and chooses optimal extraction method

### 2. **Audio Transcription** (YouTube & TikTok)
- **yt-dlp** downloads video audio to temporary file
- **OpenAI Whisper API** transcribes spoken content to text
- Captures all ingredients, steps, and cooking tips mentioned in video

### 3. **Content Extraction**
- Combines transcribed audio + video metadata (title, description)
- **OpenAI GPT-4o-mini** processes combined content
- Structures data into standardized recipe format

### 4. **Smart Enhancement**
- Estimates ingredient costs based on user's location
- Calculates nutritional information (calories, macros, etc.)
- Generates relevant tags and categories
- Infers missing cooking details from context

### 5. **Storage & Display**
- Saves to **Neon PostgreSQL** database with full metadata
- Displays formatted recipe with quality indicators
- Enables search, filtering, and recipe management

### Quality Indicators
- **🎤 High Quality**: Full audio transcription available
- **📝 Basic Quality**: Text-only extraction (Instagram or fallback)

## 📦 Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push
```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`
     - `OPENAI_API_KEY`
     - `IG_OEMBED_TOKEN` (optional)

3. **Deploy!** ✅

### Netlify Alternative

- Connect GitHub repo at [netlify.com](https://netlify.com)
- Build settings:
  - Build command: `npm run build`
  - Publish directory: `.next`
- Add same environment variables

## 🔧 Tech Stack

### **Frontend & Framework**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **PWA** - Service Worker + Web App Manifest

### **Backend & Database**
- **Neon PostgreSQL** - Serverless database
- **Drizzle ORM** - Type-safe database queries
- **Next.js API Routes** - Serverless functions

### **AI & Media Processing**
- **OpenAI GPT-4o-mini** - Recipe extraction and structuring
- **OpenAI Whisper API** - Audio transcription
- **Vercel AI SDK** - Structured AI responses with Zod validation
- **yt-dlp** - Video/audio downloading
- **oEmbed APIs** - Video metadata extraction

### **External APIs**
- **TikTok oEmbed** - Video metadata and thumbnails
- **YouTube oEmbed** - Video metadata and thumbnails
- **Instagram oEmbed** - Basic video information (requires token)

## 📱 PWA Installation

1. Visit your deployed app on mobile
2. Tap "Add to Home Screen" 
3. Use as a native app! 📲

## 🎯 Usage Tips

### **For Best Results:**
- **Use YouTube or TikTok videos** - Full audio transcription provides much better recipe quality
- **Choose videos with clear speech** - Whisper works best with clear audio
- **Add location for accurate costs** - Ingredient prices vary significantly by region
- **Use Additional Notes field** - Add any details you noticed that might be missed

### **Platform Limitations:**
- **Instagram**: Limited to title/description text only (no audio access)
- **Private/Restricted Videos**: Cannot access audio or metadata
- **Very Short Videos**: May not contain enough recipe information

## 🔍 API Costs

**Estimated costs per recipe extraction:**
- **Whisper API**: ~$0.01-0.03 per video (based on audio length)
- **GPT-4o-mini**: ~$0.01-0.02 per recipe (based on content complexity)
- **Total**: ~$0.02-0.05 per high-quality recipe extraction

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (especially with different video types)
5. Update documentation if needed
6. Submit a pull request

### **Development Notes:**
- Test with various video platforms and lengths
- Ensure Whisper transcription works with different accents/languages
- Verify cost estimation accuracy for different regions
- Check mobile responsiveness on real devices

## 🐛 Troubleshooting

### **Common Issues:**
- **"Whisper API not available"**: Check OpenAI API key has Whisper access
- **Database connection errors**: Verify Neon DATABASE_URL is correct
- **Video download fails**: Some videos may be region-restricted or private
- **Missing thumbnails**: Check oEmbed API access for the platform

### **Debug Mode:**
Check browser console and server logs for detailed error information.

## 📄 License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ for the cooking community

**Transform any cooking video into a structured recipe in seconds!** 🚀