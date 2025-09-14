import ytdl from '@distube/ytdl-core';
import { spawn } from 'child_process';

export interface VideoMetadata {
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  captions?: string;
}

export interface ExtractedContent {
  title: string;
  description: string;
  thumbnail: string;
  captions: string;
  combinedText: string;
  duration?: number; // in seconds
}

/**
 * Extract comprehensive metadata from YouTube videos
 */
export async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  try {
    console.log('🔍 Extracting YouTube content for:', url);
    
    // Get video info
    const info = await ytdl.getInfo(url);
    
    const title = info.videoDetails.title || '';
    const description = info.videoDetails.description || '';
    const thumbnail = info.videoDetails.thumbnails?.[0]?.url || '';
    const duration = parseInt(info.videoDetails.lengthSeconds || '0', 10);
    
    console.log('📊 YouTube extraction results:');
    console.log(`- Title: ${title.substring(0, 100)}...`);
    console.log(`- Description length: ${description.length} chars`);
    console.log(`- Duration: ${duration} seconds (${Math.round(duration/60)}m)`);
    console.log(`- Thumbnail: ${thumbnail ? 'Found' : 'Not found'}`);
    
    // Try to extract captions if available
    let captions = '';
    try {
      // Look for auto-generated captions
      const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      
      if (captionTracks.length > 0) {
        // Find English captions (auto-generated or manual)
        const englishTrack = captionTracks.find((track: { languageCode: string; baseUrl?: string }) => 
          track.languageCode === 'en' || track.languageCode === 'en-US'
        ) || captionTracks[0];
        
        if (englishTrack?.baseUrl) {
          console.log('📝 Found captions, attempting to fetch...');
          const captionResponse = await fetch(englishTrack.baseUrl);
          const captionXml = await captionResponse.text();
          
          // Parse XML captions and extract text
          captions = parseCaptionXml(captionXml);
          console.log(`- Captions length: ${captions.length} chars`);
        }
      }
    } catch (captionError) {
      console.log('⚠️ Caption extraction failed:', captionError);
      // Continue without captions
    }
    
    // Combine all text sources
    const combinedText = [
      title,
      description,
      captions
    ].filter(Boolean).join('\n\n');
    
    console.log(`✅ Total combined text length: ${combinedText.length} chars`);
    
    return {
      title,
      description,
      thumbnail,
      captions,
      combinedText,
      duration
    };
    
  } catch (error) {
    console.error('❌ YouTube extraction failed:', error);
    
    // Fallback to basic extraction
    return {
      title: '',
      description: '',
      thumbnail: '',
      captions: '',
      combinedText: '',
      duration: 0
    };
  }
}

/**
 * Parse YouTube caption XML and extract clean text
 */
function parseCaptionXml(xml: string): string {
  try {
    // Remove XML tags and decode HTML entities
    const text = xml
      .replace(/<[^>]*>/g, ' ') // Remove XML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return text;
  } catch (error) {
    console.error('Caption parsing failed:', error);
    return '';
  }
}

/**
 * Extract content from TikTok videos (limited by platform restrictions)
 */
export async function extractTikTokContent(url: string): Promise<ExtractedContent> {
  // TikTok has more restrictions, so we'll rely on oEmbed + user input for now
  // Future enhancement: Use TikTok API or scraping techniques
  
  console.log('📱 TikTok extraction (limited) for:', url);
  
  return {
    title: '',
    description: '',
    thumbnail: '',
    captions: '',
    combinedText: '',
    duration: 0
  };
}

/**
 * Extract Instagram content using yt-dlp
 */
export async function extractInstagramContent(url: string): Promise<ExtractedContent> {
  try {
    console.log('📸 Extracting Instagram content for:', url);
    
    // Use yt-dlp to get Instagram metadata (no download)
    
    return new Promise((resolve) => {
      const ytdlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-download',
        url
      ]);
      
      let output = '';
      let errorOutput = '';
      
      ytdlp.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
      
      ytdlp.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });
      
      ytdlp.on('close', (code: number) => {
        if (code === 0 && output.trim()) {
          try {
            const info = JSON.parse(output.trim());
            
            const title = info.title || '';
            const description = info.description || '';
            const thumbnail = info.thumbnail || '';
            const duration = info.duration || 0;
            
            console.log('📊 Instagram extraction results:');
            console.log(`- Title: ${title.substring(0, 100)}...`);
            console.log(`- Description length: ${description.length} chars`);
            console.log(`- Duration: ${duration} seconds`);
            console.log(`- Thumbnail: ${thumbnail ? 'Found' : 'Not found'}`);
            
            resolve({
              title,
              description,
              thumbnail,
              captions: '',
              combinedText: [title, description].filter(Boolean).join('\n\n'),
              duration
            });
          } catch (parseError) {
            console.error('❌ Failed to parse Instagram metadata JSON:', parseError);
            resolve({
              title: '',
              description: '',
              thumbnail: '',
              captions: '',
              combinedText: '',
              duration: 0
            });
          }
        } else {
          console.error('❌ Instagram metadata extraction failed:', errorOutput);
          resolve({
            title: '',
            description: '',
            thumbnail: '',
            captions: '',
            combinedText: '',
            duration: 0
          });
        }
      });
    });
  } catch (error) {
    console.error('❌ Instagram content extraction error:', error);
    return {
      title: '',
      description: '',
      thumbnail: '',
      captions: '',
      combinedText: '',
      duration: 0
    };
  }
}

/**
 * Main function to extract content based on platform
 */
export async function extractVideoContent(url: string): Promise<ExtractedContent> {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return extractYouTubeContent(url);
  } else if (lowerUrl.includes('tiktok.com')) {
    return extractTikTokContent(url);
  } else if (lowerUrl.includes('instagram.com')) {
    return extractInstagramContent(url);
  } else {
    // Unsupported platform
    return {
      title: '',
      description: '',
      thumbnail: '',
      captions: '',
      combinedText: '',
      duration: 0
    };
  }
}
