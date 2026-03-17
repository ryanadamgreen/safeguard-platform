import SwiftUI

struct ContentView: View {
    @StateObject private var tunnel = TunnelManager()

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Logo and title
            VStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(red: 0.216, green: 0.188, blue: 0.639)) // #3730a3
                        .frame(width: 80, height: 80)
                    Image(systemName: "shield.checkered")
                        .font(.system(size: 36))
                        .foregroundStyle(.white)
                }

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
                    .fill(tunnel.isConnected ? Color.green : Color.red.opacity(0.6))
                    .frame(width: 16, height: 16)
                    .shadow(color: tunnel.isConnected ? .green.opacity(0.5) : .clear, radius: 8)

                Text(tunnel.statusText)
                    .font(.headline)
                    .foregroundStyle(tunnel.isConnected ? .green : .secondary)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(tunnel.isConnected ? Color.green.opacity(0.06) : Color.gray.opacity(0.06))
            )
            .padding(.horizontal, 32)

            // Connect button
            Button(action: { tunnel.toggle() }) {
                HStack {
                    if tunnel.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: tunnel.isConnected ? "stop.fill" : "play.fill")
                    }
                    Text(tunnel.isConnected ? "Stop Monitoring" : "Start Monitoring")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(tunnel.isConnected ? Color.red : Color(red: 0.216, green: 0.188, blue: 0.639))
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .disabled(tunnel.isLoading)
            .padding(.horizontal, 32)

            // Device info
            VStack(spacing: 4) {
                Text("Device ID")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(tunnel.deviceId)
                    .font(.caption2)
                    .monospaced()
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.gray.opacity(0.06))
            )
            .padding(.horizontal, 32)

            Spacer()

            // Footer
            VStack(spacing: 2) {
                Text("DNS queries are monitored for safeguarding")
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
