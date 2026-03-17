import Foundation
import NetworkExtension

class TunnelManager: ObservableObject {
    @Published var isConnected = false
    @Published var isLoading = false
    @Published var statusText = "Disconnected"

    private var manager: NETunnelProviderManager?

    var deviceId: String {
        let defaults = UserDefaults(suiteName: "group.com.safeguard.dns") ?? .standard
        if let stored = defaults.string(forKey: "safeguard_device_id") {
            return stored
        }
        let newId = UUID().uuidString.lowercased()
        defaults.set(newId, forKey: "safeguard_device_id")
        // Also store in standard defaults for the main app
        UserDefaults.standard.set(newId, forKey: "safeguard_device_id")
        return newId
    }

    init() {
        loadManager()
        observeStatus()
    }

    // MARK: - Load existing VPN configuration

    private func loadManager() {
        NETunnelProviderManager.loadAllFromPreferences { [weak self] managers, error in
            guard let self = self else { return }
            if let error = error {
                print("[SafeGuard] Load error: \(error.localizedDescription)")
                return
            }
            DispatchQueue.main.async {
                self.manager = managers?.first
                self.updateStatus()
            }
        }
    }

    // MARK: - Observe VPN status changes

    private func observeStatus() {
        NotificationCenter.default.addObserver(
            forName: .NEVPNStatusDidChange,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.updateStatus()
        }
    }

    private func updateStatus() {
        guard let connection = manager?.connection else {
            isConnected = false
            statusText = "Not Configured"
            return
        }
        switch connection.status {
        case .connected:
            isConnected = true
            statusText = "Monitoring Active"
        case .connecting:
            isConnected = false
            statusText = "Connecting..."
        case .disconnecting:
            isConnected = true
            statusText = "Disconnecting..."
        case .disconnected:
            isConnected = false
            statusText = "Disconnected"
        case .invalid:
            isConnected = false
            statusText = "Invalid"
        case .reasserting:
            isConnected = true
            statusText = "Reconnecting..."
        @unknown default:
            isConnected = false
            statusText = "Unknown"
        }
    }

    // MARK: - Toggle

    func toggle() {
        if isConnected {
            disconnect()
        } else {
            connect()
        }
    }

    // MARK: - Connect

    func connect() {
        isLoading = true

        if let existing = manager {
            startTunnel(existing)
        } else {
            // Create a new VPN configuration
            let manager = NETunnelProviderManager()
            let proto = NETunnelProviderProtocol()
            proto.providerBundleIdentifier = "com.safeguard.dns.tunnel"
            proto.serverAddress = "SafeGuard DNS"
            proto.providerConfiguration = [
                "deviceId": deviceId,
                "serverURL": APIClient.serverURL,
                "supabaseURL": APIClient.supabaseURL,
                "supabaseAnonKey": APIClient.supabaseAnonKey,
            ]
            manager.protocolConfiguration = proto
            manager.localizedDescription = "SafeGuard DNS Monitor"
            manager.isEnabled = true

            manager.saveToPreferences { [weak self] error in
                if let error = error {
                    print("[SafeGuard] Save error: \(error.localizedDescription)")
                    DispatchQueue.main.async {
                        self?.isLoading = false
                        self?.statusText = "Setup failed"
                    }
                    return
                }
                // Must reload after saving
                manager.loadFromPreferences { [weak self] error in
                    if let error = error {
                        print("[SafeGuard] Reload error: \(error.localizedDescription)")
                    }
                    DispatchQueue.main.async {
                        self?.manager = manager
                        self?.startTunnel(manager)
                    }
                }
            }
        }
    }

    private func startTunnel(_ manager: NETunnelProviderManager) {
        do {
            try manager.connection.startVPNTunnel()
        } catch {
            print("[SafeGuard] Start error: \(error.localizedDescription)")
            DispatchQueue.main.async {
                self.isLoading = false
                self.statusText = "Start failed"
            }
        }
        DispatchQueue.main.async {
            self.isLoading = false
        }
    }

    // MARK: - Disconnect

    func disconnect() {
        isLoading = true
        manager?.connection.stopVPNTunnel()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.isLoading = false
        }
    }
}
