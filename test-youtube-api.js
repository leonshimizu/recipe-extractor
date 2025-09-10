#!/usr/bin/env node

/**
 * Test script for YouTube Data API
 * Usage: node test-youtube-api.js "https://youtube.com/shorts/6yFLEkutGQU"
 */

require('dotenv').config({ path: '.env.local' });

async function testYouTubeAPI(videoUrl) {
  console.log('🧪 Testing YouTube Data API...');
  console.log('📺 Video URL:', videoUrl);
  
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('❌ YouTube API key not configured in .env.local');
    console.log('💡 Please set YOUTUBE_API_KEY in your .env.local file');
    process.exit(1);
  }
  
  // Extract video ID
  function extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
  
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    console.error('❌ Invalid YouTube URL');
    process.exit(1);
  }
  
  console.log('🆔 Video ID:', videoId);
  
  try {
    // Test 1: Get video details
    console.log('\n📋 Testing video details API...');
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    console.log('🔗 API URL:', videoUrl);
    
    const videoResponse = await fetch(videoUrl);
    
    console.log('📊 Response status:', videoResponse.status, videoResponse.statusText);
    
    if (!videoResponse.ok) {
      // Get the error details
      const errorText = await videoResponse.text();
      console.log('❌ Error response:', errorText);
      throw new Error(`Video API error: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    
    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      console.error('❌ Video not found or not accessible');
      process.exit(1);
    }
    
    const video = videoData.items[0];
    console.log('✅ Video found:', video.snippet.title);
    console.log('📝 Description length:', video.snippet.description?.length || 0, 'characters');
    
    // Test 2: Get available captions
    console.log('\n📋 Testing captions API...');
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
    );
    
    if (!captionsResponse.ok) {
      throw new Error(`Captions API error: ${captionsResponse.status} ${captionsResponse.statusText}`);
    }
    
    const captionsData = await captionsResponse.json();
    
    if (!captionsData.items || captionsData.items.length === 0) {
      console.log('⚠️ No captions available for this video');
      console.log('💡 This video might not have auto-generated or manual captions');
    } else {
      console.log('✅ Captions found:', captionsData.items.length, 'tracks');
      
      captionsData.items.forEach((caption, index) => {
        console.log(`   ${index + 1}. Language: ${caption.snippet.language}, Type: ${caption.snippet.trackKind}`);
      });
      
      // Try to download first caption (this might require OAuth)
      const firstCaption = captionsData.items[0];
      console.log('\n📥 Attempting to download caption...');
      
      const captionDownloadResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/captions/${firstCaption.id}?key=${apiKey}`
      );
      
      if (captionDownloadResponse.ok) {
        const captionText = await captionDownloadResponse.text();
        console.log('✅ Caption downloaded:', captionText.length, 'characters');
        console.log('📝 Preview:', captionText.substring(0, 200) + '...');
      } else {
        console.log('⚠️ Caption download failed (might need OAuth):', captionDownloadResponse.status);
        console.log('💡 This is normal - caption download often requires OAuth authentication');
      }
    }
    
    console.log('\n🎉 YouTube API test completed successfully!');
    console.log('💡 The API key is working and can access video metadata');
    
  } catch (error) {
    console.error('❌ YouTube API test failed:', error.message);
    process.exit(1);
  }
}

// Get video URL from command line argument
const videoUrl = process.argv[2];
if (!videoUrl) {
  console.log('Usage: node test-youtube-api.js "https://youtube.com/shorts/VIDEO_ID"');
  process.exit(1);
}

testYouTubeAPI(videoUrl);
