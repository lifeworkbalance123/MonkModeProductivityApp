// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

package com.monkmode.wearapp.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Colors

private val WearColors = Colors(
    primary = Color(0xFFF59E0B),
    primaryVariant = Color(0xFFF59E0B),
    secondary = Color(0xFFF59E0B),
    secondaryVariant = Color(0xFFF59E0B),
    background = Color(0xFF111827),
    surface = Color(0xFF111827),
    error = Color(0xFFB00020),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    onError = Color.White
)

@Composable
fun MonkModeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colors = WearColors,
        content = content
    )
}

