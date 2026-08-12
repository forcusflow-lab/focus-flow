package $PACKAGE_NAME.focusflow

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject

class FocusGateService : AccessibilityService() {
  private var lastPackage = ""; private var lastBlockedAt = 0L
  override fun onAccessibilityEvent(event: AccessibilityEvent?) { if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return; val packageName = event.packageName?.toString() ?: return; val state = readState() ?: return; if (!state.active || packageName !in state.blockedPackages || packageName == applicationContext.packageName) return; val now = System.currentTimeMillis(); if (lastPackage == packageName && now - lastBlockedAt < 900) return; lastPackage = packageName; lastBlockedAt = now; performGlobalAction(GLOBAL_ACTION_HOME); startActivity(Intent(this, FocusGateActivity::class.java).apply { putExtra(FocusGateActivity.EXTRA_MESSAGE, state.message); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP) }) }
  override fun onInterrupt() = Unit
  private fun readState(): GateState? = try { val saved = getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null) ?: return null; val json = JSONObject(saved); val packages = json.optJSONArray("blockedPackages"); val blocked = buildList { if (packages != null) for (index in 0 until packages.length()) add(packages.optString(index)) }; GateState(json.optBoolean("active"), blocked, json.optString("message", "今日の必須項目を完了してください")) } catch (_: Exception) { null }
}
private data class GateState(val active: Boolean, val blockedPackages: List<String>, val message: String)
