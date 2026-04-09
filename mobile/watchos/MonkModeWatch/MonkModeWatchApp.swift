// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

import SwiftUI

@main
struct MonkModeWatchApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

