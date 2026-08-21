package $PACKAGE_NAME.focusflow

import $PACKAGE_NAME.R
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

class FocusFlowWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { ids.forEach { updateWidget(context, manager, it) } }
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: android.os.Bundle) { updateWidget(context, manager, id) }

  override fun onReceive(context: Context, intent: Intent) {
    val updated = when (intent.action) {
      ACTION_COMPLETE -> complete(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty())
      ACTION_UNDO -> undo(context)
      else -> null
    }
    if (updated != null) { if (updated) refreshAll(context); return }
    super.onReceive(context, intent)
  }

  private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
    val state = state(context)
    val english = state.optString("language", "ja") == "en"
    val views = RemoteViews(context.packageName, R.layout.focus_flow_widget)
    bindTheme(views, state)
    bindHeader(views, state, english)
    bindItems(context, id, views, state, english)
    bindUndo(context, id, views, english)
    views.setOnClickPendingIntent(R.id.focus_flow_widget_root, launchIntent(context, id))
    manager.updateAppWidget(id, views)
  }

  private fun state(context: Context): JSONObject {
    val saved = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null)
    return try { JSONObject(saved ?: "{}") } catch (_: Exception) { JSONObject() }
  }

  private fun bindTheme(views: RemoteViews, state: JSONObject) {
    val selection = state.optJSONObject("widgetThemes")?.optJSONObject("unified")
    val background = selection?.optString("background", "default") ?: "default"
    val requestedAccent = selection?.optString("accent", "auto") ?: "auto"
    val accent = if (requestedAccent == "auto") autoAccent(background) else requestedAccent
    val light = background == "amber"
    val title = Color.parseColor(if (light) "#3F310B" else "#FFFFFF")
    val detail = Color.parseColor(if (light) "#65541F" else "#DDF1EB")
    val muted = Color.parseColor(if (light) "#755F2A" else "#C7E6DE")
    views.setInt(R.id.focus_flow_widget_root, "setBackgroundResource", backgroundResource(background))
    views.setFloat(R.id.focus_flow_widget_root, "setAlpha", when (state.optString("widgetTransparency", "soft")) { "clear" -> 0.68f; "soft" -> 0.86f; else -> 1f })
    views.setTextColor(R.id.focus_flow_widget_title, title)
    views.setTextColor(R.id.focus_flow_widget_status, detail)
    views.setTextColor(R.id.focus_flow_widget_empty, detail)
    listOf(R.id.focus_flow_widget_item_1_title, R.id.focus_flow_widget_item_2_title, R.id.focus_flow_widget_item_3_title, R.id.focus_flow_widget_item_4_title).forEach { views.setTextColor(it, title) }
    listOf(R.id.focus_flow_widget_item_1_badge, R.id.focus_flow_widget_item_2_badge, R.id.focus_flow_widget_item_3_badge, R.id.focus_flow_widget_item_4_badge).forEach { views.setTextColor(it, muted) }
    listOf(R.id.focus_flow_widget_item_1_check, R.id.focus_flow_widget_item_2_check, R.id.focus_flow_widget_item_3_check, R.id.focus_flow_widget_item_4_check).forEach { views.setInt(it, "setBackgroundResource", accentResource(accent)) }
    val size = state.optJSONObject("widgetTextSizes")?.optString("unified", "standard") ?: "standard"
    val scale = when (size) { "compact" -> 0.90f; "large" -> 1.15f; else -> 1f }
    views.setTextViewTextSize(R.id.focus_flow_widget_title, TypedValue.COMPLEX_UNIT_SP, 12f * scale)
    views.setTextViewTextSize(R.id.focus_flow_widget_status, TypedValue.COMPLEX_UNIT_SP, 11f * scale)
    listOf(R.id.focus_flow_widget_item_1_title, R.id.focus_flow_widget_item_2_title, R.id.focus_flow_widget_item_3_title, R.id.focus_flow_widget_item_4_title).forEach { views.setTextViewTextSize(it, TypedValue.COMPLEX_UNIT_SP, 14f * scale) }
  }

  private fun bindHeader(views: RemoteViews, state: JSONObject, english: Boolean) {
    val pending = state.optInt("pendingCount", 0)
    val active = state.optBoolean("active", false)
    views.setTextViewText(R.id.focus_flow_widget_title, if (english) "TODAY" else "今日の項目")
    views.setTextViewText(R.id.focus_flow_widget_status, if (!active) if (english) "App limits off" else "集中制限はオフ" else if (pending == 0) if (english) "Must-dos complete" else "必須項目を完了しました" else if (english) "$pending must-do${if (pending == 1) "" else "s"} remaining" else "必須項目 残り${pending}件")
  }

  private fun bindItems(context: Context, widgetId: Int, views: RemoteViews, state: JSONObject, english: Boolean) {
    val rows = listOf(
      Triple(R.id.focus_flow_widget_item_1, R.id.focus_flow_widget_item_1_check, Pair(R.id.focus_flow_widget_item_1_title, R.id.focus_flow_widget_item_1_badge)),
      Triple(R.id.focus_flow_widget_item_2, R.id.focus_flow_widget_item_2_check, Pair(R.id.focus_flow_widget_item_2_title, R.id.focus_flow_widget_item_2_badge)),
      Triple(R.id.focus_flow_widget_item_3, R.id.focus_flow_widget_item_3_check, Pair(R.id.focus_flow_widget_item_3_title, R.id.focus_flow_widget_item_3_badge)),
      Triple(R.id.focus_flow_widget_item_4, R.id.focus_flow_widget_item_4_check, Pair(R.id.focus_flow_widget_item_4_title, R.id.focus_flow_widget_item_4_badge)),
    )
    val items = state.optJSONArray("widgetItems") ?: JSONArray()
    rows.forEachIndexed { index, row ->
      val item = items.optJSONObject(index)
      if (item == null) { views.setViewVisibility(row.first, View.GONE); return@forEachIndexed }
      val title = item.optString("title")
      val kind = item.optString("kind")
      val required = item.optBoolean("required", false)
      val timedLocked = item.optBoolean("timedLocked", false)
      views.setViewVisibility(row.first, View.VISIBLE)
      views.setTextViewText(row.third.first, title)
      views.setTextViewText(row.third.second, if (required) if (english) "MUST" else "必須" else if (kind == "habit") if (english) "HABIT" else "習慣" else if (english) "TODO" else "Todo")
      views.setTextViewText(row.second, if (timedLocked) "…" else "✓")
      if (!timedLocked) views.setOnClickPendingIntent(row.second, completeIntent(context, widgetId, item.optString("id"), kind))
      views.setOnClickPendingIntent(row.first, launchIntent(context, widgetId))
    }
    views.setViewVisibility(R.id.focus_flow_widget_empty, if (items.length() == 0) View.VISIBLE else View.GONE)
    views.setTextViewText(R.id.focus_flow_widget_empty, if (english) "No open tasks or habits today" else "今日の未完了Todo・習慣はありません")
  }

  private fun bindUndo(context: Context, id: Int, views: RemoteViews, english: Boolean) {
    val undo = undoState(context)
    if (undo == null) { views.setViewVisibility(R.id.focus_flow_widget_undo, View.GONE); return }
    views.setViewVisibility(R.id.focus_flow_widget_undo, View.VISIBLE)
    views.setTextViewText(R.id.focus_flow_widget_undo, if (english) "Undo" else "取り消す")
    views.setOnClickPendingIntent(R.id.focus_flow_widget_undo, undoIntent(context, id))
  }

  private fun complete(context: Context, targetId: String, kind: String): Boolean {
    if (targetId.isBlank() || (kind != "todo" && kind != "habit")) return false
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val current = state(context)
    val items = current.optJSONArray("widgetItems") ?: return false
    var target: JSONObject? = null
    for (index in 0 until items.length()) { val item = items.optJSONObject(index); if (item?.optString("id") == targetId && item.optString("kind") == kind) target = item }
    val item = target ?: return false
    if (item.optBoolean("timedLocked", false)) return false
    val queued = try { JSONArray(preferences.getString(FocusGateModule.WIDGET_COMPLETIONS, "[]") ?: "[]") } catch (_: Exception) { JSONArray() }
    for (index in 0 until queued.length()) { val queuedItem = queued.optJSONObject(index); if (queuedItem?.optString("id") == targetId && queuedItem.optString("kind") == kind) return false }
    val undo = JSONObject().put("expiresAt", System.currentTimeMillis() + UNDO_WINDOW_MS).put("id", targetId).put("kind", kind).put("state", JSONObject(current.toString()))
    queued.put(JSONObject().put("id", targetId).put("kind", kind))
    val remainingItems = JSONArray()
    for (index in 0 until items.length()) { val candidate = items.optJSONObject(index) ?: continue; if (candidate.optString("id") != targetId || candidate.optString("kind") != kind) remainingItems.put(candidate) }
    current.put("widgetItems", remainingItems)
    if (item.optBoolean("required", false)) updateRequiredState(current, targetId, kind)
    preferences.edit().putString(FocusGateModule.GATE_STATE, current.toString()).putString(FocusGateModule.WIDGET_COMPLETIONS, queued.toString()).putString(FocusGateModule.WIDGET_UNDO, undo.toString()).putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply()
    return true
  }

  private fun updateRequiredState(state: JSONObject, targetId: String, kind: String) {
    state.put("pendingCount", (state.optInt("pendingCount") - 1).coerceAtLeast(0))
    val queueKey = if (kind == "todo") "todoQueue" else "habitQueue"
    val queue = state.optJSONArray(queueKey) ?: JSONArray()
    val remainingQueue = JSONArray()
    for (index in 0 until queue.length()) { val entry = queue.optJSONObject(index) ?: continue; if (entry.optString("id") != targetId) remainingQueue.put(entry) }
    state.put(queueKey, remainingQueue)
    if (kind == "todo") { state.put("pendingTodos", (state.optInt("pendingTodos") - 1).coerceAtLeast(0)); state.put("completedTodoTotal", state.optInt("completedTodoTotal") + 1) } else { state.put("pendingHabits", (state.optInt("pendingHabits") - 1).coerceAtLeast(0)); state.put("completedHabitTotal", state.optInt("completedHabitTotal") + 1) }
    val rules = state.optJSONArray("rules") ?: JSONArray()
    for (index in 0 until rules.length()) { val rule = rules.optJSONObject(index) ?: continue; val ids = rule.optJSONArray(if (kind == "todo") "pendingTodoIds" else "pendingHabitIds") ?: continue; var contains = false; val remaining = JSONArray(); for (idIndex in 0 until ids.length()) { val value = ids.optString(idIndex); if (value == targetId) contains = true else remaining.put(value) }; if (!contains) continue; if (kind == "todo") { rule.put("pendingTodoIds", remaining); rule.put("pendingTodos", (rule.optInt("pendingTodos") - 1).coerceAtLeast(0)) } else { rule.put("pendingHabitIds", remaining); rule.put("pendingHabits", (rule.optInt("pendingHabits") - 1).coerceAtLeast(0)) }; rule.put("pendingCount", (rule.optInt("pendingCount") - 1).coerceAtLeast(0)) }
  }

  private fun undo(context: Context): Boolean {
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val undo = undoState(context) ?: return false
    val targetId = undo.optString("id"); val kind = undo.optString("kind"); val restored = undo.optJSONObject("state") ?: return false
    val queued = try { JSONArray(preferences.getString(FocusGateModule.WIDGET_COMPLETIONS, "[]") ?: "[]") } catch (_: Exception) { JSONArray() }
    val remaining = JSONArray(); for (index in 0 until queued.length()) { val item = queued.optJSONObject(index) ?: continue; if (item.optString("id") != targetId || item.optString("kind") != kind) remaining.put(item) }
    preferences.edit().putString(FocusGateModule.GATE_STATE, restored.toString()).putString(FocusGateModule.WIDGET_COMPLETIONS, remaining.toString()).remove(FocusGateModule.WIDGET_UNDO).putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply()
    return true
  }

  private fun undoState(context: Context): JSONObject? { val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE); val undo = try { JSONObject(preferences.getString(FocusGateModule.WIDGET_UNDO, "") ?: "") } catch (_: Exception) { return null }; if (undo.optLong("expiresAt") <= System.currentTimeMillis()) { preferences.edit().remove(FocusGateModule.WIDGET_UNDO).apply(); return null }; return undo }
  private fun launchIntent(context: Context, id: Int): PendingIntent { val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply { addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP) }; return PendingIntent.getActivity(context, id, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE) }
  private fun completeIntent(context: Context, id: Int, targetId: String, kind: String): PendingIntent = PendingIntent.getBroadcast(context, (id.toString() + targetId + kind).hashCode(), Intent(context, javaClass).apply { action = ACTION_COMPLETE; putExtra(EXTRA_TARGET_ID, targetId); putExtra(EXTRA_KIND, kind) }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun undoIntent(context: Context, id: Int): PendingIntent = PendingIntent.getBroadcast(context, (id.toString() + "undo").hashCode(), Intent(context, javaClass).apply { action = ACTION_UNDO }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun autoAccent(background: String): String = when (background) { "ocean" -> "sky"; "violet" -> "violet"; "amber" -> "gold"; "blush" -> "coral"; "ink" -> "ink"; else -> "mint" }
  private fun backgroundResource(background: String): Int = when (background) { "forest" -> R.drawable.focus_flow_widget_background_forest; "ocean" -> R.drawable.focus_flow_widget_background_ocean; "violet" -> R.drawable.focus_flow_widget_background_violet; "amber" -> R.drawable.focus_flow_widget_background_amber; "blush" -> R.drawable.focus_flow_widget_background_blush; "ink" -> R.drawable.focus_flow_widget_background_ink; else -> R.drawable.focus_flow_widget_background }
  private fun accentResource(accent: String): Int = when (accent) { "sky" -> R.drawable.focus_flow_widget_accent_sky; "violet" -> R.drawable.focus_flow_widget_accent_violet; "coral" -> R.drawable.focus_flow_widget_accent_coral; "gold" -> R.drawable.focus_flow_widget_accent_gold; "ink" -> R.drawable.focus_flow_widget_accent_ink; else -> R.drawable.focus_flow_widget_accent_mint }

  companion object {
    const val ACTION_COMPLETE = "focusflow.widget.COMPLETE"
    const val ACTION_UNDO = "focusflow.widget.UNDO"
    const val EXTRA_TARGET_ID = "targetId"
    const val EXTRA_KIND = "kind"
    const val UNDO_WINDOW_MS = 15_000L
    fun refreshAll(context: Context) { val manager = AppWidgetManager.getInstance(context); val provider = FocusFlowWidgetProvider(); manager.getAppWidgetIds(ComponentName(context, FocusFlowWidgetProvider::class.java)).forEach { id -> provider.updateWidget(context, manager, id) } }
  }
}
