package com.monkmode

import android.content.Context
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable

class WearDataManager(private val context: Context) : DataClient.OnDataChangedListener {
    private val dataClient: DataClient by lazy { Wearable.getDataClient(context) }

    fun start() {
        dataClient.addListener(this)
    }

    fun stop() {
        dataClient.removeListener(this)
    }

    fun syncContext(
        streak: Int,
        isPro: Boolean,
        pomodoroActive: Boolean,
        pomodoroSecondsRemaining: Int,
        habitsJson: String
    ) {
        val req = PutDataMapRequest.create("/monkmode/context")
        req.dataMap.putInt("streak", streak)
        req.dataMap.putBoolean("isPro", isPro)
        req.dataMap.putBoolean("pomodoroActive", pomodoroActive)
        req.dataMap.putInt("pomodoroSecondsRemaining", pomodoroSecondsRemaining)
        req.dataMap.putString("habits", habitsJson)
        dataClient.putDataItem(req.asPutDataRequest().setUrgent())
    }

    override fun onDataChanged(events: DataEventBuffer) {
        for (event in events) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            // Handle actions from watch:
            // complete_habit, start_pomodoro, save_gratitude
        }
    }
}

