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
    val english = intent.getStringExtra(EXTRA_LANGUAGE) == "en"
    val message = intent.getStringExtra(EXTRA_MESSAGE) ?: if (english) "Complete today's must-dos first" else "今日の必須項目を完了してください"
    val strictMode = gateState().optBoolean("strictMode", false)
    val palette = gatePalette()
    val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(dp(24), dp(24), dp(24), dp(24)); setBackgroundColor(palette.background) }
    val panel = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(24), dp(24), dp(24), dp(22)); background = rounded(palette.elevated, 28) }
    panel.addView(TextView(this).apply { text = "Focus Flow"; textSize = 14f; setTextColor(palette.primary); typeface = Typeface.DEFAULT_BOLD; letterSpacing = 0.06f }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(10) })
    panel.addView(TextView(this).apply { text = message; textSize = 23f; setTextColor(palette.text); typeface = Typeface.DEFAULT_BOLD }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(10) })
    panel.addView(TextView(this).apply { text = if (english) { if (strictMode) "Strict mode keeps this app limited until the required items are complete." else "Complete the required items in Focus Flow to continue." } else { if (strictMode) "厳格モード中です。必須項目を完了するまで、このアプリは利用できません。" else "Focus Flowで必須項目を完了すると、このアプリを使えるようになります。" }; textSize = 14f; setTextColor(palette.muted) }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(22) })
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
