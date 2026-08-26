package $PACKAGE_NAME.focusflow

import $PACKAGE_NAME.R
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.text.SpannableString
import android.text.Spanned
import android.text.style.StrikethroughSpan
import android.text.style.StyleSpan
import android.graphics.Typeface
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

class FocusFlowWidgetProvider : AppWidgetProvider() {
  // Collection RemoteViews failed on the target launcher even after initial
  // layout isolation. This provider now uses only a static RemoteViews tree so
  // widget placement and later state synchronization share the same safe path.
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { ids.forEach { safeUpdateWidget(context, manager, it) } }
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: android.os.Bundle) { safeUpdateWidget(context, manager, id) }

  override fun onReceive(context: Context, intent: Intent) {
    val updated = when (intent.action) {
      ACTION_COMPLETE -> complete(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty())
      ACTION_RESTORE -> restore(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty())
      ACTION_OPEN_ITEM -> { openItem(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty()); false }
      else -> null
    }
    if (updated != null) { if (updated) refreshAll(context); return }
    super.onReceive(context, intent)
  }

  private fun safeUpdateWidget(context: Context, manager: AppWidgetManager, id: Int) {
    try { updateWidget(context, manager, id) } catch (_: Exception) { updateFallbackWidget(context, manager, id) }
  }

  // This layout is intentionally free of AdapterView, layout_weight and 0dp
  // sizing. It must remain safe for the launcher to inflate during add and
  // later refreshes, even before the app has synchronized any item state.
  private fun updateInitialWidget(context: Context, manager: AppWidgetManager, id: Int, fallback: Boolean = false) {
    val state = state(context)
    val english = state.optString("language", "ja") == "en"
    val views = RemoteViews(context.packageName, R.layout.focus_flow_widget_initial)
    bindTheme(views, state)
    bindHeader(views, state, english)
    bindStaticRows(context, views, state, id, english)
    if (fallback) views.setTextViewText(R.id.focus_flow_widget_empty, if (english) "Open Focus Flow to refresh your list" else "Focus Flowを開くと項目を更新します")
    views.setOnClickPendingIntent(R.id.focus_flow_widget_root, todayIntent(context, id))
    manager.updateAppWidget(id, views)
  }

  // Keep a placed widget valid and offer a route into Today on an unexpected
  // Provider-side failure. No collection or RemoteViewsService is involved.
  private fun updateFallbackWidget(context: Context, manager: AppWidgetManager, id: Int) = updateInitialWidget(context, manager, id, true)

  private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
    updateInitialWidget(context, manager, id)
  }

  private fun state(context: Context): JSONObject {
    val saved = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null)
    return try { JSONObject(saved ?: "{}") } catch (_: Exception) { JSONObject() }
  }

  private fun bindTheme(views: RemoteViews, state: JSONObject) {
    val palette = state.optJSONObject("widgetPalette")
    views.setInt(R.id.focus_flow_widget_root, "setBackgroundColor", withOpacity(paletteColor(palette, "background", "#F7F8F5"), state.optInt("widgetOpacity", 86).coerceIn(0, 100)))
  }

  private fun bindHeader(views: RemoteViews, state: JSONObject, english: Boolean) {
    val palette = state.optJSONObject("widgetPalette")
    // Widget copy must not inherit a near-background app palette. These are
    // deliberate light/dark semantic colors with readable fallback contrast.
    val dark = palette?.optBoolean("isDark", false) ?: false
    val title = if (dark) Color.parseColor("#F4FBF7") else Color.parseColor("#13251F")
    val detail = if (dark) Color.parseColor("#B7CCC2") else Color.parseColor("#4E655B")
    val pending = state.optInt("pendingCount", 0)
    val active = state.optBoolean("active", false)
    views.setTextColor(R.id.focus_flow_widget_title, title)
    views.setTextColor(R.id.focus_flow_widget_status, detail)
    views.setTextColor(R.id.focus_flow_widget_empty, detail)
    val scale = when (state.optString("widgetTextScale", "standard")) { "compact" -> 0.92f; "large" -> 1.14f; else -> 1f }
    views.setTextViewTextSize(R.id.focus_flow_widget_title, android.util.TypedValue.COMPLEX_UNIT_DIP, 11f * scale)
    views.setTextViewTextSize(R.id.focus_flow_widget_status, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
    views.setTextViewTextSize(R.id.focus_flow_widget_empty, android.util.TypedValue.COMPLEX_UNIT_DIP, 11f * scale)
    views.setTextViewText(R.id.focus_flow_widget_title, if (english) "TODAY" else "今日の項目")
    views.setTextViewText(R.id.focus_flow_widget_status, if (!active) if (english) "App limits off" else "集中制限はオフ" else if (pending == 0) if (english) "Must-dos complete" else "必須項目を完了しました" else if (english) "$pending must-do${if (pending == 1) "" else "s"} remaining" else "必須項目 残り${pending}件")
  }

  private data class StaticRowIds(val row: Int, val action: Int, val content: Int, val title: Int, val badge: Int)

  private fun staticRowIds(index: Int): StaticRowIds = if (index == 0) {
    StaticRowIds(R.id.focus_flow_widget_static_row_one, R.id.focus_flow_widget_static_row_one_action, R.id.focus_flow_widget_static_row_one_content, R.id.focus_flow_widget_static_row_one_title, R.id.focus_flow_widget_static_row_one_badge)
  } else {
    StaticRowIds(R.id.focus_flow_widget_static_row_two, R.id.focus_flow_widget_static_row_two_action, R.id.focus_flow_widget_static_row_two_content, R.id.focus_flow_widget_static_row_two_title, R.id.focus_flow_widget_static_row_two_badge)
  }

  private fun bindStaticRows(context: Context, views: RemoteViews, state: JSONObject, widgetId: Int, english: Boolean) {
    val all = state.optJSONArray("widgetItems") ?: JSONArray()
    val rows = mutableListOf<JSONObject>()
    for (index in 0 until all.length()) all.optJSONObject(index)?.let { if (rows.size < 2) rows.add(it) }
    val palette = state.optJSONObject("widgetPalette")
    val dark = palette?.optBoolean("isDark", false) ?: false
    val titleColor = if (dark) Color.parseColor("#F4FBF7") else Color.parseColor("#13251F")
    val mutedColor = if (dark) Color.parseColor("#B7CCC2") else Color.parseColor("#4E655B")
    val scale = when (state.optString("widgetTextScale", "standard")) { "compact" -> 0.92f; "large" -> 1.14f; else -> 1f }
    views.setViewVisibility(R.id.focus_flow_widget_empty, if (rows.isEmpty()) View.VISIBLE else View.GONE)
    if (rows.isEmpty()) views.setTextViewText(R.id.focus_flow_widget_empty, if (english) "Open Focus Flow to add today’s items" else "今日の項目はありません")
    for (index in 0..1) {
      val ids = staticRowIds(index)
      val item = rows.getOrNull(index)
      views.setViewVisibility(ids.row, if (item == null) View.GONE else View.VISIBLE)
      if (item != null) bindStaticRow(context, views, ids, item, widgetId, english, titleColor, mutedColor, scale)
    }
  }

  private fun bindStaticRow(context: Context, views: RemoteViews, ids: StaticRowIds, item: JSONObject, widgetId: Int, english: Boolean, titleColor: Int, mutedColor: Int, scale: Float) {
    val completed = item.optBoolean("completed", false)
    val canToggle = item.optBoolean("canToggle", false)
    val timedLocked = item.optBoolean("timedLocked", false)
    val title = item.optString("title")
    val requiredLabel = if (english) "MUST" else "必須"
    val badge = listOfNotNull(if (item.optBoolean("required", false)) requiredLabel else null, item.optString("windowLabel", "").ifBlank { null }).joinToString(" · ")
    views.setTextViewText(ids.title, if (completed) struck(title) else title)
    views.setTextColor(ids.title, if (completed) mutedColor else titleColor)
    views.setTextViewTextSize(ids.title, android.util.TypedValue.COMPLEX_UNIT_DIP, 13f * scale)
    views.setViewVisibility(ids.badge, if (badge.isBlank()) View.GONE else View.VISIBLE)
    views.setTextViewText(ids.badge, badge)
    views.setTextColor(ids.badge, mutedColor)
    views.setTextViewTextSize(ids.badge, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
    if (completed) {
      views.setInt(ids.action, "setBackgroundColor", paletteColor(state(context).optJSONObject("widgetPalette"), "primary", "#1B6B62"))
      views.setImageViewResource(ids.action, R.drawable.focus_flow_widget_check_mark)
    } else {
      views.setInt(ids.action, "setBackgroundResource", R.drawable.focus_flow_widget_checkbox)
      views.setImageViewResource(ids.action, if (timedLocked) R.drawable.focus_flow_widget_check_locked else R.drawable.focus_flow_widget_check_empty)
    }
    views.setFloat(ids.action, "setAlpha", if (canToggle || completed) 1f else 0.45f)
    val itemId = item.optString("id")
    val kind = item.optString("kind")
    views.setOnClickPendingIntent(ids.content, detailIntent(context, widgetId, itemId, kind))
    val action = if (completed) ACTION_RESTORE else ACTION_COMPLETE
    views.setOnClickPendingIntent(ids.action, if (canToggle) actionIntent(context, widgetId, action, itemId, kind) else todayIntent(context, widgetId + if (ids.row == R.id.focus_flow_widget_static_row_one) 20 else 21))
  }

  private fun struck(value: String): CharSequence = SpannableString(value).apply { setSpan(StrikethroughSpan(), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE); setSpan(StyleSpan(Typeface.BOLD), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) }

  private fun complete(context: Context, targetId: String, kind: String): Boolean {
    if (targetId.isBlank() || (kind != "todo" && kind != "habit")) return false
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val current = state(context)
    val items = current.optJSONArray("widgetItems") ?: return false
    var target: JSONObject? = null
    for (index in 0 until items.length()) { val item = items.optJSONObject(index); if (item?.optString("id") == targetId && item.optString("kind") == kind) target = item }
    val item = target ?: return false
    if (item.optBoolean("timedLocked", false) || !item.optBoolean("canToggle", false) || item.optBoolean("completed", false)) return false
    val actions = widgetActions(preferences)
    for (index in 0 until actions.length()) { val action = actions.optJSONObject(index); if (action?.optString("id") == targetId && action.optString("kind") == kind && action.optString("operation") == "complete") return false }
    actions.put(JSONObject().put("id", targetId).put("kind", kind).put("operation", "complete"))
    if (current.optString("widgetCompletedDisplay", "dim") == "dim") { item.put("completed", true); item.put("timedLocked", false); current.put("widgetItems", items) } else { val remaining = JSONArray(); for (index in 0 until items.length()) { val candidate = items.optJSONObject(index) ?: continue; if (candidate.optString("id") != targetId || candidate.optString("kind") != kind) remaining.put(candidate) }; current.put("widgetItems", remaining) }
    if (item.optBoolean("required", false)) updateRequiredState(current, targetId, kind)
    preferences.edit().putString(FocusGateModule.GATE_STATE, current.toString()).putString(FocusGateModule.WIDGET_ACTIONS, actions.toString()).putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply()
    return true
  }

  private fun restore(context: Context, targetId: String, kind: String): Boolean {
    if (targetId.isBlank() || (kind != "todo" && kind != "habit")) return false
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val current = state(context)
    val items = current.optJSONArray("widgetItems") ?: return false
    var target: JSONObject? = null
    for (index in 0 until items.length()) { val item = items.optJSONObject(index); if (item?.optString("id") == targetId && item.optString("kind") == kind) target = item }
    val item = target ?: return false
    if (!item.optBoolean("completed", false) || !item.optBoolean("canToggle", false)) return false
    item.put("completed", false)
    item.put("timedLocked", false)
    if (item.optBoolean("required", false)) restoreRequiredState(current, item, kind)
    val actions = widgetActions(preferences)
    actions.put(JSONObject().put("id", targetId).put("kind", kind).put("operation", "restore"))
    preferences.edit().putString(FocusGateModule.GATE_STATE, current.put("widgetItems", items).toString()).putString(FocusGateModule.WIDGET_ACTIONS, actions.toString()).putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply()
    return true
  }

  private fun paletteColor(palette: JSONObject?, key: String, fallback: String): Int = try { Color.parseColor(palette?.optString(key, fallback) ?: fallback) } catch (_: Exception) { Color.parseColor(fallback) }
  private fun withOpacity(color: Int, opacity: Int): Int = Color.argb((opacity * 2.55f).toInt(), Color.red(color), Color.green(color), Color.blue(color))

  private fun updateRequiredState(state: JSONObject, targetId: String, kind: String) {
    state.put("pendingCount", (state.optInt("pendingCount") - 1).coerceAtLeast(0))
    val queueKey = if (kind == "todo") "todoQueue" else "habitQueue"
    val queue = state.optJSONArray(queueKey) ?: JSONArray(); val remainingQueue = JSONArray()
    for (index in 0 until queue.length()) { val entry = queue.optJSONObject(index) ?: continue; if (entry.optString("id") != targetId) remainingQueue.put(entry) }
    state.put(queueKey, remainingQueue)
    if (kind == "todo") { state.put("pendingTodos", (state.optInt("pendingTodos") - 1).coerceAtLeast(0)); state.put("completedTodoTotal", state.optInt("completedTodoTotal") + 1) } else { state.put("pendingHabits", (state.optInt("pendingHabits") - 1).coerceAtLeast(0)); state.put("completedHabitTotal", state.optInt("completedHabitTotal") + 1) }
  }

  private fun restoreRequiredState(state: JSONObject, item: JSONObject, kind: String) {
    state.put("pendingCount", state.optInt("pendingCount") + 1)
    val queueKey = if (kind == "todo") "todoQueue" else "habitQueue"
    val queue = state.optJSONArray(queueKey) ?: JSONArray()
    queue.put(JSONObject().put("id", item.optString("id")).put("title", item.optString("title")))
    state.put(queueKey, queue)
    if (kind == "todo") { state.put("pendingTodos", state.optInt("pendingTodos") + 1); state.put("completedTodoTotal", (state.optInt("completedTodoTotal") - 1).coerceAtLeast(0)) } else { state.put("pendingHabits", state.optInt("pendingHabits") + 1); state.put("completedHabitTotal", (state.optInt("completedHabitTotal") - 1).coerceAtLeast(0)) }
  }

  private fun openItem(context: Context, targetId: String, kind: String) { if (targetId.isBlank() || (kind != "todo" && kind != "habit")) return; context.startActivity(deepLink(context, if (kind == "habit") "habits" else "todos", targetId).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)) }
  private fun todayIntent(context: Context, id: Int): PendingIntent = PendingIntent.getActivity(context, id, deepLink(context, "today"), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun detailIntent(context: Context, widgetId: Int, targetId: String, kind: String): PendingIntent = PendingIntent.getActivity(context, ("detail:$widgetId:$kind:$targetId").hashCode(), deepLink(context, if (kind == "habit") "habits" else "todos", targetId), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun actionIntent(context: Context, widgetId: Int, action: String, targetId: String, kind: String): PendingIntent = PendingIntent.getBroadcast(context, ("action:$widgetId:$action:$kind:$targetId").hashCode(), Intent(context, FocusFlowWidgetProvider::class.java).apply { this.action = action; data = Uri.parse("$DEEP_LINK_SCHEME://widget/$widgetId/$action/$kind/$targetId"); putExtra(EXTRA_TARGET_ID, targetId); putExtra(EXTRA_KIND, kind) }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun deepLink(context: Context, destination: String, targetId: String? = null): Intent {
    val uri = Uri.parse("$DEEP_LINK_SCHEME:///").buildUpon().apply {
      when (destination) {
        "todos" -> appendPath("todos")
        "habits" -> appendPath("habits")
      }
      if (targetId != null) appendQueryParameter("open", targetId)
    }.build()
    return Intent(Intent.ACTION_VIEW, uri).setPackage(context.packageName)
  }
  private fun widgetActions(preferences: android.content.SharedPreferences): JSONArray = try { JSONArray(preferences.getString(FocusGateModule.WIDGET_ACTIONS, "[]") ?: "[]") } catch (_: Exception) { JSONArray() }

  companion object {
    const val ACTION_COMPLETE = "focusflow.widget.COMPLETE"
    const val ACTION_RESTORE = "focusflow.widget.RESTORE"
    const val ACTION_OPEN_ITEM = "focusflow.widget.OPEN_ITEM"
    const val EXTRA_TARGET_ID = "targetId"
    const val EXTRA_KIND = "kind"
    fun refreshAll(context: Context) { val manager = AppWidgetManager.getInstance(context); val provider = FocusFlowWidgetProvider(); manager.getAppWidgetIds(ComponentName(context, FocusFlowWidgetProvider::class.java)).forEach { id -> provider.safeUpdateWidget(context, manager, id) } }
  }
}
