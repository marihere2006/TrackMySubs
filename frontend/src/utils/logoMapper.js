import defaultLogo from '../assets/logos/default.svg';
import netflixLogo from '../assets/logos/netflix.svg';
import spotifyLogo from '../assets/logos/spotify.svg';
import primeVideoLogo from '../assets/logos/primevideo.svg';
import disneyLogo from '../assets/logos/disney.svg';
import youtubePremiumLogo from '../assets/logos/youtubepremium.svg';
import googleOneLogo from '../assets/logos/googleone.svg';
import chatgptLogo from '../assets/logos/chatgpt.svg';
import canvaLogo from '../assets/logos/canva.svg';
import adobeLogo from '../assets/logos/adobe.svg';
import githubLogo from '../assets/logos/github.svg';
import linkedinPremiumLogo from '../assets/logos/linkedinpremium.svg';
import notionLogo from '../assets/logos/notion.svg';
import microsoft365Logo from '../assets/logos/microsoft365.svg';

const logoMap = {
  'netflix': netflixLogo,
  'spotify': spotifyLogo,
  'prime video': primeVideoLogo,
  'amazon prime': primeVideoLogo,
  'disney+': disneyLogo,
  'disney': disneyLogo,
  'youtube premium': youtubePremiumLogo,
  'youtube': youtubePremiumLogo,
  'google one': googleOneLogo,
  'chatgpt': chatgptLogo,
  'canva': canvaLogo,
  'adobe': adobeLogo,
  'adobe creative cloud': adobeLogo,
  'github': githubLogo,
  'github copilot': githubLogo,
  'linkedin premium': linkedinPremiumLogo,
  'linkedin': linkedinPremiumLogo,
  'notion': notionLogo,
  'microsoft 365': microsoft365Logo,
  'office 365': microsoft365Logo
};

// A list of vibrant, premium colors for our dynamic fallback logos
const fallbackColors = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const generateDynamicLogo = (serviceName) => {
  const name = (serviceName || 'S').trim().toUpperCase();
  const letter = name.charAt(0) || 'S';
  
  // Pick a consistent color based on the service name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % fallbackColors.length;
  const bgColor = fallbackColors[colorIndex];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="20" fill="${bgColor}"/>
    <text x="50" y="65" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">${letter}</text>
  </svg>`;
  
  // Convert SVG to Data URL
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const getLocalLogo = (serviceName) => {
  if (!serviceName) return null;
  const normalized = serviceName.toLowerCase().trim();
  return logoMap[normalized] || null;
};

export const getClearbitUrl = (serviceName, website) => {
  let domain = '';
  if (website) {
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      domain = url.hostname;
    } catch(e) {
      // ignore
    }
  }
  if (!domain && serviceName) {
    domain = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  }
  
  if (!domain) return generateDynamicLogo(serviceName);
  // Use Icon Horse API for reliable fetching and better quality
  return `https://icon.horse/icon/${domain}`;
};

export const getLogoForService = (serviceName) => {
  // Backward compatibility just in case
  const local = getLocalLogo(serviceName);
  if (local) return local;
  return getClearbitUrl(serviceName, null);
};
