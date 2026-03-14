import SwiftUI

struct ContentView: View {
    @StateObject private var dnsManager = DNSManager()

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Logo and title
            VStack(spacing: 8) {
                Image(systemName: "shield.checkered")
                    .font(.system(size: 64))
                    .foregroundStyle(.blue)

                Text("SafeGuard")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("DNS Monitor")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            // Status indicator
            VStack(spacing: 8) {
                Circle()
                    .fill(dnsManager.isActive ? Color.green : Color.red)
                    .frame(width: 16, height: 16)
                    .shadow(color: dnsManager.isActive ? .green.opacity(0.5) : .clear, radius: 8)

                Text(dnsManager.statusText)
                    .font(.headline)
                    .foregroundStyle(dnsManager.isActive ? .green : .secondary)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(dnsManager.isActive ? Color.green.opacity(0.08) : Color.gray.opacity(0.08))
            )
            .padding(.horizontal, 32)

            // Connect button
            Button(action: { dnsManager.toggle() }) {
                HStack {
                    if dnsManager.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: dnsManager.isActive ? "stop.fill" : "play.fill")
                    }
                    Text(dnsManager.isActive ? "Deactivate" : "Activate")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(dnsManager.isActive ? Color.red : Color.blue)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(dnsManager.isLoading)
            .padding(.horizontal, 32)

            // Device info
            VStack(spacing: 4) {
                Text("Device ID")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(dnsManager.deviceId)
                    .font(.caption2)
                    .monospaced()
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.06))
            )
            .padding(.horizontal, 32)

            Spacer()

            // Server info
            VStack(spacing: 2) {
                Text("DNS routed through")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                Text(APIClient.serverURL)
                    .font(.caption2)
                    .monospaced()
                    .foregroundStyle(.tertiary)
            }
            .padding(.bottom, 16)
        }
    }
}

#Preview {
    ContentView()
}
