import Foundation

struct DNSQuery: Codable {
    let domain: String
    let timestamp: String
    let deviceId: String

    enum CodingKeys: String, CodingKey {
        case domain
        case timestamp
        case deviceId = "device_id"
    }
}

struct DNSQueryBatch: Codable {
    let deviceId: String
    let queries: [DNSQueryItem]

    enum CodingKeys: String, CodingKey {
        case deviceId = "device_id"
        case queries
    }
}

struct DNSQueryItem: Codable {
    let domain: String
    let timestamp: String
}
