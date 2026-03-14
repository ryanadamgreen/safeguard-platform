import NetworkExtension
import os.log

class PacketTunnelProvider: NEPacketTunnelProvider {

    private let logger = Logger(subsystem: "com.safeguard.dns.tunnel", category: "PacketTunnel")
    private var deviceId: String = "unknown"
    private var serverURL: String = ""
    private var pendingQueries: [(domain: String, timestamp: String)] = []
    private var flushTimer: DispatchSourceTimer?

    // MARK: - Tunnel Lifecycle

    override func startTunnel(options: [String: NSObject]?) async throws {
        // Read config passed from the main app
        if let config = (protocolConfiguration as? NETunnelProviderProtocol)?.providerConfiguration {
            deviceId = config["deviceId"] as? String ?? "unknown"
            serverURL = config["serverURL"] as? String ?? ""
        }

        logger.info("Starting SafeGuard DNS tunnel for device: \(self.deviceId)")

        // Configure tunnel to intercept DNS only
        let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "10.0.0.1")

        // DNS settings — route all DNS through the tunnel
        let dnsSettings = NEDNSSettings(servers: ["10.0.0.1"])
        settings.dnsSettings = dnsSettings

        // IPv4 settings — minimal, just for the tunnel interface
        let ipv4 = NEIPv4Settings(addresses: ["10.0.0.2"], subnetMasks: ["255.255.255.0"])
        // Only route DNS traffic (port 53) through tunnel, not all traffic
        ipv4.includedRoutes = [NEIPv4Route(destinationAddress: "10.0.0.1", subnetMask: "255.255.255.255")]
        settings.ipv4Settings = ipv4

        try await setTunnelNetworkSettings(settings)

        // Start batch flush timer (send accumulated queries every 2 seconds)
        startFlushTimer()

        // Start reading packets
        readPackets()
    }

    override func stopTunnel(with reason: NEProviderStopReason) async {
        logger.info("Stopping SafeGuard DNS tunnel")
        flushTimer?.cancel()
        flushTimer = nil
        flushPendingQueries()
    }

    // MARK: - Packet Reading

    private func readPackets() {
        packetFlow.readPackets { [weak self] packets, protocols in
            guard let self = self else { return }

            for (i, packet) in packets.enumerated() {
                // Parse DNS query from the packet
                if let domain = DNSParser.extractDomain(from: packet) {
                    let timestamp = ISO8601DateFormatter().string(from: Date())

                    self.logger.debug("DNS query: \(domain)")

                    // Queue for batch sending
                    self.pendingQueries.append((domain: domain, timestamp: timestamp))
                }

                // Forward the packet so DNS actually resolves
                self.packetFlow.writePackets([packet], withProtocols: [protocols[i]])
            }

            // Continue reading
            self.readPackets()
        }
    }

    // MARK: - Batch Sending

    private func startFlushTimer() {
        let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .utility))
        timer.schedule(deadline: .now() + 2, repeating: 2)
        timer.setEventHandler { [weak self] in
            self?.flushPendingQueries()
        }
        timer.resume()
        flushTimer = timer
    }

    private func flushPendingQueries() {
        guard !pendingQueries.isEmpty else { return }

        let queries = pendingQueries
        pendingQueries = []

        guard let url = URL(string: "\(serverURL)/api/dns-monitor") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 5

        let body: [String: Any] = [
            "device_id": deviceId,
            "queries": queries.map { ["domain": $0.domain, "timestamp": $0.timestamp] }
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            return
        }

        let task = URLSession.shared.dataTask(with: request) { [self] _, _, error in
            if let error = error {
                logger.error("Failed to send DNS batch: \(error.localizedDescription)")
            }
        }
        task.resume()
    }
}
