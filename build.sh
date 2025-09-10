#!/bin/bash

# Render build script for Recipe Extractor
echo "🚀 Starting Recipe Extractor build..."

# Install system dependencies
echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y python3 python3-pip ffmpeg

# Install yt-dlp
echo "🎵 Installing yt-dlp..."
pip3 install yt-dlp

# Verify installations
echo "✅ Verifying installations..."
python3 --version
ffmpeg -version | head -1
yt-dlp --version

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm ci

# Build the Next.js application
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build complete!"
