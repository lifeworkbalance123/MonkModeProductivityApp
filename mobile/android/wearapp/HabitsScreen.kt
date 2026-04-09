// IMPORTANT: Watch apps require EAS Build.
// Run: eas build --platform ios
// Test via TestFlight on a real Apple Watch paired to an iPhone.
// Watch Simulator support is limited — always test on hardware.

package com.monkmode.wearapp

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ScalingLazyColumn
import androidx.wear.compose.material.Text

data class WearHabitUi(val id: String, val icon: String, val name: String, var completed: Boolean)

@Composable
fun HabitsScreen() {
    val habits = remember {
        mutableStateListOf(
            WearHabitUi("1", "✅", "No social media", false),
            WearHabitUi("2", "✅", "Deep work block", true),
        )
    }
    val haptics = LocalHapticFeedback.current

    ScalingLazyColumn {
        item { Text("${habits.count { it.completed }}/${habits.size} done") }
        items(habits.size) { index ->
            val item = habits[index]
            Chip(
                label = { Text("${item.icon} ${item.name}") },
                onClick = {
                    item.completed = !item.completed
                    habits[index] = item
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    // Send complete_habit DataMap to phone via Data Layer API in native bridge.
                }
            )
        }
    }
}

