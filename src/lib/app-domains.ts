/**
 * Static domain → app name lookup.
 * Used in the Edge Runtime DNS handler — must be pure JS (no Node.js APIs).
 *
 * Matching: we strip leading subdomains one level at a time and check each
 * candidate against the map, so `graph.instagram.com` matches `instagram.com`.
 */

const APP_DOMAIN_MAP: Record<string, string> = {
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
  "amazon-adsystem.com": "Amazon",

  // ── Search & Browsers ─────────────────────────────────────────────────────
  "google.com": "Google",
  "bing.com": "Bing",
  "duckduckgo.com": "DuckDuckGo",
};

/**
 * Returns the app name for a given domain, or null if unrecognised.
 * Strips subdomains iteratively: `graph.instagram.com` → checks
 * `graph.instagram.com`, `instagram.com` → returns "Instagram".
 */
export function detectApp(domain: string): string | null {
  const lower = domain.toLowerCase();
  const parts = lower.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (APP_DOMAIN_MAP[candidate]) {
      return APP_DOMAIN_MAP[candidate];
    }
  }
  return null;
}
