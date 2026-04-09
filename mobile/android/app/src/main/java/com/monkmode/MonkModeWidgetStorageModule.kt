package com.monkmode

import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MonkModeWidgetStorageModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MonkModeWidgetStorage"

    @ReactMethod
    fun setWidgetData(jsonPayload: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("monkmode_widget_shared", Context.MODE_PRIVATE)
            prefs.edit().putString("monkmode_widget_data", jsonPayload).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WIDGET_STORAGE_ERROR", e.message, e)
        }
    }
}

