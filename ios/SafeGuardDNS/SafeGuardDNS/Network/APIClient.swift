import Foundation

class APIClient {
    // IMPORTANT: Change this to your Mac's local IP address.
    // Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1
    // The iOS device and Mac must be on the same WiFi network.
    static var serverURL = "http://192.168.1.127:3000"

    static func sendQuery(_ query: DNSQuery) {
        guard let url = URL(string: "\(serverURL)/api/dns-monitor") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 5

        do {
            request.httpBody = try JSONEncoder().encode(query)
        } catch {
            return
        }

        URLSession.shared.dataTask(with: request) { _, _, error in
            if let error = error {
                print("[SafeGuard] Failed to send query: \(error.localizedDescription)")
            }
        }.resume()
    }

    static func sendBatch(deviceId: String, queries: [DNSQueryItem]) {
        guard !queries.isEmpty else { return }
        guard let url = URL(string: "\(serverURL)/api/dns-monitor") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        let batch = DNSQueryBatch(deviceId: deviceId, queries: queries)
        do {
            request.httpBody = try JSONEncoder().encode(batch)
        } catch {
            return
        }

        URLSession.shared.dataTask(with: request) { _, _, error in
            if let error = error {
                print("[SafeGuard] Failed to send batch: \(error.localizedDescription)")
            }
        }.resume()
    }
}
