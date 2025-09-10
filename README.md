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
# Optional: Only add if you want Instagram support
# echo "IG_OEMBED_TOKEN=your_instagram_token" >> .env.local
```

**Required Environment Variables:**
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key (needs GPT-4 and Whisper access)

**Optional Environment Variables:**
- `IG_OEMBED_TOKEN` - Instagram oEmbed token (only needed for Instagram video support)
  - Requires Facebook/Instagram Developer approval
  - Without this token, Instagram URLs will fail to process
  - Most users can skip this since Instagram only provides basic text extraction
  - **To get token**: Create Facebook Developer account → Create app → Get Instagram oEmbed access token

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

### 2. **Multi-Source Content Gathering**
- **🎤 Audio Transcription**: Full spoken content via Whisper API (TikTok & YouTube)
- **📝 Video Metadata**: Title, description, and captions when available
- **🔄 Smart Fallbacks**: YouTube Data API when audio extraction fails

### 3. **Intelligent Content Combination**
- **Combines ALL sources**: Audio transcript + title + description + captions
- **Cross-references information**: Uses multiple sources for accuracy and completeness
- **Quality hierarchy**: Audio transcription provides highest quality, metadata fills gaps

### 4. **AI Recipe Extraction**
- **OpenAI GPT-4o-mini** processes the combined content from all sources
- Structures data into standardized recipe format with ingredients, steps, and timing

### 5. **Smart Enhancement**
- Estimates ingredient costs based on user's location
- Calculates nutritional information (calories, macros, etc.)
- Generates relevant tags and categories
- Infers missing cooking details from context

### 6. **Storage & Display**
- Saves to **Neon PostgreSQL** database with full metadata
- Displays formatted recipe with quality indicators
- Enables search, filtering, and recipe management

### Quality Indicators
- **🎤 High Quality**: Full audio transcription available
- **📝 Basic Quality**: Text-only extraction (Instagram or fallback)

## 🧠 Technology Deep Dive

Ever wondered how we turn a cooking video into a structured recipe? Here's the simple breakdown of the technologies that make it possible:

### 🎤 **OpenAI Whisper API - The "Ears" of the System**

**What it does:** Converts spoken words in videos into text (speech-to-text)

**How it works:**
1. We extract the audio track from a video (using yt-dlp)
2. Send the audio file to OpenAI's Whisper API
3. Whisper analyzes the sound waves and identifies spoken words
4. Returns a complete transcript of everything said in the video

**Why it's amazing:** Whisper can understand different accents, background noise, and even cooking terminology. It's like having super-human hearing that never misses an ingredient or step!

**Example:** Video says *"Add two tablespoons of olive oil and a pinch of salt"* → Whisper returns `"Add two tablespoons of olive oil and a pinch of salt"`

### 🤖 **OpenAI GPT-4o-mini - The "Brain" of the System**

**What it does:** Takes messy text and turns it into structured recipe data

**How it works:**
1. We give GPT-4o-mini the transcript + video title + description
2. We ask it to identify ingredients, steps, timing, and equipment
3. GPT-4o-mini uses its training on millions of recipes to understand cooking patterns
4. Returns organized data in a specific format (JSON)

**Why it's powerful:** GPT-4o-mini can infer missing information, estimate costs, calculate nutrition, and even fix common mistakes in the original video.

**Example:** 
- **Input:** *"So you're gonna want some flour, maybe like 2 cups, and then crack a couple eggs..."*
- **Output:** `{"ingredients": [{"quantity": "2", "unit": "cups", "name": "flour"}, {"quantity": "2", "unit": "whole", "name": "eggs"}]}`

### 🔧 **Vercel AI SDK - The "Translator" Between AI and Code**

**What it does:** Makes it easy to work with AI APIs and ensures we get reliable, structured responses

**How it works:**
1. We define a "schema" (like a template) for what a recipe should look like
2. The AI SDK sends our request to OpenAI with special instructions
3. It validates the AI's response to make sure it matches our template
4. If something's wrong, it automatically asks the AI to try again

**Why it's essential:** Without this, the AI might return data in random formats that our app can't understand. It's like having a translator who ensures the AI always "speaks" in the exact format our app expects.

**Example Schema:** "A recipe must have a title (text), ingredients (list), and steps (list)" - the AI SDK ensures we always get exactly this structure.

### 📹 **yt-dlp - The "Video Downloader" Tool**

**What it does:** Downloads videos and audio from YouTube, TikTok, and hundreds of other platforms

**How it works:**
1. You give it a video URL (like `youtube.com/watch?v=abc123`)
2. It figures out the platform and finds the actual video files
3. It can extract just the audio track (which we need for Whisper)
4. Downloads the audio as an MP3 file to our server

**Why we need it:** Social media platforms don't just give you direct access to video files. yt-dlp knows how to navigate each platform's system to get the actual media files.

**Fun fact:** yt-dlp supports over 1,000 different video platforms! It's like a universal key for video content.

### 🔗 **oEmbed APIs - The "Metadata Collectors"**

**What they do:** Get basic information about videos (title, thumbnail, description) without downloading the whole video

**How they work:**
1. Each platform (YouTube, TikTok, Instagram) provides an oEmbed endpoint
2. We send a video URL to their API
3. They return basic info like title, description, thumbnail image
4. This happens instantly (no video download needed)

**Why they're useful:** 
- **Fast**: Get video info in milliseconds
- **Lightweight**: No need to download large video files just for basic info
- **Reliable**: Official APIs provided by the platforms themselves

**Example:** Send `tiktok.com/video/123` → Get back `{"title": "Amazing Pasta Recipe!", "thumbnail": "image.jpg", "description": "Easy 15-minute pasta..."}`

### 🔄 **How They All Work Together**

Here's the complete flow when you paste a video URL:

1. **oEmbed APIs** grab the video title, description, and thumbnail (fast)
2. **yt-dlp** downloads the audio track from the video (slower, but thorough)
3. **OpenAI Whisper** converts the audio into a complete transcript
4. **OpenAI GPT-4o-mini** analyzes all the text (title + description + transcript) and structures it into a recipe
5. **Vercel AI SDK** ensures the AI's response is properly formatted for our app
6. Our app saves everything to the database and shows you the final recipe!

**The magic:** Each tool does one thing really well, and together they transform a messy cooking video into a perfectly organized recipe! 🎉

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
     - `DATABASE_URL` (required)
     - `OPENAI_API_KEY` (required)
     - `IG_OEMBED_TOKEN` (optional - only if you want Instagram support)

3. **Deploy!** ✅

### Netlify Alternative

- Connect GitHub repo at [netlify.com](https://netlify.com)
- Build settings:
  - Build command: `npm run build`
  - Publish directory: `.next`
- Add same environment variables

## 🔧 Tech Stack

*Want to understand how these technologies work? Check out the [🧠 Technology Deep Dive](#-technology-deep-dive) section above!*

### **Frontend & Framework**
- **Next.js 15** - React framework with App Router and server-side rendering
- **TypeScript** - Type-safe development with compile-time error checking
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **PWA** - Progressive Web App with offline support and mobile installation

### **Backend & Database**
- **Neon PostgreSQL** - Serverless, auto-scaling PostgreSQL database
- **Drizzle ORM** - Type-safe database queries with TypeScript integration
- **Next.js API Routes** - Serverless functions for backend logic

### **AI & Media Processing** ⭐
- **OpenAI GPT-4o-mini** - Advanced language model for recipe extraction and structuring
- **OpenAI Whisper API** - State-of-the-art speech-to-text transcription
- **Vercel AI SDK** - Structured AI responses with automatic validation
- **yt-dlp** - Universal video/audio downloader supporting 1000+ platforms
- **oEmbed APIs** - Official platform APIs for video metadata

### **External APIs**
- **TikTok oEmbed** - Video metadata and thumbnails (no authentication required)
- **YouTube oEmbed** - Video metadata and thumbnails (no authentication required)  
- **Instagram oEmbed** - Basic video information (requires Facebook Developer token)

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
  - Requires `IG_OEMBED_TOKEN` from Facebook Developer account
  - Without token, Instagram URLs will fail to process
- **Private/Restricted Videos**: Cannot access audio or metadata
- **Very Short Videos**: May not contain enough recipe information

## 🛠 Development

### Database Management

```bash
# Generate new migration
npm run db:generate

# Push schema changes
npm run db:push

# Setup database (first time)
npm run setup
```

### Recipe Migrations

The app includes a robust migration system for updating existing recipes when the schema changes.

#### Quick Migration Guide

```bash
# 1. Always backup first!
node scripts/backup-database.js

# 2. Test migration (dry run)
node scripts/migration-templates/migrate-recipes-template.js --dry-run --limit 1

# 3. Run migration
node scripts/migrate-recipes-YYYY-MM-DD-feature.js
```

#### Migration System Features

- **🔒 Safe Backups**: Automatic JSON backups before any migration
- **🧪 Dry Run Testing**: Test migrations without making changes
- **📊 Progress Tracking**: Detailed logging and progress reports
- **🔄 Error Recovery**: Graceful handling of failed migrations
- **📁 Templates**: Reusable templates for future migrations

For detailed migration documentation, see [`scripts/migration-templates/README.md`](scripts/migration-templates/README.md).

#### Recent Migrations

- **2025-01-09**: Component Structure Migration
  - Migrated 67/88 recipes to multi-component structure
  - Created 130 recipe components (avg 2 per recipe)
  - Examples: "Steak + Mashed Potatoes + Sauce" → 3 components

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