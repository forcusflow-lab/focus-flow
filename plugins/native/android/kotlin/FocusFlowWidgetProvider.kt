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
      ACTION_OPEN_ITEM -> { openItem(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty()); false }
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
    bindUndo(context, id, views, english)
    val serviceIntent = Intent(context, FocusFlowWidgetItemsService::class.java).apply {
      putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id)
      data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
    }
    views.setRemoteAdapter(R.id.focus_flow_widget_list, serviceIntent)
    views.setEmptyView(R.id.focus_flow_widget_list, R.id.focus_flow_widget_empty)
    val template = PendingIntent.getBroadcast(context, id, Intent(context, FocusFlowWidgetProvider::class.java).apply { action = ACTION_OPEN_ITEM; putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id) }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    views.setPendingIntentTemplate(R.id.focus_flow_widget_list, template)
    views.setOnClickPendingIntent(R.id.focus_flow_widget_root, todayIntent(context, id))
    manager.updateAppWidget(id, views)
  }

  private fun state(context: Context): JSONObject {
    val saved = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null)
    return try { JSONObject(saved ?: "{}") } catch (_: Exception) { JSONObject() }
  }

  private fun bindTheme(views: RemoteViews, state: JSONObject) {
    val background = state.optJSONObject("widgetThemes")?.optJSONObject("unified")?.optString("background", "default") ?: "default"
    views.setInt(R.id.focus_flow_widget_root, "setBackgroundColor", widgetBackgroundColor(background, state.optInt("widgetOpacity", 86).coerceIn(0, 100)))
  }

  private fun bindHeader(views: RemoteViews, state: JSONObject, english: Boolean) {
    val background = state.optJSONObject("widgetThemes")?.optJSONObject("unified")?.optString("background", "default") ?: "default"
    val light = background == "amber" || background == "blush"
    val title = Color.parseColor(if (light) "#2F2614" else "#FFFFFF")
    val detail = Color.parseColor(if (light) "#59471F" else "#E7F5F0")
    val pending = state.optInt("pendingCount", 0)
    val active = state.optBoolean("active", false)
    views.setTextColor(R.id.focus_flow_widget_title, title)
    views.setTextColor(R.id.focus_flow_widget_status, detail)
    views.setTextColor(R.id.focus_flow_widget_empty, detail)
    views.setTextViewText(R.id.focus_flow_widget_title, if (english) "TODAY" else "今日の項目")
    views.setTextViewText(R.id.focus_flow_widget_status, if (!active) if (english) "App limits off" else "集中制限はオフ" else if (pending == 0) if (english) "Must-dos complete" else "必須項目を完了しました" else if (english) "$pending must-do${if (pending == 1) "" else "s"} remaining" else "必須項目 残り${pending}件")
  }

  private fun bindUndo(context: Context, id: Int, views: RemoteViews, english: Boolean) {
    val undo = undoState(context)
    if (undo == null) { views.setViewVisibility(R.id.focus_flow_widget_undo, View.GONE); return }
    views.setViewVisibility(R.id.focus_flow_widget_undo, View.VISIBLE)
    views.setTextViewText(R.id.focus_flow_widget_undo, if (english) "Undo" else "元に戻す")
    views.setOnClickPendingIntent(R.id.focus_flow_widget_undo, PendingIntent.getBroadcast(context, (id.toString() + "undo").hashCode(), Intent(context, javaClass).apply { action = ACTION_UNDO }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
  }

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
    val undo = JSONObject().put("expiresAt", System.currentTimeMillis() + UNDO_WINDOW_MS).put("id", targetId).put("kind", kind).put("state", JSONObject(current.toString()))
    actions.put(JSONObject().put("id", targetId).put("kind", kind).put("operation", "complete"))
    if (current.optString("widgetCompletedDisplay", "dim") == "dim") { item.put("completed", true); item.put("timedLocked", false); current.put("widgetItems", items) } else { val remaining = JSONArray(); for (index in 0 until items.length()) { val candidate = items.optJSONObject(index) ?: continue; if (candidate.optString("id") != targetId || candidate.optString("kind") != kind) remaining.put(candidate) }; current.put("widgetItems", remaining) }
    if (item.optBoolean("required", false)) updateRequiredState(current, targetId, kind)
    preferences.edit().putString(FocusGateModule.GATE_STATE, current.toString()).putString(FocusGateModule.WIDGET_ACTIONS, actions.toString()).putString(FocusGateModule.WIDGET_UNDO, undo.toString()).putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply()
    return true
  }

  private fun undo(context: Context): Boolean {
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val undo = undoState(context) ?: return false
    val targetId = undo.optString("id"); val kind = undo.optString("kind"); val restored = undo.optJSONObject("state") ?: return false
    val actions = widgetActions(preferences)
    actions.put(JSONObject().put("id", targetId).put("kind", kind).put("operation", "restore"))
    preferences.edit().putString(FocusGateModule.GATE_STATE, restored.toString()).putString(FocusGateModule.WIDGET_ACTIONS, actions.toString()).remove(FocusGateModule.WIDGET_UNDO).putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply()
    return true
  }

  private fun updateRequiredState(state: JSONObject, targetId: String, kind: String) {
    state.put("pendingCount", (state.optInt("pendingCount") - 1).coerceAtLeast(0))
    val queueKey = if (kind == "todo") "todoQueue" else "habitQueue"
    val queue = state.optJSONArray(queueKey) ?: JSONArray(); val remainingQueue = JSONArray()
    for (index in 0 until queue.length()) { val entry = queue.optJSONObject(index) ?: continue; if (entry.optString("id") != targetId) remainingQueue.put(entry) }
    state.put(queueKey, remainingQueue)
    if (kind == "todo") { state.put("pendingTodos", (state.optInt("pendingTodos") - 1).coerceAtLeast(0)); state.put("completedTodoTotal", state.optInt("completedTodoTotal") + 1) } else { state.put("pendingHabits", (state.optInt("pendingHabits") - 1).coerceAtLeast(0)); state.put("completedHabitTotal", state.optInt("completedHabitTotal") + 1) }
  }

  private fun openItem(context: Context, targetId: String, kind: String) { if (targetId.isBlank() || (kind != "todo" && kind != "habit")) return; context.startActivity(deepLink(context, if (kind == "habit") "habits" else "todos", targetId).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)) }
  private fun todayIntent(context: Context, id: Int): PendingIntent = PendingIntent.getActivity(context, id, deepLink(context, "today"), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun deepLink(context: Context, destination: String, targetId: String? = null): Intent { val uri = Uri.Builder().scheme("manusfocusflow").authority(destination).apply { if (targetId != null) appendQueryParameter("open", targetId) }.build(); return Intent(Intent.ACTION_VIEW, uri).setPackage(context.packageName) }
  private fun undoState(context: Context): JSONObject? { val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE); val undo = try { JSONObject(preferences.getString(FocusGateModule.WIDGET_UNDO, "") ?: "") } catch (_: Exception) { return null }; if (undo.optLong("expiresAt") <= System.currentTimeMillis()) { preferences.edit().remove(FocusGateModule.WIDGET_UNDO).apply(); return null }; return undo }
  private fun widgetActions(preferences: android.content.SharedPreferences): JSONArray = try { JSONArray(preferences.getString(FocusGateModule.WIDGET_ACTIONS, "[]") ?: "[]") } catch (_: Exception) { JSONArray() }

  companion object {
    const val ACTION_COMPLETE = "focusflow.widget.COMPLETE"
    const val ACTION_UNDO = "focusflow.widget.UNDO"
    const val ACTION_OPEN_ITEM = "focusflow.widget.OPEN_ITEM"
    const val EXTRA_TARGET_ID = "targetId"
    const val EXTRA_KIND = "kind"
    const val UNDO_WINDOW_MS = 15_000L
    fun refreshAll(context: Context) { val manager = AppWidgetManager.getInstance(context); val provider = FocusFlowWidgetProvider(); manager.getAppWidgetIds(ComponentName(context, FocusFlowWidgetProvider::class.java)).forEach { id -> provider.updateWidget(context, manager, id) }; manager.notifyAppWidgetViewDataChanged(manager.getAppWidgetIds(ComponentName(context, FocusFlowWidgetProvider::class.java)), R.id.focus_flow_widget_list) }
    fun widgetBackgroundColor(background: String, opacity: Int): Int { val base = when (background) { "forest" -> "#164C3F"; "ocean" -> "#1E5C7A"; "violet" -> "#5C4678"; "amber" -> "#F1D78B"; "blush" -> "#B86A73"; "ink" -> "#17202B"; else -> "#246B5A" }; return Color.parseColor(base).let { color -> Color.argb((opacity * 2.55f).toInt(), Color.red(color), Color.green(color), Color.blue(color)) } }
  }
}
