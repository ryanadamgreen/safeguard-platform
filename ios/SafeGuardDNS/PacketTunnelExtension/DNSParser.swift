import Foundation

/// Parses DNS domain names from raw network packets.
enum DNSParser {

    /// Extracts the queried domain name from a raw IP/UDP/DNS packet.
    /// Returns nil if the packet isn't a DNS query.
    static func extractDomain(from packet: Data) -> String? {
        guard packet.count > 28 else { return nil } // Minimum: IP(20) + UDP(8) + DNS header

        // Determine IP version from first nibble
        let version = (packet[0] >> 4) & 0x0F

        let ipHeaderLength: Int
        switch version {
        case 4:
            // IPv4: header length is in the lower nibble of byte 0 (in 32-bit words)
            ipHeaderLength = Int(packet[0] & 0x0F) * 4
        case 6:
            // IPv6: fixed 40-byte header
            ipHeaderLength = 40
        default:
            return nil
        }

        guard packet.count > ipHeaderLength + 8 else { return nil }

        // Check it's UDP (protocol byte)
        if version == 4 {
            let proto = packet[9]
            guard proto == 17 else { return nil } // 17 = UDP
        } else {
            let nextHeader = packet[6]
            guard nextHeader == 17 else { return nil } // 17 = UDP
        }

        // Check destination port is 53 (DNS)
        let udpStart = ipHeaderLength
        let dstPort = (UInt16(packet[udpStart + 2]) << 8) | UInt16(packet[udpStart + 3])
        guard dstPort == 53 else { return nil }

        // DNS header starts after UDP header (8 bytes)
        let dnsStart = udpStart + 8

        guard packet.count > dnsStart + 12 else { return nil }

        // Check this is a standard query (QR bit = 0, Opcode = 0)
        let flags = (UInt16(packet[dnsStart + 2]) << 8) | UInt16(packet[dnsStart + 3])
        let qr = (flags >> 15) & 1
        guard qr == 0 else { return nil } // Must be a query, not a response

        // Question count
        let qdCount = (UInt16(packet[dnsStart + 4]) << 8) | UInt16(packet[dnsStart + 5])
        guard qdCount >= 1 else { return nil }

        // Parse the first question's domain name
        // DNS name format: [length][label][length][label]...[0]
        var offset = dnsStart + 12 // Skip DNS header
        var labels: [String] = []

        while offset < packet.count {
            let length = Int(packet[offset])
            if length == 0 {
                break // End of name
            }

            // Pointer compression (shouldn't appear in queries, but handle it)
            if (length & 0xC0) == 0xC0 {
                break // Compressed — skip for now
            }

            offset += 1
            guard offset + length <= packet.count else { return nil }

            let labelData = packet[offset..<(offset + length)]
            if let label = String(data: labelData, encoding: .utf8) {
                labels.append(label)
            }
            offset += length
        }

        guard !labels.isEmpty else { return nil }

        let domain = labels.joined(separator: ".")

        // Skip noise — internal Apple / mDNS / local queries
        if domain.hasSuffix(".local") ||
           domain.hasSuffix(".arpa") ||
           domain.contains("_dns") ||
           domain.isEmpty {
            return nil
        }

        return domain
    }
}
