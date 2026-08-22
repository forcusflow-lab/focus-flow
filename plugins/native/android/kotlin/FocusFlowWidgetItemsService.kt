package $PACKAGE_NAME.focusflow

import $PACKAGE_NAME.R
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.text.SpannableString
import android.text.Spanned
import android.text.style.StrikethroughSpan
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
    val selection = state.optJSONObject("widgetThemes")?.optJSONObject("unified")
    val background = selection?.optString("background", "default") ?: "default"
    val light = background == "amber" || background == "blush"
    val opacity = state.optInt("widgetOpacity", 86).coerceIn(0, 100)
    val titleColor = Color.parseColor(if (light) "#2F2614" else "#FFFFFF")
    val mutedColor = Color.parseColor(if (light) "#6E592E" else "#CBE7DE")
    val completedColor = Color.parseColor(if (light) "#8B7D63" else "#AFC9C1")
    val completed = item.optBoolean("completed", false)
    val required = item.optBoolean("required", false)
    val timedLocked = item.optBoolean("timedLocked", false)
    val canToggle = item.optBoolean("canToggle", false)
    val highContrast = opacity < 55
    views.setInt(R.id.focus_flow_widget_item_root, "setBackgroundResource", when { completed && highContrast && light -> R.drawable.focus_flow_widget_item_done_light; completed && highContrast -> R.drawable.focus_flow_widget_item_done_dark; required && highContrast && light -> R.drawable.focus_flow_widget_item_light; required && highContrast -> R.drawable.focus_flow_widget_item_dark; completed -> R.drawable.focus_flow_widget_item_done; required -> R.drawable.focus_flow_widget_item_required; else -> R.drawable.focus_flow_widget_item_background })
    val title = item.optString("title")
    views.setTextViewText(R.id.focus_flow_widget_item_title, if (completed) struck(title) else title)
    views.setTextColor(R.id.focus_flow_widget_item_title, if (completed) completedColor else titleColor)
    views.setViewVisibility(R.id.focus_flow_widget_item_badge, if (required) View.VISIBLE else View.GONE)
    views.setTextViewText(R.id.focus_flow_widget_item_badge, if (state.optString("language", "ja") == "en") "MUST" else "必須")
    views.setTextColor(R.id.focus_flow_widget_item_badge, mutedColor)
    views.setInt(R.id.focus_flow_widget_item_check, "setBackgroundResource", if (completed) R.drawable.focus_flow_widget_checkbox_done else R.drawable.focus_flow_widget_checkbox)
    views.setTextViewText(R.id.focus_flow_widget_item_check, when { timedLocked -> "…"; completed -> "✓"; else -> "" })
    views.setFloat(R.id.focus_flow_widget_item_check, "setAlpha", if (canToggle || completed) 1f else 0.45f)
    val scale = when (state.optJSONObject("widgetTextSizes")?.optString("unified", "standard")) { "compact" -> 0.90f; "large" -> 1.15f; else -> 1f }
    views.setTextViewTextSize(R.id.focus_flow_widget_item_title, TypedValue.COMPLEX_UNIT_SP, 14f * scale)
    views.setOnClickFillInIntent(R.id.focus_flow_widget_item_root, Intent().apply { action = FocusFlowWidgetProvider.ACTION_OPEN_ITEM; putExtra(FocusFlowWidgetProvider.EXTRA_TARGET_ID, item.optString("id")); putExtra(FocusFlowWidgetProvider.EXTRA_KIND, item.optString("kind")) })
    if (canToggle && !completed) views.setOnClickFillInIntent(R.id.focus_flow_widget_item_check, Intent().apply { action = FocusFlowWidgetProvider.ACTION_COMPLETE; putExtra(FocusFlowWidgetProvider.EXTRA_TARGET_ID, item.optString("id")); putExtra(FocusFlowWidgetProvider.EXTRA_KIND, item.optString("kind")) })
    return views
  }
  override fun getLoadingView(): RemoteViews? = null
  override fun getViewTypeCount(): Int = 1
  override fun getItemId(position: Int): Long = items.optJSONObject(position)?.optString("id")?.hashCode()?.toLong() ?: position.toLong()
  override fun hasStableIds(): Boolean = true
  private fun struck(value: String): CharSequence = SpannableString(value).apply { setSpan(StrikethroughSpan(), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) }
}
