package com.monkmode

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

class MonkModeWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { appWidgetId ->
            appWidgetManager.updateAppWidget(appWidgetId, buildRemoteViews(context, appWidgetId))
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, MonkModeWidgetProvider::class.java))
            onUpdate(context, manager, ids)
        }
    }

    private fun buildRemoteViews(context: Context, appWidgetId: Int): RemoteViews {
        val prefs = context.getSharedPreferences("monkmode_widget_shared", Context.MODE_PRIVATE)
        val raw = prefs.getString("monkmode_widget_data", null)
        val payload = if (raw.isNullOrBlank()) null else JSONObject(raw)

        val streak = payload?.optInt("streak", 0) ?: 0
        val completed = payload?.optInt("habitsCompleted", 0) ?: 0
        val total = payload?.optInt("habitsTotal", 0) ?: 0
        val goal = payload?.optString("topGoal", "") ?: ""

        val views = RemoteViews(context.packageName, R.layout.monk_mode_widget)
        views.setTextViewText(R.id.widget_streak, streak.toString())
        views.setTextViewText(R.id.widget_habits_progress, "$completed/$total")
        views.setTextViewText(
            R.id.widget_goal,
            if (goal.isBlank()) "Open MonkMode to get started" else goal
        )
        val progressPct = if (total > 0) ((completed.toFloat() / total.toFloat()) * 100).toInt() else 0
        views.setProgressBar(R.id.widget_progress, 100, progressPct, false)

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
        return views
    }
}

