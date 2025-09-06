export type Source = 'youtube' | 'tiktok' | 'instagram' | 'web';

export function detectSource(url: string): Source {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com')) return 'instagram';
  return 'web';
}

export type OEmbed = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
};

export async function fetchYouTubeOEmbed(url: string): Promise<OEmbed> {
  const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('YouTube oEmbed failed');
  return res.json();
}

export async function fetchTikTokOEmbed(url: string): Promise<OEmbed> {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('TikTok oEmbed failed');
  return res.json();
}

export async function fetchInstagramOEmbed(url: string): Promise<OEmbed> {
  const token = process.env.IG_OEMBED_TOKEN;
  if (!token) throw new Error('IG_OEMBED_TOKEN missing');
  const endpoint = `https://graph.facebook.com/v17.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${token}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Instagram oEmbed failed');
  return res.json();
}