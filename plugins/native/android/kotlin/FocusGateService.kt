package $PACKAGE_NAME.focusflow

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject

class FocusGateService : AccessibilityService() {
  private var lastPackage = ""; private var lastBlockedAt = 0L
  override fun onAccessibilityEvent(event: AccessibilityEvent?) { if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return; val packageName = event.packageName?.toString() ?: return; val state = readState() ?: return; if (!state.active || !state.isWithinSchedule() || packageName !in state.blockedPackages || packageName == applicationContext.packageName) return; val now = System.currentTimeMillis(); if (lastPackage == packageName && now - lastBlockedAt < 900) return; lastPackage = packageName; lastBlockedAt = now; performGlobalAction(GLOBAL_ACTION_HOME); startActivity(Intent(this, FocusGateActivity::class.java).apply { putExtra(FocusGateActivity.EXTRA_MESSAGE, state.message); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP) }) }
  override fun onInterrupt() = Unit
  private fun readState(): GateState? = try { val saved = getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null) ?: return null; val json = JSONObject(saved); val packages = json.optJSONArray("blockedPackages"); val blocked = buildList { if (packages != null) for (index in 0 until packages.length()) add(packages.optString(index)) }; val schedules = json.optJSONArray("schedules"); GateState(json.optBoolean("active"), blocked, json.optString("message", "今日の必須項目を完了してください"), schedules) } catch (_: Exception) { null }
}
private data class GateState(val active: Boolean, val blockedPackages: List<String>, val message: String, val schedules: org.json.JSONArray?) {
  fun isWithinSchedule(): Boolean {
    if (schedules == null || schedules.length() == 0) return true
    val calendar = java.util.Calendar.getInstance(); val day = calendar.get(java.util.Calendar.DAY_OF_WEEK) - 1; val yesterday = (day + 6) % 7; val minutes = calendar.get(java.util.Calendar.HOUR_OF_DAY) * 60 + calendar.get(java.util.Calendar.MINUTE)
    for (index in 0 until schedules.length()) { val schedule = schedules.optJSONObject(index) ?: continue; if (!schedule.optBoolean("enabled", true)) continue; val days = schedule.optJSONArray("days") ?: continue; val start = toMinutes(schedule.optString("startTime", "00:00")); val end = toMinutes(schedule.optString("endTime", "00:00")); fun hasDay(target: Int): Boolean { for (item in 0 until days.length()) if (days.optInt(item) == target) return true; return false }; if (start == end && hasDay(day)) return true; if (start < end && hasDay(day) && minutes >= start && minutes < end) return true; if (start > end && ((hasDay(day) && minutes >= start) || (hasDay(yesterday) && minutes < end))) return true }
    return false
  }
  private fun toMinutes(value: String): Int { val parts = value.split(":"); val hours = parts.getOrNull(0)?.toIntOrNull() ?: 0; val minutes = parts.getOrNull(1)?.toIntOrNull() ?: 0; return (hours * 60 + minutes).coerceIn(0, 1439) }
}
