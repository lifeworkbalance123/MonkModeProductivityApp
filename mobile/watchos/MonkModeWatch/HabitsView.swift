// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

import SwiftUI
import WatchKit

struct WatchHabit: Identifiable {
    let id: String
    let icon: String
    let name: String
    var completed: Bool
}

struct HabitsView: View {
    @State private var isPro = true
    @State private var habits: [WatchHabit] = [
        WatchHabit(id: "1", icon: "✅", name: "No social media", completed: false),
        WatchHabit(id: "2", icon: "✅", name: "Deep work block", completed: true),
    ]

    var body: some View {
        ZStack {
            Color(hex: "#111827").ignoresSafeArea()
            if !isPro {
                Text("Habit sync is a Pro feature. Upgrade in the MonkMode iPhone app.")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .padding()
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    let done = habits.filter(\.completed).count
                    Text("\(done)/\(habits.count) done")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(Color(hex: "#F59E0B"))

                    List {
                        ForEach(habits.indices, id: \.self) { idx in
                            Button {
                                habits[idx].completed.toggle()
                                WKInterfaceDevice.current().play(.success)
                                // Send complete_habit to phone app via WatchConnectivity native layer.
                            } label: {
                                HStack {
                                    Text(habits[idx].icon)
                                    Text(habits[idx].name)
                                        .font(.system(size: 14))
                                        .foregroundColor(.white)
                                    Spacer()
                                    Circle()
                                        .strokeBorder(Color(hex: "#6B7280"), lineWidth: habits[idx].completed ? 0 : 1.5)
                                        .background(
                                            Circle().fill(habits[idx].completed ? Color(hex: "#F59E0B") : .clear)
                                        )
                                        .frame(width: 18, height: 18)
                                }
                            }
                            .listRowBackground(Color.clear)
                        }
                    }
                    .listStyle(.carousel)
                }
                .padding(.horizontal, 8)
            }
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

