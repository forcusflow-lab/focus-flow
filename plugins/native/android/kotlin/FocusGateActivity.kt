package $PACKAGE_NAME.focusflow

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

class FocusGateActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val state = gateState()
    val english = intent.getStringExtra(EXTRA_LANGUAGE) == "en" || state.optString("language") == "en"
    val strictMode = state.optBoolean("strictMode", false)
    val palette = gatePalette()

    var activeScheduledRule: JSONObject? = null
    val rules = state.optJSONArray("rules")
    if (rules != null) {
      for (i in 0 until rules.length()) {
        val rule = rules.optJSONObject(i) ?: continue
        if (rule.optBoolean("isActive", false) && rule.has("schedule") && !rule.isNull("schedule") && rule.optInt("pendingCount", 0) > 0) {
          activeScheduledRule = rule.optJSONObject("schedule")
          break
        }
      }
    }

    val statusText = if (activeScheduledRule != null) {
      val start = activeScheduledRule.optString("startTime", "00:00")
      val end = activeScheduledRule.optString("endTime", "00:00")
      if (english) "Complete the tasks for this time window ($start–$end) to unlock."
      else "この時間帯（$start〜$end）の対象タスクを完了すると解除されます"
    } else {
      if (english) "Complete today's tasks to unlock."
      else "今日のタスクを達成すると制限が解除されます"
    }

    val remainingTasks = buildList {
      val items = state.optJSONArray("widgetItems")
      if (items != null) {
        for (i in 0 until items.length()) {
          val item = items.optJSONObject(i) ?: continue
          if (!item.optBoolean("completed", false) && item.optBoolean("gateRequired", true)) {
            val title = item.optString("title").trim()
            if (title.isNotEmpty()) add(title)
          }
        }
      } else {
        val todos = state.optJSONArray("todoQueue")
        if (todos != null) {
          for (i in 0 until todos.length()) {
            val title = todos.optJSONObject(i)?.optString("title")?.trim().orEmpty()
            if (title.isNotEmpty()) add(title)
          }
        }
        val habits = state.optJSONArray("habitQueue")
        if (habits != null) {
          for (i in 0 until habits.length()) {
            val title = habits.optJSONObject(i)?.optString("title")?.trim().orEmpty()
            if (title.isNotEmpty()) add(title)
          }
        }
      }
    }

    val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(dp(24), dp(24), dp(24), dp(24)); setBackgroundColor(palette.background) }
    val panel = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(24), dp(24), dp(24), dp(22)); background = rounded(palette.elevated, 28) }
    panel.addView(View(this).apply { background = rounded(palette.primary, 3) }, LinearLayout.LayoutParams(dp(36), dp(4)).apply { bottomMargin = dp(20) })
    panel.addView(TextView(this).apply { text = if (english) "Focus time" else "集中タイムです"; textSize = 14f; setTextColor(palette.primary); typeface = Typeface.DEFAULT_BOLD; letterSpacing = 0.06f }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(10) })
    panel.addView(TextView(this).apply { text = statusText; textSize = 20f; setTextColor(palette.text); typeface = Typeface.DEFAULT_BOLD }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(12) })

    if (remainingTasks.isNotEmpty()) {
      val taskListContainer = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        background = rounded(palette.primarySoft, 14)
        setPadding(dp(14), dp(10), dp(14), dp(10))
      }
      val displayTasks = remainingTasks.take(3)
      for (taskTitle in displayTasks) {
        val row = LinearLayout(this).apply {
          orientation = LinearLayout.HORIZONTAL
          gravity = Gravity.CENTER_VERTICAL
          setPadding(0, dp(3), 0, dp(3))
        }
        row.addView(TextView(this).apply {
          text = "• "
          textSize = 13f
          setTextColor(palette.primary)
          typeface = Typeface.DEFAULT_BOLD
        })
        row.addView(TextView(this).apply {
          text = taskTitle
          textSize = 13f
          setTextColor(palette.text)
          maxLines = 1
          ellipsize = android.text.TextUtils.TruncateAt.END
        })
        taskListContainer.addView(row)
      }
      if (remainingTasks.size > 3) {
        val extra = remainingTasks.size - 3
        taskListContainer.addView(TextView(this).apply {
          text = if (english) "+$extra more" else "+ほか${extra}件"
          textSize = 11f
          setTextColor(palette.muted)
          setPadding(dp(12), dp(2), 0, 0)
        })
      }
      panel.addView(taskListContainer, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(16) })
    }

    panel.addView(TextView(this).apply { text = if (english) { if (strictMode) "Strict mode keeps this app limited until the required items are complete." else "Complete the required items in Focus Flow to continue." } else { if (strictMode) "厳格モード中です。必須項目を完了するまで、このアプリは利用できません。" else "Focus Flowで必須項目を完了すると、このアプリを使えるようになります。" }; textSize = 13f; setTextColor(palette.muted) }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(20) })
    panel.addView(Button(this).apply { text = if (english) "View today's items" else "今日の項目を確認する"; textSize = 15f; setTextColor(palette.onPrimary); background = rounded(palette.primary, 18); minHeight = dp(52); setOnClickListener { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("$DEEP_LINK_SCHEME:///")).setPackage(packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)); finish() } }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)))
    if (!strictMode) panel.addView(Button(this).apply { text = if (english) "Open app settings" else "アプリ情報を開く"; textSize = 13f; setTextColor(palette.primary); background = rounded(palette.primarySoft, 16); minHeight = dp(48); setOnClickListener { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))); finish() } }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(48)).apply { topMargin = dp(10) })
    layout.addView(panel, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
    setContentView(layout)
  }

  private fun gateState(): JSONObject = try { JSONObject(getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, "{}") ?: "{}") } catch (_: Exception) { JSONObject() }
  private fun gatePalette(): GateActivityPalette { val value = gateState().optJSONObject("widgetPalette"); return GateActivityPalette.from(value) }
  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
  private fun rounded(color: Int, radiusDp: Int) = GradientDrawable().apply { setColor(color); cornerRadius = dp(radiusDp).toFloat() }

  companion object { const val EXTRA_MESSAGE = "focusFlowMessage"; const val EXTRA_LANGUAGE = "focusFlowLanguage" }
}

private data class GateActivityPalette(val background: Int, val elevated: Int, val primarySoft: Int, val primary: Int, val text: Int, val muted: Int, val onPrimary: Int) {
  companion object {
    private fun color(raw: String?, fallback: String): Int = try { Color.parseColor(raw?.takeIf { it.startsWith("#") } ?: fallback) } catch (_: Exception) { Color.parseColor(fallback) }
    fun from(value: JSONObject?): GateActivityPalette = GateActivityPalette(color(value?.optString("background"), "#10201F"), color(value?.optString("elevated"), "#17302E"), color(value?.optString("primarySoft"), "#214B45"), color(value?.optString("primary"), "#79C7AE"), color(value?.optString("text"), "#F1F7F4"), color(value?.optString("muted"), "#B8CEC7"), color(value?.optString("background"), "#10201F"))
  }
}
