package $PACKAGE_NAME.focusflow

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
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
  private var lastReliableForegroundPackage: String? = null
  private val foregroundRecheckDelays = longArrayOf(80L, 240L, 520L, 900L)
  private var gateCtaSuppressUntil = 0L

  override fun onServiceConnected() {
    lastPackage = ""
    lastBlockedAt = 0L
    foregroundRecheck?.let(foregroundRecheckHandler::removeCallbacks)
    foregroundRecheck = null
    lastReliableForegroundPackage = null
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
    if (System.currentTimeMillis() < gateCtaSuppressUntil) {
      hideGateOverlay()
      return
    }
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
      lastReliableForegroundPackage = candidatePackage
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
    val activeCandidate = activePackage?.takeIf { it.isNotBlank() }
    // 遮断用UIがまだ前面として報告される切替の途中でも、対象アプリを送信元として受けたイベントは
    // 再遮断する。ただし、背景化された対象アプリの遅延イベントが前面の制限外アプリを
    // 上書きしないよう、実際の前面が同じ対象または一過性システムUIの場合だけ採用する。
    if (eventCandidate != null && state.ruleBlocking(eventCandidate) != null &&
      (activeCandidate == null || activeCandidate == eventCandidate || isTransientForegroundPackage(activeCandidate))
    ) return eventCandidate
    // 遮断Overlay表示中は、システムUIやFocus Flow自身から発火する短命なイベントで
    // 下層の遮断対象を「解除」と誤判定してOverlayを閉じない。
    if (gateOverlay != null && gateOverlayPackage != null &&
      (activeCandidate == null || isTransientForegroundPackage(activeCandidate))
    ) return gateOverlayPackage
    return activeCandidate ?: eventCandidate ?: lastReliableForegroundPackage
  }

  private fun isTransientForegroundPackage(packageName: String): Boolean =
    packageName == applicationContext.packageName ||
      packageName == "android" ||
      packageName.startsWith("com.android.systemui")

  private fun showGateOverlay(packageName: String, rule: GateRule, state: GateState) {
    if (gateOverlay != null && gateOverlayPackage == packageName) return
    hideGateOverlay()

    val english = state.language == "en"
    val palette = state.palette
    val layout = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(dp(24), dp(24), dp(24), dp(24))
      setBackgroundColor(palette.background)
      isClickable = true
      isFocusable = false
    }
    val panel = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(24), dp(24), dp(24), dp(22))
      background = roundedBackground(palette.elevated, 28)
    }
    panel.addView(View(this).apply { background = roundedBackground(palette.primary, 3) }, LinearLayout.LayoutParams(dp(36), dp(4)).apply { bottomMargin = dp(22) })
    panel.addView(TextView(this).apply {
      text = "Focus Flow"
      textSize = 14f
      setTextColor(palette.primary)
      gravity = Gravity.START
      setTypeface(typeface, android.graphics.Typeface.BOLD)
      letterSpacing = 0.06f
      setPadding(0, 0, 0, dp(10))
    })
    panel.addView(TextView(this).apply {
      text = rule.message
      textSize = 23f
      setTextColor(palette.text)
      gravity = Gravity.START
      setTypeface(typeface, android.graphics.Typeface.BOLD)
      setPadding(0, 0, 0, dp(10))
    })
    panel.addView(TextView(this).apply {
      text = if (english) {
        if (state.strictMode) "Strict mode keeps this app limited until the required items are complete." else "Complete the required items in Focus Flow to continue."
      } else {
        if (state.strictMode) "厳格モード中です。必須項目を完了するまで、このアプリは利用できません。" else "Focus Flowで必須項目を完了すると、このアプリを使えるようになります。"
      }
      textSize = 14f
      setTextColor(palette.muted)
      gravity = Gravity.START
      setPadding(0, 0, 0, dp(22))
    })
    panel.addView(Button(this).apply {
      text = if (english) "View today's items" else "今日の項目を確認する"
      textSize = 15f
      setTextColor(palette.onPrimary)
      background = roundedBackground(palette.primary, 18)
      minHeight = dp(52)
      setPadding(dp(16), 0, dp(16), 0)
      setOnClickListener {
        foregroundRecheck?.let(foregroundRecheckHandler::removeCallbacks)
        foregroundRecheck = null
        lastReliableForegroundPackage = applicationContext.packageName
        gateCtaSuppressUntil = System.currentTimeMillis() + 3_000L
        hideGateOverlay()
        startActivity(focusFlowTodayIntent())
      }
    }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)))
    if (!state.strictMode) panel.addView(Button(this).apply {
      text = if (english) "Open app settings" else "アプリ情報を開く"
      textSize = 13f
      setTextColor(palette.primary)
      background = roundedBackground(palette.primarySoft, 16)
      minHeight = dp(48)
      setOnClickListener {
        hideGateOverlay()
        startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${applicationContext.packageName}")).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
      }
    }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(48)).apply { topMargin = dp(10) })
    layout.addView(panel, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))

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
      lastReliableForegroundPackage = packageName
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
    Uri.parse("$DEEP_LINK_SCHEME:///"),
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
  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
  private fun roundedBackground(color: Int, radiusDp: Int) = GradientDrawable().apply { setColor(color); cornerRadius = dp(radiusDp).toFloat() }
  private fun preferences() = getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
  private fun readState(): GateState? = try {
    val saved = preferences().getString(FocusGateModule.GATE_STATE, null) ?: return null
    val json = JSONObject(saved)
    GateState(json.optBoolean("active"), json.optBoolean("strictMode"), json.optJSONArray("rules"), json.optString("language", "ja"), GatePalette.from(json.optJSONObject("widgetPalette")))
  } catch (_: Exception) {
    null
  }
}

private data class GateState(val active: Boolean, val strictMode: Boolean, val rules: org.json.JSONArray?, val language: String, val palette: GatePalette) {
  fun ruleBlocking(packageName: String): GateRule? {
    if (!active || rules == null) return null
    for (index in 0 until rules.length()) {
      val rule = rules.optJSONObject(index)?.let(::GateRule) ?: continue
      if (rule.effectivePendingCount > 0 && rule.isWithinSchedule() && packageName in rule.blockedPackages) return rule
    }
    return null
  }
}

private data class GatePalette(val background: Int, val elevated: Int, val primarySoft: Int, val primary: Int, val text: Int, val muted: Int, val onPrimary: Int) {
  companion object {
    private fun color(raw: String?, fallback: String): Int = try { Color.parseColor(raw?.takeIf { it.startsWith("#") } ?: fallback) } catch (_: Exception) { Color.parseColor(fallback) }
    fun from(value: JSONObject?): GatePalette = GatePalette(
      background = color(value?.optString("background"), "#10201F"),
      elevated = color(value?.optString("elevated"), "#17302E"),
      primarySoft = color(value?.optString("primarySoft"), "#214B45"),
      primary = color(value?.optString("primary"), "#79C7AE"),
      text = color(value?.optString("text"), "#F1F7F4"),
      muted = color(value?.optString("muted"), "#B8CEC7"),
      onPrimary = color(value?.optString("background"), "#10201F"),
    )
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
