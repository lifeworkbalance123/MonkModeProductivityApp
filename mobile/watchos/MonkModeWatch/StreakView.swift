// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

import SwiftUI
import WatchKit

struct StreakView: View {
    @State private var streak = 0
    @State private var best = 0

    var body: some View {
        ZStack {
            Color(hex: "#111827").ignoresSafeArea()
            VStack(spacing: 6) {
                Text("🔥").font(.system(size: 40))
                Text("\(streak)")
                    .font(.system(size: 56, weight: .bold))
                    .foregroundColor(.white)
                Text("Day streak")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(hex: "#F59E0B"))
                Text("Best: \(best)")
                    .font(.system(size: 11))
                    .foregroundColor(Color(hex: "#9CA3AF"))
            }
        }
        .onTapGesture {
            WKInterfaceDevice.current().play(.click)
        }
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

