// ── Core Types ──

export interface Home {
  id: string;
  name: string;
  address: string;
  router_id: string;
  nextdns_profile_id: string;
  created_at: string;
}

export interface Child {
  id: string;
  initials: string;
  age: number;
  home_id: string;
  created_at: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  mac_address: string | null;
  child_id: string | null;
  home_id: string;
  last_connected: string | null;
  internet_enabled: boolean;
  schedule_start: string | null; // HH:MM
  schedule_end: string | null;   // HH:MM
  manufacturer: string | null;
  hostname: string | null;
  os_type: string | null;
  model_prediction: string | null;
  created_at: string;
}

export interface UnknownDevice {
  id: string;
  mac_address: string;
  manufacturer: string | null;
  device_type: string | null;
  first_detected: string;
  home_id: string;
  blocked: boolean;
}

export interface SafeguardingReport {
  id: string;
  child_id: string;
  child_initials: string;
  device_name: string;
  category: SafeguardingCategory;
  domain: string;
  action: "blocked" | "allowed";
  timestamp: string;
  home_id: string;
}

export interface SafeguardingAlert {
  id: string;
  child_initials: string;
  category: SafeguardingCategory;
  timestamp: string;
  home_id: string;
  type: "single" | "pattern";
  details?: string;
  attempts?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  home_ids: string[];
}

// ── Enums ──

export type UserRole = "platform_admin" | "home_manager";

export type DeviceType = "phone" | "tablet" | "laptop" | "desktop" | "gaming_console" | "smart_tv" | "other";

export type SafeguardingCategory =
  | "adult_content"
  | "gambling"
  | "violence"
  | "drugs"
  | "self_harm"
  | "proxy_vpn";

export const SAFEGUARDING_CATEGORY_LABELS: Record<SafeguardingCategory, string> = {
  adult_content: "Adult Content",
  gambling: "Gambling",
  violence: "Violence",
  drugs: "Drugs",
  self_harm: "Self Harm",
  proxy_vpn: "Proxy / VPN Attempts",
};

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  phone: "Phone",
  tablet: "Tablet",
  laptop: "Laptop",
  desktop: "Desktop",
  gaming_console: "Gaming Console",
  smart_tv: "Smart TV",
  other: "Other",
};
