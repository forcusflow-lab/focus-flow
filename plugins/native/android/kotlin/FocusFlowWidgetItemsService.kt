package $PACKAGE_NAME.focusflow

import $PACKAGE_NAME.R
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.text.SpannableString
import android.text.Spanned
import android.text.style.StrikethroughSpan
import android.text.style.StyleSpan
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject

class FocusFlowWidgetItemsService : RemoteViewsService() {
  override fun onGetViewFactory(intent: Intent): RemoteViewsFactory = FocusFlowWidgetItemsFactory(applicationContext, intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID))
}

private class FocusFlowWidgetItemsFactory(private val context: Context, private val widgetId: Int) : RemoteViewsService.RemoteViewsFactory {
  private var state = JSONObject()
  private var items = JSONArray()
  override fun onCreate() = Unit
  override fun onDataSetChanged() { val raw = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null); state = try { JSONObject(raw ?: "{}") } catch (_: Exception) { JSONObject() }; items = state.optJSONArray("widgetItems") ?: JSONArray() }
  override fun onDestroy() = Unit
  override fun getCount(): Int = items.length()
  override fun getViewAt(position: Int): RemoteViews? {
    val item = items.optJSONObject(position) ?: return null
    val views = RemoteViews(context.packageName, R.layout.focus_flow_widget_item)
    val palette = state.optJSONObject("widgetPalette")
    val dark = palette?.optBoolean("isDark", false) ?: false
    val opacity = state.optInt("widgetOpacity", 86).coerceIn(0, 100)
    val titleColor = paletteColor(palette, "text", if (dark) "#F2FAF6" else "#1A2925")
    val mutedColor = paletteColor(palette, "muted", if (dark) "#B3C7BE" else "#64736D")
    val completedColor = Color.parseColor(if (dark) "#C2D0CA" else "#66736D")
    val primaryColor = paletteColor(palette, "primary", "#1B6B62")
    val completed = item.optBoolean("completed", false)
    val required = item.optBoolean("required", false)
    val timedLocked = item.optBoolean("timedLocked", false)
    val canToggle = item.optBoolean("canToggle", false)
    val highContrast = opacity < 55
    views.setInt(R.id.focus_flow_widget_item_root, "setBackgroundResource", when { completed && highContrast && !dark -> R.drawable.focus_flow_widget_item_done_light; completed && highContrast -> R.drawable.focus_flow_widget_item_done_dark; highContrast && !dark -> R.drawable.focus_flow_widget_item_light; highContrast -> R.drawable.focus_flow_widget_item_dark; completed -> R.drawable.focus_flow_widget_item_done; required -> R.drawable.focus_flow_widget_item_required; else -> R.drawable.focus_flow_widget_item_background })
    val title = item.optString("title")
    views.setTextViewText(R.id.focus_flow_widget_item_title, if (completed) struck(title) else title)
    views.setTextColor(R.id.focus_flow_widget_item_title, if (completed) completedColor else titleColor)
    // Keep the badge line reserved on regular items so every widget card has the
    // same height and the title/checkbox always share one visual baseline.
    views.setViewVisibility(R.id.focus_flow_widget_item_badge, if (required) View.VISIBLE else View.INVISIBLE)
    views.setTextViewText(R.id.focus_flow_widget_item_badge, if (state.optString("language", "ja") == "en") "MUST" else "必須")
    views.setTextColor(R.id.focus_flow_widget_item_badge, mutedColor)
    if (completed) {
      views.setInt(R.id.focus_flow_widget_item_check, "setBackgroundColor", primaryColor)
      views.setImageViewResource(R.id.focus_flow_widget_item_check, R.drawable.focus_flow_widget_check_mark)
    } else {
      views.setInt(R.id.focus_flow_widget_item_check, "setBackgroundResource", R.drawable.focus_flow_widget_checkbox)
      views.setImageViewResource(R.id.focus_flow_widget_item_check, if (timedLocked) R.drawable.focus_flow_widget_check_locked else R.drawable.focus_flow_widget_check_empty)
    }
    views.setFloat(R.id.focus_flow_widget_item_check, "setAlpha", if (canToggle || completed) 1f else 0.45f)
    val scale = when (state.optJSONObject("widgetTextSizes")?.optString("unified", "standard")) { "compact" -> 0.90f; "large" -> 1.15f; else -> 1f }
    views.setTextViewTextSize(R.id.focus_flow_widget_item_title, TypedValue.COMPLEX_UNIT_SP, 14f * scale)
    // Completion uses a dedicated 48dp touch target. The item copy is a separate
    // view, so the widget cannot treat a checkbox tap as a Deep Link tap.
    views.setOnClickFillInIntent(R.id.focus_flow_widget_item_content, Intent().apply { action = FocusFlowWidgetProvider.ACTION_OPEN_ITEM; putExtra(FocusFlowWidgetProvider.EXTRA_TARGET_ID, item.optString("id")); putExtra(FocusFlowWidgetProvider.EXTRA_KIND, item.optString("kind")) })
    if (canToggle && completed) views.setOnClickFillInIntent(R.id.focus_flow_widget_item_action, Intent().apply { action = FocusFlowWidgetProvider.ACTION_RESTORE; putExtra(FocusFlowWidgetProvider.EXTRA_TARGET_ID, item.optString("id")); putExtra(FocusFlowWidgetProvider.EXTRA_KIND, item.optString("kind")) })
    if (canToggle && !completed) views.setOnClickFillInIntent(R.id.focus_flow_widget_item_action, Intent().apply { action = FocusFlowWidgetProvider.ACTION_COMPLETE; putExtra(FocusFlowWidgetProvider.EXTRA_TARGET_ID, item.optString("id")); putExtra(FocusFlowWidgetProvider.EXTRA_KIND, item.optString("kind")) })
    return views
  }
  override fun getLoadingView(): RemoteViews? = null
  override fun getViewTypeCount(): Int = 1
  override fun getItemId(position: Int): Long = items.optJSONObject(position)?.optString("id")?.hashCode()?.toLong() ?: position.toLong()
  override fun hasStableIds(): Boolean = true
  private fun struck(value: String): CharSequence = SpannableString(value).apply { setSpan(StrikethroughSpan(), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE); setSpan(StyleSpan(Typeface.BOLD), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) }
  private fun paletteColor(palette: JSONObject?, key: String, fallback: String): Int = try { Color.parseColor(palette?.optString(key, fallback) ?: fallback) } catch (_: Exception) { Color.parseColor(fallback) }
}
