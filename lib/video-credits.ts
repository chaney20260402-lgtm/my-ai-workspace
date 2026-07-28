// lib/video-credits.ts
export const VIDEO_RATES = {
  'grok-imagine-video': {
    imagePerImage: 0.2,
    videoPerSecond: { '480p': 1, '720p': 5, '1080p': 7 },
  },
  'grok-imagine-video-1.5-preview': {
    imagePerImage: 1,
    videoPerSecond: { '480p': 8, '720p': 14, '1080p': 17.5 },
  },
 'kling-turbo': {
    imagePerImage: 0,
    videoPerSecond: { '720p': 10, '1080p': 12 },
  },
  'kling-silent': {
    imagePerImage: 0,
    videoPerSecond: { '720p': 8, '1080p': 10, '4K': 32 },
  },
  'kling-silent-audio': {
    imagePerImage: 0,
    videoPerSecond: { '720p': 11, '1080p': 14 },
  },
  'kling-omni-silent': {
    imagePerImage: 0,
    videoPerSecond: { '720p': 8, '1080p': 10, '4K': 32 },
  },
  'kling-omni-silent-audio': {
    imagePerImage: 0,
    videoPerSecond: { '720p': 10, '1080p': 12, '4K': 32 },
  },
  'kling-omni-ref-video-silent': {
    imagePerImage: 0,
    videoPerSecond: { '720p': 11, '1080p': 14, '4K': 32 },
  },
};

export function getVideoRates(model: string) {
  if (VIDEO_RATES[model as keyof typeof VIDEO_RATES]) {
    return VIDEO_RATES[model as keyof typeof VIDEO_RATES];
  }
  const baseModel = model.replace(/-preview$/, '');
  return VIDEO_RATES[baseModel as keyof typeof VIDEO_RATES] || null;
}

export function calculateVideoCredits(
  model: string,
  resolution: string,
  duration: number,
  imageCount: number = 0
): number {
  const rates = getVideoRates(model);
  if (!rates) return 0;
  const imageCost = rates.imagePerImage * imageCount;
  const ratePerSecond = rates.videoPerSecond[resolution as keyof typeof rates.videoPerSecond];
  if (!ratePerSecond) return 0;
  return Math.ceil(imageCost + ratePerSecond * duration);
}