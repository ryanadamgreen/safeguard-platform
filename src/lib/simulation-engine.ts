/**
 * Simulation engine for local development and testing.
 *
 * Maintains an in-memory state that mimics what UniFi controllers and
 * NextDNS would provide in production. State resets on server restart.
 */

// ── Random helpers ──

function randomMac(): string {
  const hex = () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return [hex(), hex(), hex(), hex(), hex(), hex()].join(":");
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

// ── Types matching real APIs ──

export interface UnifiClient {
  mac: string;
  hostname: string;
  ip: string;
  oui: string; // manufacturer OUI lookup
  network: string;
  is_wired: boolean;
  last_seen: number; // unix epoch
  uptime: number;
  tx_bytes: number;
  rx_bytes: number;
  os_name: string;
  dev_cat: number; // device category id
  dev_family: number;
  fingerprint: DeviceFingerprint;
  blocked: boolean;
}

export interface DeviceFingerprint {
  manufacturer: string;
  hostname: string;
  os_type: string;
  model_prediction: string;
  dhcp_fingerprint: string;
}

export interface NextDnsLogEntry {
  timestamp: string;
  domain: string;
  root_domain: string;
  client_ip: string;
  client_mac: string;
  protocol: string;
  status: "allowed" | "blocked";
  reasons: string[];
  categories: string[];
  device_name: string;
}

// ── Safeguarding domain lists ──

const FLAGGED_DOMAINS: Record<string, { category: string; domains: string[] }> = {
  adult_content: {
    category: "Adult Content",
    domains: [
      "explicit-site.example.com",
      "adult-content.example.com",
      "nsfw-site.example.com",
    ],
  },
  gambling: {
    category: "Gambling",
    domains: [
      "bet365.com",
      "williamhill.com",
      "paddypower.com",
      "betfair.com",
      "skybet.com",
      "ladbrokes.com",
      "888casino.com",
    ],
  },
  violence: {
    category: "Violence",
    domains: [
      "violent-content.example.com",
      "gore-site.example.com",
    ],
  },
  drugs: {
    category: "Drugs",
    domains: [
      "drug-info.example.com",
      "substance-forum.example.com",
    ],
  },
  self_harm: {
    category: "Self Harm",
    domains: [
      "self-harm-forum.example.com",
      "harmful-content.example.com",
    ],
  },
  proxy_vpn: {
    category: "Proxy / VPN Attempts",
    domains: [
      "nordvpn.com",
      "expressvpn.com",
      "surfshark.com",
      "protonvpn.com",
      "hide.me",
    ],
  },
};

const SAFE_DOMAINS = [
  "google.com",
  "youtube.com",
  "bbc.co.uk",
  "wikipedia.org",
  "scratch.mit.edu",
  "khanacademy.org",
  "coolmathgames.com",
  "roblox.com",
  "minecraft.net",
  "apple.com",
  "spotify.com",
  "netflix.com",
  "amazon.co.uk",
];

const MANUFACTURERS = ["Apple", "Samsung", "Huawei", "Google", "Xiaomi", "HP", "Dell", "Lenovo"];
const OS_TYPES = ["iOS", "Android", "Windows", "macOS", "iPadOS", "ChromeOS"];
const DEVICE_MODELS: Record<string, string[]> = {
  Apple: ["iPhone 14", "iPhone 15", "iPad Air", "MacBook Air"],
  Samsung: ["Galaxy S23", "Galaxy A54", "Galaxy Tab S9"],
  Huawei: ["P40 Lite", "MatePad"],
  Google: ["Pixel 8", "Pixel 7a"],
  Xiaomi: ["Redmi Note 12", "Poco X5"],
  HP: ["HP Pavilion 15", "HP Chromebook"],
  Dell: ["Dell Inspiron 14", "Dell Latitude"],
  Lenovo: ["ThinkPad T14", "IdeaPad 3"],
};
const HOSTNAMES = [
  "ABs-iPhone", "CDs-Samsung", "EFs-Laptop", "GHs-Phone",
  "Kids-iPad", "Bedroom-Tablet", "Living-Room-TV",
];

// ── In-memory simulation state ──

class SimulationState {
  clients: UnifiClient[] = [];
  dnsLogs: NextDnsLogEntry[] = [];
  private _initialized = false;

  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    // Seed with known devices (matching mock-data.ts devices)
    this.clients = [
      this.createClient("AA:BB:CC:11:22:33", "ABs-iPhone", "Apple", "iOS", "iPhone 14", false),
      this.createClient("AA:BB:CC:44:55:66", "ABs-iPad", "Apple", "iPadOS", "iPad Air", false),
      this.createClient("DD:EE:FF:11:22:33", "Galaxy-S23", "Samsung", "Android", "Galaxy S23", false),
      this.createClient("11:22:33:AA:BB:CC", "HP-Pavilion", "HP", "Windows", "HP Pavilion 15", true),
      this.createClient("44:55:66:DD:EE:FF", "GHs-iPhone", "Apple", "iOS", "iPhone 13", false),
    ];

    // Seed with some DNS logs
    this.seedDnsLogs();
  }

  private createClient(
    mac: string,
    hostname: string,
    manufacturer: string,
    os: string,
    model: string,
    blocked: boolean,
  ): UnifiClient {
    return {
      mac,
      hostname,
      ip: `192.168.1.${Math.floor(Math.random() * 200) + 10}`,
      oui: manufacturer,
      network: "Children-WiFi",
      is_wired: false,
      last_seen: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
      uptime: Math.floor(Math.random() * 86400),
      tx_bytes: Math.floor(Math.random() * 500_000_000),
      rx_bytes: Math.floor(Math.random() * 2_000_000_000),
      os_name: os,
      dev_cat: 1,
      dev_family: 4,
      fingerprint: {
        manufacturer,
        hostname,
        os_type: os,
        model_prediction: model,
        dhcp_fingerprint: `1,3,6,15,119,252`,
      },
      blocked,
    };
  }

  private seedDnsLogs() {
    // Generate some historic logs
    for (let i = 0; i < 30; i++) {
      const client = randomFrom(this.clients);
      const isFlagged = Math.random() < 0.3;

      if (isFlagged) {
        const categoryKey = randomFrom(Object.keys(FLAGGED_DOMAINS));
        const cat = FLAGGED_DOMAINS[categoryKey];
        const domain = randomFrom(cat.domains);
        this.dnsLogs.push({
          timestamp: minutesAgo(Math.floor(Math.random() * 1440)),
          domain,
          root_domain: domain,
          client_ip: client.ip,
          client_mac: client.mac,
          protocol: "DoH",
          status: "blocked",
          reasons: ["blocklist"],
          categories: [cat.category],
          device_name: client.hostname,
        });
      } else {
        const domain = randomFrom(SAFE_DOMAINS);
        this.dnsLogs.push({
          timestamp: minutesAgo(Math.floor(Math.random() * 1440)),
          domain,
          root_domain: domain,
          client_ip: client.ip,
          client_mac: client.mac,
          protocol: "DoH",
          status: "allowed",
          reasons: [],
          categories: [],
          device_name: client.hostname,
        });
      }
    }

    // Sort newest first
    this.dnsLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // ── Actions ──

  /** Add a new unknown device to the network */
  addUnknownDevice(): UnifiClient {
    const manufacturer = randomFrom(MANUFACTURERS);
    const os = randomFrom(OS_TYPES);
    const models = DEVICE_MODELS[manufacturer] ?? ["Unknown"];
    const model = randomFrom(models);
    const hostname = `Unknown-${randomMac().slice(0, 8).replace(/:/g, "")}`;

    const client = this.createClient(
      randomMac(),
      hostname,
      manufacturer,
      os,
      model,
      true, // unknown devices auto-blocked
    );
    this.clients.push(client);
    return client;
  }

  /** Simulate a device reconnecting with a new randomised MAC */
  simulateMacRandomisation(originalMac: string): {
    oldMac: string;
    newMac: string;
    matched: boolean;
    fingerprint: DeviceFingerprint;
  } | null {
    const client = this.clients.find((c) => c.mac === originalMac);
    if (!client) return null;

    const oldMac = client.mac;
    const newMac = randomMac();
    client.mac = newMac;
    client.last_seen = Math.floor(Date.now() / 1000);

    return {
      oldMac,
      newMac,
      matched: true,
      fingerprint: client.fingerprint,
    };
  }

  /** Block or unblock a device by MAC */
  setDeviceBlocked(mac: string, blocked: boolean): boolean {
    const client = this.clients.find((c) => c.mac === mac);
    if (!client) return false;
    client.blocked = blocked;
    return true;
  }

  /** Generate a DNS event (flagged or safe) */
  generateDnsEvent(options?: {
    mac?: string;
    category?: string;
    domain?: string;
  }): NextDnsLogEntry {
    const mac = options?.mac;
    const client = mac
      ? this.clients.find((c) => c.mac === mac) ?? randomFrom(this.clients)
      : randomFrom(this.clients);

    let domain: string;
    let status: "allowed" | "blocked";
    let categories: string[];
    let reasons: string[];

    if (options?.category && options.category in FLAGGED_DOMAINS) {
      const cat = FLAGGED_DOMAINS[options.category];
      domain = options?.domain ?? randomFrom(cat.domains);
      status = "blocked";
      categories = [cat.category];
      reasons = ["blocklist"];
    } else if (options?.domain) {
      // Check if the supplied domain is in any flagged list
      const match = Object.values(FLAGGED_DOMAINS).find((cat) =>
        cat.domains.includes(options.domain!)
      );
      domain = options.domain;
      status = match ? "blocked" : "allowed";
      categories = match ? [match.category] : [];
      reasons = match ? ["blocklist"] : [];
    } else {
      // Random: 30% chance of flagged
      if (Math.random() < 0.3) {
        const categoryKey = randomFrom(Object.keys(FLAGGED_DOMAINS));
        const cat = FLAGGED_DOMAINS[categoryKey];
        domain = randomFrom(cat.domains);
        status = "blocked";
        categories = [cat.category];
        reasons = ["blocklist"];
      } else {
        domain = randomFrom(SAFE_DOMAINS);
        status = "allowed";
        categories = [];
        reasons = [];
      }
    }

    const entry: NextDnsLogEntry = {
      timestamp: new Date().toISOString(),
      domain,
      root_domain: domain,
      client_ip: client.ip,
      client_mac: client.mac,
      protocol: "DoH",
      status,
      reasons,
      categories,
      device_name: client.hostname,
    };

    this.dnsLogs.unshift(entry);
    // Keep log size bounded
    if (this.dnsLogs.length > 500) {
      this.dnsLogs = this.dnsLogs.slice(0, 500);
    }

    return entry;
  }

  /** Generate a burst of flagged events (simulates behaviour pattern) */
  generateBehaviourPattern(
    mac: string,
    category: string,
    count: number = 5,
  ): NextDnsLogEntry[] {
    const events: NextDnsLogEntry[] = [];
    for (let i = 0; i < count; i++) {
      events.push(this.generateDnsEvent({ mac, category }));
    }
    return events;
  }

  /** Attempt to match an unknown device by fingerprint */
  matchFingerprint(fingerprint: Partial<DeviceFingerprint>): {
    matched: boolean;
    matchedDevice: UnifiClient | null;
    score: number;
    factors: string[];
  } {
    let bestMatch: UnifiClient | null = null;
    let bestScore = 0;
    let bestFactors: string[] = [];

    for (const client of this.clients) {
      let score = 0;
      const factors: string[] = [];
      const fp = client.fingerprint;

      if (fingerprint.manufacturer && fp.manufacturer === fingerprint.manufacturer) {
        score += 20;
        factors.push("manufacturer");
      }
      if (fingerprint.hostname && fp.hostname === fingerprint.hostname) {
        score += 40;
        factors.push("hostname");
      }
      if (fingerprint.os_type && fp.os_type === fingerprint.os_type) {
        score += 15;
        factors.push("os_type");
      }
      if (fingerprint.model_prediction && fp.model_prediction === fingerprint.model_prediction) {
        score += 25;
        factors.push("model_prediction");
      }
      if (fingerprint.dhcp_fingerprint && fp.dhcp_fingerprint === fingerprint.dhcp_fingerprint) {
        score += 30;
        factors.push("dhcp_fingerprint");
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = client;
        bestFactors = factors;
      }
    }

    // Threshold: need at least 60 to consider it a match
    const matched = bestScore >= 60;
    return {
      matched,
      matchedDevice: matched ? bestMatch : null,
      score: bestScore,
      factors: bestFactors,
    };
  }
}

// Singleton — persists across API calls while server is running
export const simulation = new SimulationState();
simulation.initialize();
