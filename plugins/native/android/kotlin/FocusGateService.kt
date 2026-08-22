package $PACKAGE_NAME.focusflow

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

class FocusGateService : AccessibilityService() {
  private var lastPackage = ""
  private var lastBlockedAt = 0L
  private val foregroundRecheckHandler = Handler(Looper.getMainLooper())
  private var foregroundRecheck: Runnable? = null
  private var gateOverlay: View? = null
  private var gateOverlayPackage: String? = null
  private val foregroundRecheckDelays = longArrayOf(80L, 240L, 520L, 900L)

  override fun onServiceConnected() {
    lastPackage = ""
    lastBlockedAt = 0L
    foregroundRecheck?.let(foregroundRecheckHandler::removeCallbacks)
    foregroundRecheck = null
    serviceInfo = serviceInfo.apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
        AccessibilityEvent.TYPE_WINDOWS_CHANGED or
        AccessibilityEvent.TYPE_VIEW_FOCUSED or
        AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
      flags = flags or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
      notificationTimeout = 0
    }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val eventType = event?.eventType ?: return
    if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
      eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED &&
      eventType != AccessibilityEvent.TYPE_VIEW_FOCUSED &&
      eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
    ) return

    evaluateForeground(event.packageName?.toString())
    // 最近使ったアプリや既存タスクへの復帰は複数段階で前面化するため、イベント直後だけで
    // 判定を終えない。アクセシビリティオーバーレイは入力を遮断しつつ、下層の前面ウィンドウを
    // 継続評価できるため、対象アプリが描画された時点で必ず再遮断する。
    scheduleForegroundRechecks()
  }

  private fun evaluateForeground(eventPackage: String?) {
    val state = readState()
    if (state == null || !state.active) {
      hideGateOverlay()
      return
    }

    val activePackage = activeWindowPackage()
    val candidatePackage = foregroundCandidate(eventPackage, activePackage, state) ?: return
    if (candidatePackage == applicationContext.packageName) {
      hideGateOverlay()
      return
    }

    val now = System.currentTimeMillis()
    preferences().edit()
      .putLong(FocusGateModule.GATE_LAST_EVENT_AT, now)
      .putString(FocusGateModule.GATE_LAST_EVENT_PACKAGE, candidatePackage)
      .apply()

    val matchingRule = state.ruleBlocking(candidatePackage)
    if (matchingRule == null) {
      hideGateOverlay()
      return
    }

    lastPackage = candidatePackage
    lastBlockedAt = now
    preferences().edit()
      .putLong(FocusGateModule.GATE_LAST_BLOCKED_AT, now)
      .putString(FocusGateModule.GATE_LAST_BLOCKED_PACKAGE, candidatePackage)
      .apply()
    showGateOverlay(candidatePackage, matchingRule, state)
  }

  private fun foregroundCandidate(eventPackage: String?, activePackage: String?, state: GateState): String? {
    val eventCandidate = eventPackage?.takeIf { it.isNotBlank() }
    // 遮断用UIがまだ前面として報告される切替の途中でも、対象アプリを送信元として受けたイベントは
    // 最優先にする。これが遮断画面上から同じタスクを再開する経路を閉じる。
    if (eventCandidate != null && state.ruleBlocking(eventCandidate) != null) return eventCandidate
    return activePackage ?: eventCandidate
  }

  private fun showGateOverlay(packageName: String, rule: GateRule, state: GateState) {
    if (gateOverlay != null && gateOverlayPackage == packageName) return
    hideGateOverlay()

    val english = state.language == "en"
    val layout = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(48, 48, 48, 48)
      setBackgroundColor(Color.rgb(20, 49, 41))
      isClickable = true
      isFocusable = false
    }
    layout.addView(TextView(this).apply {
      text = "Focus Flow"
      textSize = 30f
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
      setPadding(0, 0, 0, 16)
    })
    layout.addView(TextView(this).apply {
      text = rule.message
      textSize = 18f
      setTextColor(Color.rgb(220, 238, 229))
      gravity = Gravity.CENTER
      setPadding(0, 0, 0, 24)
    })
    layout.addView(Button(this).apply {
      text = if (english) "Review items in Focus Flow" else "Focus Flowで項目を確認する"
      setOnClickListener {
        hideGateOverlay()
        startActivity(focusFlowTodayIntent())
      }
    })
    layout.addView(TextView(this).apply {
      text = if (english) {
        if (state.strictMode) "Strict mode is on. Complete your required items in Focus Flow to unlock restricted apps." else "This screen stays active while required items remain. Complete your items in Focus Flow to unlock restricted apps."
      } else {
        if (state.strictMode) "厳格モードを適用中です。Focus Flowで必須項目を完了すると制限アプリを利用できます。" else "必須項目が残っている間はこの画面が維持されます。Focus Flowで項目を完了すると制限アプリを利用できます。"
      }
      textSize = 13f
      setTextColor(Color.rgb(190, 220, 209))
      gravity = Gravity.CENTER
      setPadding(0, 20, 0, 8)
    })
    if (!state.strictMode) layout.addView(Button(this).apply {
      text = if (english) "Open Focus Flow app settings" else "Focus Flowのアプリ情報を開く"
      setOnClickListener {
        hideGateOverlay()
        startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${applicationContext.packageName}")).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
      }
    })

    try {
      windowManager().addView(layout, WindowManager.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
        PixelFormat.OPAQUE,
      ).apply {
        gravity = Gravity.TOP or Gravity.START
        title = "Focus Flow gate"
      })
      gateOverlay = layout
      gateOverlayPackage = packageName
    } catch (_: Exception) {
      // オーバーレイ追加に失敗した場合も次のイベント・再判定で再試行する。
      gateOverlay = null
      gateOverlayPackage = null
    }
  }

  private fun hideGateOverlay() {
    val overlay = gateOverlay ?: return
    try {
      windowManager().removeViewImmediate(overlay)
    } catch (_: Exception) {
      // 既にWindowManagerから除去済みの場合は状態だけを破棄する。
    } finally {
      gateOverlay = null
      gateOverlayPackage = null
    }
  }

  private fun focusFlowTodayIntent(): Intent = Intent(
    Intent.ACTION_VIEW,
    Uri.Builder().scheme("$DEEP_LINK_SCHEME").authority("today").build(),
  ).setPackage(applicationContext.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

  private fun scheduleForegroundRechecks() {
    foregroundRecheck?.let(foregroundRecheckHandler::removeCallbacks)
    var delayIndex = 0
    val task = object : Runnable {
      override fun run() {
        evaluateForeground(null)
        if (delayIndex >= foregroundRecheckDelays.size) {
          foregroundRecheck = null
          return
        }
        foregroundRecheckHandler.postDelayed(this, foregroundRecheckDelays[delayIndex++])
      }
    }
    foregroundRecheck = task
    foregroundRecheckHandler.postDelayed(task, foregroundRecheckDelays[delayIndex++])
  }

  private fun activeWindowPackage(): String? {
    return try {
      val activeRoot = rootInActiveWindow
      val activePackage = activeRoot?.packageName?.toString()
      if (!activePackage.isNullOrBlank()) return activePackage
      windows.firstOrNull { it.isActive || it.isFocused }?.root?.let { root ->
        try {
          root.packageName?.toString()?.takeIf { it.isNotBlank() }
        } finally {
          root.recycle()
        }
      }
    } catch (_: Exception) {
      null
    }
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    foregroundRecheck?.let(foregroundRecheckHandler::removeCallbacks)
    foregroundRecheck = null
    hideGateOverlay()
    super.onDestroy()
  }

  private fun windowManager() = getSystemService(WINDOW_SERVICE) as WindowManager
  private fun preferences() = getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
  private fun readState(): GateState? = try {
    val saved = preferences().getString(FocusGateModule.GATE_STATE, null) ?: return null
    val json = JSONObject(saved)
    GateState(json.optBoolean("active"), json.optBoolean("strictMode"), json.optJSONArray("rules"), json.optString("language", "ja"))
  } catch (_: Exception) {
    null
  }
}

private data class GateState(val active: Boolean, val strictMode: Boolean, val rules: org.json.JSONArray?, val language: String) {
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
    for (index in 0 until unlocks.length()) {
      if ((unlocks.optJSONObject(index)?.optLong("endsAt") ?: Long.MAX_VALUE) <= System.currentTimeMillis()) elapsed += 1
    }
    return (pendingCount - elapsed).coerceAtLeast(0)
  }
  val message: String get() = json.optString("message", "今日の必須項目を完了してください")
  val blockedPackages: List<String> get() = buildList {
    val packages = json.optJSONArray("blockedPackages")
    if (packages != null) {
      for (index in 0 until packages.length()) packages.optString(index).takeIf { it.isNotBlank() }?.let(::add)
    }
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
