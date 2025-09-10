/**
 * YouTube fallback methods when yt-dlp fails due to rate limiting
 */

export interface YouTubeFallbackResult {
  success: boolean;
  transcript?: string;
  captions?: string;
  error?: string;
}

/**
 * Extract video ID from YouTube URL
 */
function extractYouTubeVideoId(url: string): string | null {
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

/**
 * Option 1: Get YouTube video metadata (title + description) using YouTube Data API
 * This works without OAuth and provides rich content for recipe extraction
 */
export async function getYouTubeMetadata(videoUrl: string): Promise<YouTubeFallbackResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'YouTube API key not configured' };
  }

  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    return { success: false, error: 'Invalid YouTube URL' };
  }

  try {
    console.log('📺 Getting YouTube video metadata via API...');
    
    // Get video details (title, description, etc.)
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );

    if (!videoResponse.ok) {
      return { success: false, error: `YouTube API error: ${videoResponse.status}` };
    }

    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      return { success: false, error: 'Video not found or not accessible' };
    }

    const video = videoData.items[0];
    const title = video.snippet.title || '';
    const description = video.snippet.description || '';
    
    console.log('✅ YouTube metadata retrieved:', {
      title: title.substring(0, 50) + '...',
      descriptionLength: description.length
    });

    // Combine title and description as "transcript"
    const combinedContent = `TITLE: ${title}\n\nDESCRIPTION: ${description}`;
    
    return {
      success: true,
      transcript: combinedContent,
      captions: combinedContent // Use same content for both
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Option 2: Use a third-party API service
 * This is a placeholder - you'd need to implement with a specific service
 */
export async function getYouTubeTranscriptFromAPI(videoUrl: string): Promise<YouTubeFallbackResult> {
  // Example using a hypothetical service
  // You could use services like:
  // - AssemblyAI
  // - Rev.ai
  // - Deepgram
  // - Or any other transcription service that accepts YouTube URLs
  
  return { success: false, error: 'Third-party API not implemented' };
}

/**
 * Option 3: Enhanced yt-dlp with different strategies
 */
export async function tryEnhancedYtDlp(videoUrl: string): Promise<YouTubeFallbackResult> {
  const strategies = [
    // Strategy 1: Use different user agent
    '--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"',
    
    // Strategy 2: Use different extractor options
    '--extractor-args "youtube:player_client=web"',
    
    // Strategy 3: Add delays and retries
    '--sleep-requests 1 --max-sleep-interval 5',
    
    // Strategy 4: Use IPv6 if available
    '--force-ipv6',
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`🔄 Trying YouTube strategy ${i + 1}/${strategies.length}`);
      
      // This would integrate with your existing yt-dlp logic
      // but with different flags to avoid rate limiting
      
      // For now, return failure to indicate this needs implementation
      return { success: false, error: 'Enhanced yt-dlp strategies not implemented' };
      
    } catch (error) {
      console.log(`❌ Strategy ${i + 1} failed:`, error);
      continue;
    }
  }

  return { success: false, error: 'All yt-dlp strategies failed' };
}

/**
 * Main fallback function - tries multiple methods
 */
export async function getYouTubeContentWithFallback(videoUrl: string): Promise<YouTubeFallbackResult> {
  console.log('🔄 Attempting YouTube content extraction with fallback methods...');

  // Try method 1: YouTube Data API (metadata)
  console.log('📺 Trying YouTube Data API...');
  const apiResult = await getYouTubeMetadata(videoUrl);
  if (apiResult.success) {
    console.log('✅ YouTube Data API successful');
    return apiResult;
  }
  console.log('❌ YouTube Data API failed:', apiResult.error);

  // Try method 2: Enhanced yt-dlp strategies
  console.log('🛠️ Trying enhanced yt-dlp strategies...');
  const ytDlpResult = await tryEnhancedYtDlp(videoUrl);
  if (ytDlpResult.success) {
    console.log('✅ Enhanced yt-dlp successful');
    return ytDlpResult;
  }
  console.log('❌ Enhanced yt-dlp failed:', ytDlpResult.error);

  // Try method 3: Third-party API
  console.log('🌐 Trying third-party API...');
  const thirdPartyResult = await getYouTubeTranscriptFromAPI(videoUrl);
  if (thirdPartyResult.success) {
    console.log('✅ Third-party API successful');
    return thirdPartyResult;
  }
  console.log('❌ Third-party API failed:', thirdPartyResult.error);

  return {
    success: false,
    error: 'All YouTube fallback methods failed'
  };
}
