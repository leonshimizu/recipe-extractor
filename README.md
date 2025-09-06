# 🍳 Recipe Extractor

Transform your favorite TikTok cooking videos into detailed, structured recipes with AI.

## ✨ Features

- 📱 **PWA Ready** - Install as an app on your phone
- 🎬 **Multi-Platform Support** - TikTok, Instagram, YouTube
- 🤖 **AI-Powered** - GPT-4o-mini extracts ingredients, steps, and timing
- 💰 **Cost Estimation** - Location-based ingredient pricing
- 📚 **Recipe History** - Save and manage all your extracted recipes
- 🔄 **Duplicate Detection** - Automatically finds existing recipes
- 📱 **Mobile-First** - Optimized for mobile usage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- [Neon Database](https://neon.tech) account
- [OpenAI API](https://platform.openai.com) key

### Setup

1. **Clone and install:**
```bash
git clone https://github.com/leonshimizu/recipe-extractor.git
cd recipe-extractor/recipe-nextjs
npm install
```

2. **Environment Setup:**
```bash
cp env-template.txt .env.local
# Edit .env.local with your actual values
```

3. **Database Setup:**
```bash
npm run db:push
```

4. **Run Development:**
```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

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

- **Framework:** Next.js 15 with App Router
- **Database:** Neon (PostgreSQL) with Drizzle ORM
- **AI:** OpenAI GPT-4o-mini with Vercel AI SDK
- **Styling:** Tailwind CSS
- **PWA:** Service Worker + Web App Manifest

## 📱 PWA Installation

1. Visit your deployed app on mobile
2. Tap "Add to Home Screen" 
3. Use as a native app! 📲

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ for the cooking community