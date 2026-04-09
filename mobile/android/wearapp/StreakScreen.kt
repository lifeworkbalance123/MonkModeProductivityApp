// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

package com.monkmode.wearapp

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

@Composable
fun StreakScreen(streakCount: Int, bestStreak: Int) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("🔥", fontSize = 40.sp, color = Color.White)
        Text("$streakCount", fontSize = 56.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text("Day streak", fontSize = 14.sp, color = Color(0xFFF59E0B))
        Text("Best: $bestStreak", fontSize = 11.sp, color = Color(0xFF9CA3AF))
    }
}

