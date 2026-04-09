// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

import SwiftUI
import WatchKit

struct PomodoroView: View {
    @State private var isPro = true
    @State private var total = 25 * 60
    @State private var remaining = 25 * 60
    @State private var running = false
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            Color(hex: "#111827").ignoresSafeArea()
            VStack(spacing: 10) {
                if !isPro {
                    Text("Upgrade to Pro in the MonkMode app to sync habits to your watch.")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.white.opacity(0.9))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 8)
                }

                Text("FOCUS")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(hex: "#F59E0B"))

                ZStack {
                    Circle().stroke(Color(hex: "#374151"), lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(Color(hex: "#F59E0B"), style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text(formattedTime)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                }
                .frame(width: 120, height: 120)

                HStack(spacing: 8) {
                    Button(running ? "Pause" : "Start") {
                        running.toggle()
                        // Send start_pomodoro to phone via WatchConnectivity native layer.
                    }
                    .tint(Color(hex: "#F59E0B"))

                    Button("Reset") {
                        running = false
                        remaining = total
                    }
                    .tint(Color(hex: "#6B7280"))
                }
            }
        }
        .onReceive(timer) { _ in
            guard running else { return }
            if remaining > 0 {
                remaining -= 1
            } else {
                running = false
                WKInterfaceDevice.current().play(.notification)
            }
        }
    }

    private var progress: CGFloat {
        guard total > 0 else { return 0 }
        return max(0, min(1, CGFloat(remaining) / CGFloat(total)))
    }

    private var formattedTime: String {
        let m = remaining / 60
        let s = remaining % 60
        return String(format: "%02d:%02d", m, s)
    }
}

private extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255.0
        let g = Double((int >> 8) & 0xFF) / 255.0
        let b = Double(int & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

