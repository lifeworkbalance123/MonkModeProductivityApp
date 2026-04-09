// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            StreakView()
            HabitsView()
            PomodoroView()
        }
        .tabViewStyle(.page)
    }
}

