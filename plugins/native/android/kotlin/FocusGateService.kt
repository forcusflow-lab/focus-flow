package $PACKAGE_NAME.focusflow

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject

class FocusGateService : AccessibilityService() {
  private var lastPackage = ""; private var lastBlockedAt = 0L
  override fun onAccessibilityEvent(event: AccessibilityEvent?) { if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return; val packageName = event.packageName?.toString() ?: return; if (FocusGateModule.isSafetyPaused(applicationContext)) return; val state = readState() ?: return; val matchingRule = state.ruleBlocking(packageName) ?: return; if (!state.active || packageName == applicationContext.packageName) return; val now = System.currentTimeMillis(); if (lastPackage == packageName && now - lastBlockedAt < 900) return; lastPackage = packageName; lastBlockedAt = now; performGlobalAction(GLOBAL_ACTION_HOME); startActivity(Intent(this, FocusGateActivity::class.java).apply { putExtra(FocusGateActivity.EXTRA_MESSAGE, matchingRule.message); putExtra(FocusGateActivity.EXTRA_LANGUAGE, state.language); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP) }) }
  override fun onInterrupt() = Unit
  private fun readState(): GateState? = try { val saved = getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null) ?: return null; val json = JSONObject(saved); val rules = json.optJSONArray("rules"); GateState(json.optBoolean("active"), rules, json.optString("language", "ja")) } catch (_: Exception) { null }
}
private data class GateState(val active: Boolean, val rules: org.json.JSONArray?, val language: String) {
  fun ruleBlocking(packageName: String): GateRule? { if (!active || rules == null) return null; for (index in 0 until rules.length()) { val rule = rules.optJSONObject(index)?.let(::GateRule) ?: continue; if (rule.pendingCount > 0 && rule.isWithinSchedule() && packageName in rule.blockedPackages) return rule }; return null }
}
private data class GateRule(val json: JSONObject) {
  val pendingCount: Int get() = json.optInt("pendingCount")
  val message: String get() = json.optString("message", "今日の必須項目を完了してください")
  val blockedPackages: List<String> get() { val packages = json.optJSONArray("blockedPackages"); return buildList { if (packages != null) for (index in 0 until packages.length()) add(packages.optString(index)) } }
  fun isWithinSchedule(): Boolean {
    val schedule = json.optJSONObject("schedule") ?: return true
    if (!schedule.optBoolean("enabled", true)) return false
    val schedules = schedule.optJSONArray("days") ?: return false
    val calendar = java.util.Calendar.getInstance(); val day = calendar.get(java.util.Calendar.DAY_OF_WEEK) - 1; val yesterday = (day + 6) % 7; val minutes = calendar.get(java.util.Calendar.HOUR_OF_DAY) * 60 + calendar.get(java.util.Calendar.MINUTE)
    val start = toMinutes(schedule.optString("startTime", "00:00")); val end = toMinutes(schedule.optString("endTime", "00:00")); fun hasDay(target: Int): Boolean { for (item in 0 until schedules.length()) if (schedules.optInt(item) == target) return true; return false }; if (start == end) return hasDay(day); if (start < end) return hasDay(day) && minutes >= start && minutes < end; return (hasDay(day) && minutes >= start) || (hasDay(yesterday) && minutes < end)
  }
  private fun toMinutes(value: String): Int { val parts = value.split(":"); val hours = parts.getOrNull(0)?.toIntOrNull() ?: 0; val minutes = parts.getOrNull(1)?.toIntOrNull() ?: 0; return (hours * 60 + minutes).coerceIn(0, 1439) }
}
