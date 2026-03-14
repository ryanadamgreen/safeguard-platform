/**
 * In-memory store for DNS query logs received from the iOS app.
 * Persists across API calls while the dev server runs. Resets on restart.
 */

export interface DnsMonitorEntry {
  device_id: string;
  domain: string;
  timestamp: string;
}

class DnsMonitorStore {
  private entries: DnsMonitorEntry[] = [];
  private maxEntries = 1000;

  addEntry(entry: DnsMonitorEntry) {
    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  getEntries(limit: number = 100): DnsMonitorEntry[] {
    return this.entries.slice(0, limit);
  }

  getCount(): number {
    return this.entries.length;
  }

  clear() {
    this.entries = [];
  }
}

export const dnsMonitorStore = new DnsMonitorStore();
