import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Initialize OpenAI client lazily
function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export interface WhisperTranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
  audioFile?: string;
  duration?: number;
}

/**
 * Extract audio from video and transcribe using Whisper API
 */
export async function transcribeVideoWithWhisper(videoUrl: string): Promise<WhisperTranscriptionResult> {
  console.log('🎤 Starting Whisper transcription for:', videoUrl);
  
  let tempAudioFile: string | null = null;
  
  try {
    // Step 1: Download audio using yt-dlp
    console.log('📥 Downloading audio...');
    const audioResult = await downloadAudio(videoUrl);
    
    if (!audioResult.success || !audioResult.filePath) {
      return {
        text: '',
        success: false,
        error: audioResult.error || 'Failed to download audio'
      };
    }
    
    tempAudioFile = audioResult.filePath;
    console.log(`✅ Audio downloaded: ${tempAudioFile} (${audioResult.duration}s)`);
    
    // Step 2: Transcribe using Whisper API
    console.log('🗣️ Transcribing with Whisper...');
    
    // Create a File object for the API
    const audioBuffer = await fs.readFile(tempAudioFile);
    const audioFile = new File([new Uint8Array(audioBuffer)], path.basename(tempAudioFile), {
      type: 'audio/mpeg'
    });
    
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Optimize for English
      response_format: 'text',
      temperature: 0.0, // More deterministic output
    });
    
    console.log(`✅ Transcription complete: ${transcription.length} characters`);
    
    return {
      text: transcription,
      success: true,
      audioFile: tempAudioFile,
      duration: audioResult.duration
    };
    
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error);
    
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown transcription error'
    };
    
  } finally {
    // Clean up temporary audio file
    if (tempAudioFile) {
      try {
        await fs.unlink(tempAudioFile);
        console.log('🗑️ Cleaned up temp audio file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp file:', cleanupError);
      }
    }
  }
}

/**
 * Download audio from video using yt-dlp
 */
async function downloadAudio(videoUrl: string): Promise<{
  success: boolean;
  filePath?: string;
  duration?: number;
  error?: string;
}> {
  const tempDir = '/tmp';
  const outputTemplate = path.join(tempDir, 'recipe-audio-%(id)s.%(ext)s');
  
  try {
    // Use yt-dlp to download best audio quality
    const command = `yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 --output "${outputTemplate}" "${videoUrl}"`;
    
    console.log('🎵 Executing:', command);
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 60000 // 60 second timeout
    });
    
    console.log('yt-dlp output:', stdout);
    if (stderr) console.log('yt-dlp stderr:', stderr);
    
    // Find the downloaded file - look for any .mp3 file in the temp directory
    const files = await fs.readdir(tempDir);
    const audioFiles = files.filter(file => file.startsWith('recipe-audio-') && file.endsWith('.mp3'));
    
    if (audioFiles.length === 0) {
      throw new Error('No audio file found after download');
    }
    
    // Use the first (and likely only) audio file found
    const expectedFile = path.join(tempDir, audioFiles[0]);
    console.log('🎵 Found audio file:', expectedFile);
    
    try {
      const stats = await fs.stat(expectedFile);
      console.log(`📁 Audio file found: ${expectedFile} (${stats.size} bytes)`);
      
      // Get duration using ffprobe if available
      let duration: number | undefined;
      try {
        const { stdout: durationOutput } = await execAsync(
          `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${expectedFile}"`
        );
        duration = parseFloat(durationOutput.trim());
      } catch (durationError) {
        console.warn('⚠️ Could not get audio duration:', durationError);
      }
      
      return {
        success: true,
        filePath: expectedFile,
        duration
      };
      
    } catch {
      throw new Error(`Downloaded audio file not found: ${expectedFile}`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown download error';
    
    // Check if this is the common Vercel/serverless issue
    if (errorMessage.includes('yt-dlp: command not found')) {
      console.warn('⚠️ yt-dlp not available in serverless environment - this is expected on Vercel');
      console.warn('⚠️ Extraction will continue without audio transcription using video metadata only');
    } else {
      console.error('❌ Audio download failed:', error);
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Extract video ID from YouTube URL
 * Currently unused - kept for potential future use
 */
/*
function extractVideoId(url: string): string | null {
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
*/

/**
 * Check if Whisper transcription is available (has API key)
 * Note: We don't check for yt-dlp here because it might be available at runtime
 * even if not detected during build/startup phase
 */
export function isWhisperAvailable(): boolean {
  if (!process.env.OPENAI_API_KEY) {
    console.log('🎤 [WHISPER] OpenAI API key not found - Whisper transcription unavailable');
    return false;
  }
  
  // Only check for API key - let yt-dlp be checked at runtime
  return true;
}

/**
 * Get estimated cost for Whisper transcription
 */
export function estimateWhisperCost(durationMinutes: number): number {
  // Whisper API costs $0.006 per minute
  return durationMinutes * 0.006;
}
