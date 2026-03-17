import Foundation

enum APIClient {
    static let serverURL = "https://safeguard-platform.vercel.app"
    static let supabaseURL = "https://inufiyjsiyremdpdarxa.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludWZpeWpzaXlyZW1kcGRhcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDc2MzcsImV4cCI6MjA4OTAyMzYzN30.8ULh22Vf_f7k-ty8xEGnHLSI3ypEW2VldKxqmmgNeF8"

    /// Insert DNS log entries directly into Supabase
    static func logDNSQueries(deviceId: String, queries: [(domain: String, timestamp: String)]) {
        guard !queries.isEmpty else { return }
        guard let url = URL(string: "\(supabaseURL)/rest/v1/dns_logs") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 10

        let rows = queries.map { q in
            [
                "device_id": deviceId,
                "domain": q.domain,
                "blocked": "false",
                "timestamp": q.timestamp,
            ]
        }

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: rows)
        } catch { return }

        URLSession.shared.dataTask(with: request) { _, _, error in
            if let error = error {
                print("[SafeGuard] DNS log failed: \(error.localizedDescription)")
            }
        }.resume()
    }

    /// Update device last_connected timestamp
    static func updateLastConnected(deviceId: String) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/devices?id=eq.\(deviceId)") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 5

        let body = ["last_connected": ISO8601DateFormatter().string(from: Date())]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
    }
}
