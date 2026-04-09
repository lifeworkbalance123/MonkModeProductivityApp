// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

package com.monkmode.wearapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.wear.compose.material.ScalingLazyColumn
import androidx.wear.compose.material.Text
import com.monkmode.wearapp.theme.MonkModeTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MonkModeTheme {
                ScalingLazyColumn {
                    item { Text("MonkMode Wear") }
                }
            }
        }
    }
}

