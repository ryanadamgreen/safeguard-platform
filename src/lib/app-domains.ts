/**
 * Static domain → app/service name lookup.
 * Used in the Edge Runtime DNS handler — must be pure JS (no Node.js APIs).
 *
 * Matching: we strip leading subdomains one level at a time and check each
 * candidate against the map, so `graph.instagram.com` matches `instagram.com`.
 *
 * Two categories:
 *  - Apps: user-facing applications (shown with colour badges in the monitor)
 *  - Infrastructure: CDN / analytics / tracking services (labelled but muted)
 */

export const APP_DOMAIN_MAP: Record<string, string> = {
  // ── Social Media ─────────────────────────────────────────────────────────
  "instagram.com": "Instagram",
  "cdninstagram.com": "Instagram",
  "tiktok.com": "TikTok",
  "tiktokv.com": "TikTok",
  "musical.ly": "TikTok",
  "byteoversea.com": "TikTok",
  "ibytedtos.com": "TikTok",
  "tiktokcdn.com": "TikTok",
  "snapchat.com": "Snapchat",
  "sc-cdn.net": "Snapchat",
  "snap.com": "Snapchat",
  "twitter.com": "X (Twitter)",
  "x.com": "X (Twitter)",
  "twimg.com": "X (Twitter)",
  "t.co": "X (Twitter)",
  "facebook.com": "Facebook",
  "fbcdn.net": "Facebook",
  "fbsbx.com": "Facebook",
  "fb.com": "Facebook",
  "discord.com": "Discord",
  "discordapp.com": "Discord",
  "discordapp.net": "Discord",
  "discord.gg": "Discord",
  "reddit.com": "Reddit",
  "redd.it": "Reddit",
  "redditmedia.com": "Reddit",
  "redditstatic.com": "Reddit",
  "reddit.net": "Reddit",
  "pinterest.com": "Pinterest",
  "pinimg.com": "Pinterest",
  "tumblr.com": "Tumblr",
  "bereal.com": "BeReal",
  "bere.al": "BeReal",
  "telegram.org": "Telegram",
  "t.me": "Telegram",
  "whatsapp.com": "WhatsApp",
  "whatsapp.net": "WhatsApp",
  "linkedin.com": "LinkedIn",
  "licdn.com": "LinkedIn",

  // ── Messaging & Communication ─────────────────────────────────────────────
  "signal.org": "Signal",
  "signal.me": "Signal",
  "kik.com": "Kik",
  "line.me": "Line",
  "line-scdn.net": "Line",

  // ── Video & Streaming ─────────────────────────────────────────────────────
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "ytimg.com": "YouTube",
  "googlevideo.com": "YouTube",
  "yt3.ggpht.com": "YouTube",
  "netflix.com": "Netflix",
  "nflxvideo.net": "Netflix",
  "nflximg.net": "Netflix",
  "disneyplus.com": "Disney+",
  "disney-plus.net": "Disney+",
  "dssott.com": "Disney+",
  "primevideo.com": "Amazon Prime Video",
  "aiv-cdn.net": "Amazon Prime Video",
  "twitch.tv": "Twitch",
  "jtvnw.net": "Twitch",
  "twitchsvc.net": "Twitch",
  "bbc.co.uk": "BBC iPlayer",
  "bbc.com": "BBC iPlayer",
  "bbci.co.uk": "BBC iPlayer",

  // ── Gaming ────────────────────────────────────────────────────────────────
  "roblox.com": "Roblox",
  "rbxcdn.com": "Roblox",
  "robloxlabs.com": "Roblox",
  "steampowered.com": "Steam",
  "steamcontent.com": "Steam",
  "steam.com": "Steam",
  "steamstatic.com": "Steam",
  "epicgames.com": "Epic Games",
  "fortnite.com": "Fortnite",
  "minecraft.net": "Minecraft",
  "minecraftservices.com": "Minecraft",
  "xbox.com": "Xbox",
  "xboxlive.com": "Xbox",
  "playstation.com": "PlayStation",
  "playstation.net": "PlayStation",
  "ea.com": "EA Games",
  "easports.com": "EA Games",
  "activision.com": "Activision",
  "blizzard.com": "Battle.net",
  "battle.net": "Battle.net",
  "riotgames.com": "Riot Games",

  // ── Music ─────────────────────────────────────────────────────────────────
  "spotify.com": "Spotify",
  "scdn.co": "Spotify",
  "spotifycdn.com": "Spotify",
  "soundcloud.com": "SoundCloud",
  "sndcdn.com": "SoundCloud",

  // ── Shopping ──────────────────────────────────────────────────────────────
  "amazon.com": "Amazon",
  "amazon.co.uk": "Amazon",

  // ── Search ────────────────────────────────────────────────────────────────
  "google.com": "Google",
  "bing.com": "Bing",
  "duckduckgo.com": "DuckDuckGo",
};

/**
 * Infrastructure domains: CDN, analytics, tracking, ad networks.
 * These are labelled in the monitor but not counted as "apps".
 */
export const INFRA_DOMAIN_MAP: Record<string, string> = {
  // ── CDN & Hosting ─────────────────────────────────────────────────────────
  "cloudfront.net": "Amazon CloudFront",
  "fastly.net": "Fastly CDN",
  "fastlylb.net": "Fastly CDN",
  "akamaized.net": "Akamai CDN",
  "akamai.net": "Akamai CDN",
  "akamaiedge.net": "Akamai CDN",
  "edgekey.net": "Akamai CDN",
  "llnwd.net": "Limelight CDN",
  "cloudflare.com": "Cloudflare",
  "cloudflare-dns.com": "Cloudflare DNS",
  "cdn77.com": "CDN77",
  "keycdn.com": "KeyCDN",
  "bunnycdn.com": "BunnyCDN",
  "vercel.app": "Vercel",
  "netlify.com": "Netlify",
  "netlify.app": "Netlify",
  "github.io": "GitHub Pages",
  "githubusercontent.com": "GitHub",
  "github.com": "GitHub",

  // ── Apple Services ────────────────────────────────────────────────────────
  "apple.com": "Apple",
  "icloud.com": "iCloud",
  "mzstatic.com": "App Store",
  "apple-dns.net": "Apple DNS",
  "applebot.apple.com": "Apple",
  "cdn-apple.com": "Apple CDN",
  "push.apple.com": "Apple Push",

  // ── Google Services ───────────────────────────────────────────────────────
  "googleapis.com": "Google APIs",
  "gstatic.com": "Google Static",
  "google-analytics.com": "Google Analytics",
  "googletagmanager.com": "Google Tag Manager",
  "googletagservices.com": "Google Ads",
  "doubleclick.net": "Google Ads",
  "googlesyndication.com": "Google Ads",
  "gvt1.com": "Google Video",
  "gvt2.com": "Google Video",
  "ggpht.com": "Google",
  "googleusercontent.com": "Google",
  "gmail.com": "Gmail",
  "fonts.gstatic.com": "Google Fonts",
  "recaptcha.net": "Google reCAPTCHA",

  // ── Analytics & Tracking ─────────────────────────────────────────────────
  "piano.io": "Piano Analytics",
  "mparticle.com": "mParticle",
  "segment.com": "Segment",
  "segment.io": "Segment",
  "mixpanel.com": "Mixpanel",
  "amplitude.com": "Amplitude",
  "hotjar.com": "Hotjar",
  "fullstory.com": "FullStory",
  "heap.io": "Heap Analytics",
  "clarity.ms": "Microsoft Clarity",
  "newrelic.com": "New Relic",
  "nr-data.net": "New Relic",
  "datadoghq.com": "Datadog",
  "sentry.io": "Sentry",
  "bugsnag.com": "Bugsnag",
  "crashlytics.com": "Firebase Crashlytics",
  "firebase.io": "Firebase",
  "firebaseio.com": "Firebase",
  "firebase.com": "Firebase",
  "firebaseapp.com": "Firebase",

  // ── Ad Networks ───────────────────────────────────────────────────────────
  "amazon-adsystem.com": "Amazon Ads",
  "advertising.com": "AOL Advertising",
  "adnxs.com": "AppNexus",
  "pubmatic.com": "PubMatic",
  "rubiconproject.com": "Rubicon",
  "openx.net": "OpenX",
  "criteo.com": "Criteo",
  "taboola.com": "Taboola",
  "outbrain.com": "Outbrain",
  "moatads.com": "Oracle MOAT",
  "adsrvr.org": "The Trade Desk",

  // ── Microsoft ─────────────────────────────────────────────────────────────
  "microsoft.com": "Microsoft",
  "live.com": "Microsoft Live",
  "office.com": "Microsoft Office",
  "outlook.com": "Outlook",
  "microsoftonline.com": "Microsoft 365",
  "azurefd.net": "Azure CDN",
  "azureedge.net": "Azure CDN",
  "bing.com": "Bing",

  // ── Misc Infrastructure ───────────────────────────────────────────────────
  "ocsp.apple.com": "Apple OCSP",
  "ocsp.digicert.com": "DigiCert OCSP",
  "letsencrypt.org": "Let's Encrypt",
  "akadns.net": "Akamai DNS",
  "edgesuite.net": "Akamai",
  "ntp.org": "NTP Time Sync",
  "pool.ntp.org": "NTP Time Sync",
  "time.apple.com": "Apple NTP",
  "time.cloudflare.com": "Cloudflare NTP",
};

/**
 * Returns the app name for a given domain, or null if unrecognised.
 * Only matches user-facing apps (not infrastructure/CDN).
 */
export function detectApp(domain: string): string | null {
  const lower = domain.toLowerCase();
  const parts = lower.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (APP_DOMAIN_MAP[candidate]) return APP_DOMAIN_MAP[candidate];
  }
  return null;
}

/**
 * Returns the service label for infrastructure domains (CDN, analytics, etc.)
 * or falls back to detecting an app name.
 */
export function detectService(domain: string): string | null {
  const lower = domain.toLowerCase();
  const parts = lower.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (APP_DOMAIN_MAP[candidate]) return APP_DOMAIN_MAP[candidate];
    if (INFRA_DOMAIN_MAP[candidate]) return INFRA_DOMAIN_MAP[candidate];
  }
  return null;
}

/**
 * Extracts the root domain (eTLD+1 approximation) for display.
 * e.g. "cdn.piano.io" → "piano.io", "www.bbc.co.uk" → "bbc.co.uk"
 */
export function rootDomain(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  // Handle common two-part TLDs: co.uk, com.au, org.uk, etc.
  const twoPartTLDs = new Set([
    "co.uk","org.uk","me.uk","net.uk","ac.uk","gov.uk",
    "com.au","net.au","org.au","co.nz","com.nz",
    "co.za","com.br","co.in","com.mx",
  ]);
  if (parts.length >= 3) {
    const last2 = parts.slice(-2).join(".");
    if (twoPartTLDs.has(last2) && parts.length >= 4) {
      return parts.slice(-3).join(".");
    }
  }
  return parts.length >= 2 ? parts.slice(-2).join(".") : domain;
}
