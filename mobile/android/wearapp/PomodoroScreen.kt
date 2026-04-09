// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

package com.monkmode.wearapp

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.Text
import kotlinx.coroutines.delay

@Composable
fun PomodoroScreen() {
    var running by remember { mutableStateOf(false) }
    var total by remember { mutableIntStateOf(25 * 60) }
    var remaining by remember { mutableIntStateOf(25 * 60) }

    LaunchedEffect(running) {
        while (running && remaining > 0) {
            delay(1000)
            remaining -= 1
        }
        if (remaining == 0) running = false
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(
            progress = if (total == 0) 0f else remaining.toFloat() / total.toFloat(),
            indicatorColor = Color(0xFFF59E0B),
            trackColor = Color(0xFF374151)
        )
        Text("${remaining / 60}:${(remaining % 60).toString().padStart(2, '0')}", color = Color.White, fontSize = 24.sp)
        Button(onClick = { running = !running }) {
            Text(if (running) "Pause" else "Start")
        }
    }
    // TODO: Use ForegroundService for timer continuity when screen is off.
}

