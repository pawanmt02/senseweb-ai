export const API_BASE_URL = 'http://localhost:8000/api/v1';
export const CACHE_PREFIX = 'senseweb_cache_';
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const MESSAGE_TYPES = {
  CAPTION_IMAGE: 'CAPTION_IMAGE',
  SIMPLIFY_TEXT: 'SIMPLIFY_TEXT',
  GET_PROFILE: 'GET_PROFILE',
  TOGGLE_PROFILE: 'TOGGLE_PROFILE',
  SCAN_PAGE: 'SCAN_PAGE',
  GET_STATUS: 'GET_STATUS'
};

export const PROFILE_KEYS = [
  'bionic_reading',
  'focus_mode',
  'high_contrast',
  'dyslexia_friendly',
  'large_text',
  'reduced_motion',
  'skip_navigation',
  'focus_indicators'
];

export const PROFILE_LABELS = {
  bionic_reading: 'Bionic Reading',
  focus_mode: 'Focus Mode',
  high_contrast: 'High Contrast',
  dyslexia_friendly: 'Dyslexia Friendly',
  large_text: 'Large Text',
  reduced_motion: 'Reduced Motion',
  skip_navigation: 'Skip Navigation',
  focus_indicators: 'Focus Indicators'
};
