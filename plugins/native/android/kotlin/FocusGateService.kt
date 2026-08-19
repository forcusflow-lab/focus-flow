package $PACKAGE_NAME.focusflow

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityServiceInfo
import org.json.JSONObject

class FocusGateService : AccessibilityService() {
  private var lastPackage = ""
  private var lastBlockedAt = 0L

  override fun onServiceConnected() {
    lastPackage = ""
    lastBlockedAt = 0L
    serviceInfo = serviceInfo.apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or AccessibilityEvent.TYPE_WINDOWS_CHANGED
      flags = flags or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
      notificationTimeout = 0
    }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val eventType = event?.eventType ?: return
    if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED) return
    val packageName = (event.packageName ?: rootInActiveWindow?.packageName)?.toString() ?: return
    if (packageName == applicationContext.packageName) return
    val now = System.currentTimeMillis()
    preferences().edit()
      .putLong(FocusGateModule.GATE_LAST_EVENT_AT, now)
      .putString(FocusGateModule.GATE_LAST_EVENT_PACKAGE, packageName)
      .apply()
    val state = readState() ?: return
    val matchingRule = state.ruleBlocking(packageName) ?: return
    if (lastPackage == packageName && now - lastBlockedAt < 250) return
    lastPackage = packageName
    lastBlockedAt = now
    preferences().edit()
      .putLong(FocusGateModule.GATE_LAST_BLOCKED_AT, now)
      .putString(FocusGateModule.GATE_LAST_BLOCKED_PACKAGE, packageName)
      .apply()
    try {
      startActivity(Intent(this, FocusGateActivity::class.java).apply {
        putExtra(FocusGateActivity.EXTRA_MESSAGE, matchingRule.message)
        putExtra(FocusGateActivity.EXTRA_LANGUAGE, state.language)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      })
    } catch (_: Exception) {
      performGlobalAction(GLOBAL_ACTION_HOME)
    }
  }

  override fun onInterrupt() = Unit

  private fun preferences() = getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
  private fun readState(): GateState? = try {
    val saved = preferences().getString(FocusGateModule.GATE_STATE, null) ?: return null
    val json = JSONObject(saved)
    GateState(json.optBoolean("active"), json.optJSONArray("rules"), json.optString("language", "ja"))
  } catch (_: Exception) { null }
}

private data class GateState(val active: Boolean, val rules: org.json.JSONArray?, val language: String) {
  fun ruleBlocking(packageName: String): GateRule? {
    if (!active || rules == null) return null
    for (index in 0 until rules.length()) {
      val rule = rules.optJSONObject(index)?.let(::GateRule) ?: continue
      if (rule.effectivePendingCount > 0 && rule.isWithinSchedule() && packageName in rule.blockedPackages) return rule
    }
    return null
  }
}

private data class GateRule(val json: JSONObject) {
  val pendingCount: Int get() = json.optInt("pendingCount")
  val effectivePendingCount: Int get() {
    val unlocks = json.optJSONArray("timedUnlocks") ?: return pendingCount
    var elapsed = 0
    for (index in 0 until unlocks.length()) if ((unlocks.optJSONObject(index)?.optLong("endsAt") ?: Long.MAX_VALUE) <= System.currentTimeMillis()) elapsed += 1
    return (pendingCount - elapsed).coerceAtLeast(0)
  }
  val message: String get() = json.optString("message", "今日の必須項目を完了してください")
  val blockedPackages: List<String> get() = buildList {
    val packages = json.optJSONArray("blockedPackages")
    if (packages != null) for (index in 0 until packages.length()) packages.optString(index).takeIf { it.isNotBlank() }?.let(::add)
  }
  fun isWithinSchedule(): Boolean {
    val schedule = json.optJSONObject("schedule") ?: return true
    if (!schedule.optBoolean("enabled", true)) return false
    val days = schedule.optJSONArray("days") ?: return false
    val calendar = java.util.Calendar.getInstance()
    val day = calendar.get(java.util.Calendar.DAY_OF_WEEK) - 1
    val yesterday = (day + 6) % 7
    val minutes = calendar.get(java.util.Calendar.HOUR_OF_DAY) * 60 + calendar.get(java.util.Calendar.MINUTE)
    val start = toMinutes(schedule.optString("startTime", "00:00"))
    val end = toMinutes(schedule.optString("endTime", "00:00"))
    fun hasDay(target: Int) = (0 until days.length()).any { days.optInt(it) == target }
    if (start == end) return hasDay(day)
    if (start < end) return hasDay(day) && minutes >= start && minutes < end
    return (hasDay(day) && minutes >= start) || (hasDay(yesterday) && minutes < end)
  }
  private fun toMinutes(value: String): Int {
    val parts = value.split(":")
    return ((parts.getOrNull(0)?.toIntOrNull() ?: 0) * 60 + (parts.getOrNull(1)?.toIntOrNull() ?: 0)).coerceIn(0, 1439)
  }
}
