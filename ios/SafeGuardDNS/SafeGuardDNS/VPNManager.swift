import Foundation

class DNSManager: ObservableObject {
    @Published var isActive = false
    @Published var isLoading = false
    @Published var statusText = "Not Registered"

    var deviceId: String {
        if let stored = UserDefaults.standard.string(forKey: "safeguard_device_id") {
            return stored
        }
        let newId = UUID().uuidString
        UserDefaults.standard.set(newId, forKey: "safeguard_device_id")
        return newId
    }

    var deviceName: String {
        ProcessInfo.processInfo.hostName
    }

    init() {
        checkStatus()
    }

    func checkStatus() {
        guard let url = URL(string: "\(APIClient.serverURL)/api/devices/\(deviceId)") else { return }
        URLSession.shared.dataTask(with: url) { [weak self] _, response, _ in
            DispatchQueue.main.async {
                let active = (response as? HTTPURLResponse)?.statusCode == 200
                self?.isActive = active
                self?.statusText = active ? "Active" : "Not Active"
            }
        }.resume()
    }

    func activate() {
        isLoading = true
        guard let url = URL(string: "\(APIClient.serverURL)/api/devices/register") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "device_id": deviceId,
            "device_name": deviceName
        ])
        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                if let error = error {
                    print("[SafeGuard] Register error: \(error.localizedDescription)")
                    self?.statusText = "Failed: \(error.localizedDescription)"
                    return
                }
                self?.isActive = true
                self?.statusText = "Active"
                print("[SafeGuard] Device registered: \(self?.deviceId ?? "")")
            }
        }.resume()
    }

    func deactivate() {
        isLoading = true
        guard let url = URL(string: "\(APIClient.serverURL)/api/devices/\(deviceId)") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        URLSession.shared.dataTask(with: request) { [weak self] _, _, _ in
            DispatchQueue.main.async {
                self?.isLoading = false
                self?.isActive = false
                self?.statusText = "Not Active"
                print("[SafeGuard] Device unregistered")
            }
        }.resume()
    }

    func toggle() {
        if isActive { deactivate() } else { activate() }
    }
}
