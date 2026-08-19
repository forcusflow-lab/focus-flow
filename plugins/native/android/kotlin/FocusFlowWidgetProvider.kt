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

abstract class FocusFlowBaseWidgetProvider : AppWidgetProvider() {
  abstract fun layoutResource(): Int
  abstract fun widgetKey(): String
  abstract fun bind(views: RemoteViews, state: JSONObject)
  open fun bindAction(context: Context, id: Int, views: RemoteViews, state: JSONObject) = Unit
  open fun adaptForSize(context: Context, id: Int, views: RemoteViews, state: JSONObject) = Unit

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    ids.forEach { updateWidget(context, manager, it) }
  }

  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: android.os.Bundle) {
    updateWidget(context, manager, id)
  }

  override fun onReceive(context: Context, intent: Intent) {
    val updated = when (intent.action) {
      ACTION_COMPLETE -> complete(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty())
      ACTION_UNDO -> undo(context)
      else -> null
    }
    if (updated != null) {
      if (updated) FocusFlowWidgetProvider.refreshAll(context)
      return
    }
    super.onReceive(context, intent)
  }

  fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
    val current = state(context)
    val views = RemoteViews(context.packageName, layoutResource())
    bind(views, current)
    bindAction(context, id, views, current)
    applyTheme(context, views, current)
    applyTextScale(views, current)
    adaptForSize(context, id, views, current)
    views.setOnClickPendingIntent(R.id.focus_flow_widget_root, launchIntent(context, id))
    manager.updateAppWidget(id, views)
  }

  protected fun state(context: Context): JSONObject {
    val saved = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null)
    return try { JSONObject(saved ?: "{}") } catch (_: Exception) { JSONObject() }
  }

  protected fun launchIntent(context: Context, id: Int): PendingIntent {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply { addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP) }
    return PendingIntent.getActivity(context, id, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  protected fun en(state: JSONObject) = state.optString("language", "ja") == "en"
  protected fun active(state: JSONObject) = state.optBoolean("active", false)
  protected fun isExpanded(context: Context, id: Int): Boolean = AppWidgetManager.getInstance(context).getAppWidgetOptions(id).getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0) >= 220

  private fun applyTheme(context: Context, views: RemoteViews, state: JSONObject) {
    val selection = state.optJSONObject("widgetThemes")?.optJSONObject(widgetKey())
    val background = selection?.optString("background", "default") ?: "default"
    val requestedAccent = selection?.optString("accent", "auto") ?: "auto"
    val accent = if (requestedAccent == "auto") autoAccent(background) else requestedAccent
    val lightBackground = background == "amber" || (background == "default" && widgetKey() == "next")
    val primary = Color.parseColor(if (lightBackground) "#3F310B" else "#FFFFFF")
    val title = Color.parseColor(if (lightBackground) "#775300" else "#DDF1EB")
    val detail = Color.parseColor(if (lightBackground) "#65541F" else "#E8F6F1")
    views.setInt(R.id.focus_flow_widget_root, "setBackgroundResource", backgroundResource(background))
    if (widgetKey() == "overview") {
      views.setInt(R.id.focus_flow_widget_count, "setBackgroundResource", countResource(accent))
      views.setTextColor(R.id.focus_flow_widget_count, primary)
      views.setTextColor(R.id.focus_flow_widget_status, primary)
    } else {
      views.setTextColor(R.id.focus_flow_widget_title, title)
      views.setTextColor(R.id.focus_flow_widget_main, primary)
      views.setTextColor(R.id.focus_flow_widget_detail, detail)
      if (widgetKey() == "next" || widgetKey() == "habit") views.setInt(R.id.focus_flow_widget_action, "setBackgroundResource", accentResource(accent))
    }
  }

  private fun applyTextScale(views: RemoteViews, state: JSONObject) {
    val size = state.optJSONObject("widgetTextSizes")?.optString(widgetKey(), "standard") ?: "standard"
    val scale = when (size) { "compact" -> 0.90f; "large" -> 1.16f; else -> 1f }
    if (widgetKey() == "overview") {
      views.setTextViewTextSize(R.id.focus_flow_widget_count, TypedValue.COMPLEX_UNIT_SP, 23f * scale)
      views.setTextViewTextSize(R.id.focus_flow_widget_status, TypedValue.COMPLEX_UNIT_SP, 12f * scale)
    } else {
      views.setTextViewTextSize(R.id.focus_flow_widget_title, TypedValue.COMPLEX_UNIT_SP, 11f * scale)
      views.setTextViewTextSize(R.id.focus_flow_widget_main, TypedValue.COMPLEX_UNIT_SP, 16f * scale)
      views.setTextViewTextSize(R.id.focus_flow_widget_detail, TypedValue.COMPLEX_UNIT_SP, 11f * scale)
      if (widgetKey() == "next" || widgetKey() == "habit") views.setTextViewTextSize(R.id.focus_flow_widget_action, TypedValue.COMPLEX_UNIT_SP, 12f * scale)
    }
  }

  private fun autoAccent(background: String): String = when (background) { "ocean" -> "sky"; "violet" -> "violet"; "amber" -> "gold"; "blush" -> "coral"; "ink" -> "ink"; else -> when (widgetKey()) { "progress" -> "sky"; "next" -> "gold"; "habit" -> "violet"; else -> "mint" } }
  private fun backgroundResource(background: String): Int = when (background) { "forest" -> R.drawable.focus_flow_widget_background_forest; "ocean" -> R.drawable.focus_flow_widget_background_ocean; "violet" -> R.drawable.focus_flow_widget_background_violet; "amber" -> R.drawable.focus_flow_widget_background_amber; "blush" -> R.drawable.focus_flow_widget_background_blush; "ink" -> R.drawable.focus_flow_widget_background_ink; else -> when (widgetKey()) { "overview" -> R.drawable.focus_flow_widget_background; "progress" -> R.drawable.focus_flow_widget_background_progress; "next" -> R.drawable.focus_flow_widget_background_next; "habit" -> R.drawable.focus_flow_widget_background_habit; else -> R.drawable.focus_flow_widget_background_routine } }
  private fun accentResource(accent: String): Int = when (accent) { "sky" -> R.drawable.focus_flow_widget_accent_sky; "violet" -> R.drawable.focus_flow_widget_accent_violet; "coral" -> R.drawable.focus_flow_widget_accent_coral; "gold" -> R.drawable.focus_flow_widget_accent_gold; "ink" -> R.drawable.focus_flow_widget_accent_ink; else -> R.drawable.focus_flow_widget_accent_mint }
  private fun countResource(accent: String): Int = when (accent) { "sky" -> R.drawable.focus_flow_widget_count_sky; "violet" -> R.drawable.focus_flow_widget_count_violet; "coral" -> R.drawable.focus_flow_widget_count_coral; "gold" -> R.drawable.focus_flow_widget_count_gold; "ink" -> R.drawable.focus_flow_widget_count_ink; else -> R.drawable.focus_flow_widget_count_mint }

  protected fun completeIntent(context: Context, id: Int, targetId: String, kind: String): PendingIntent {
    return PendingIntent.getBroadcast(context, (id.toString() + targetId + kind).hashCode(), Intent(context, javaClass).apply {
      action = ACTION_COMPLETE
      putExtra(EXTRA_TARGET_ID, targetId)
      putExtra(EXTRA_KIND, kind)
    }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  protected fun undoIntent(context: Context, id: Int): PendingIntent {
    return PendingIntent.getBroadcast(context, (id.toString() + "undo").hashCode(), Intent(context, javaClass).apply {
      action = ACTION_UNDO
    }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  protected fun bindUndo(context: Context, id: Int, views: RemoteViews, english: Boolean): Boolean {
    if (!undoAvailable(context)) return false
    views.setViewVisibility(R.id.focus_flow_widget_action, View.VISIBLE)
    views.setTextViewText(R.id.focus_flow_widget_action, if (english) "Undo" else "取り消す")
    views.setOnClickPendingIntent(R.id.focus_flow_widget_action, undoIntent(context, id))
    return true
  }

  private fun undoAvailable(context: Context): Boolean {
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val undo = try { JSONObject(preferences.getString(FocusGateModule.WIDGET_UNDO, "") ?: "") } catch (_: Exception) { null }
    if (undo == null || undo.optLong("expiresAt") <= System.currentTimeMillis()) {
      preferences.edit().remove(FocusGateModule.WIDGET_UNDO).apply()
      return false
    }
    return true
  }

  private fun complete(context: Context, targetId: String, kind: String): Boolean {
    if (targetId.isBlank() || (kind != "todo" && kind != "habit")) return false
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val state = state(context)
    val lockedIds = state.optJSONArray(if (kind == "todo") "timedLockedTodoIds" else "timedLockedHabitIds")
    if (lockedIds != null) for (index in 0 until lockedIds.length()) if (lockedIds.optString(index) == targetId) return false
    val expectedId = if (kind == "todo") state.optString("nextRequiredId") else state.optString("nextHabitId")
    if (targetId != expectedId) return false
    val queued = try { JSONArray(preferences.getString(FocusGateModule.WIDGET_COMPLETIONS, "[]") ?: "[]") } catch (_: Exception) { JSONArray() }
    for (index in 0 until queued.length()) {
      val item = queued.optJSONObject(index)
      if (item?.optString("id") == targetId && item.optString("kind") == kind) return false
    }
    val undo = JSONObject().put("expiresAt", System.currentTimeMillis() + UNDO_WINDOW_MS).put("id", targetId).put("kind", kind).put("state", JSONObject(state.toString()))
    queued.put(JSONObject().put("id", targetId).put("kind", kind))
    state.put("pendingCount", (state.optInt("pendingCount") - 1).coerceAtLeast(0))
    val queueKey = if (kind == "todo") "todoQueue" else "habitQueue"
    val queue = state.optJSONArray(queueKey) ?: JSONArray()
    val remainingQueue = JSONArray()
    for (index in 0 until queue.length()) {
      val item = queue.optJSONObject(index) ?: continue
      if (item.optString("id") != targetId) remainingQueue.put(item)
    }
    state.put(queueKey, remainingQueue)
    val next = remainingQueue.optJSONObject(0)
    if (kind == "todo") {
      state.put("pendingTodos", (state.optInt("pendingTodos") - 1).coerceAtLeast(0))
      state.put("completedTodoTotal", state.optInt("completedTodoTotal") + 1)
      state.put("nextTodoId", next?.optString("id") ?: "")
      state.put("nextTodoTitle", next?.optString("title") ?: "")
    } else {
      state.put("pendingHabits", (state.optInt("pendingHabits") - 1).coerceAtLeast(0))
      state.put("completedHabitTotal", state.optInt("completedHabitTotal") + 1)
      state.put("nextHabitId", next?.optString("id") ?: "")
      state.put("nextHabitTitle", next?.optString("title") ?: "")
    }
    updateNextRequired(state)
    updateRules(state, targetId, kind, removed = true)
    preferences.edit()
      .putString(FocusGateModule.GATE_STATE, state.toString())
      .putString(FocusGateModule.WIDGET_COMPLETIONS, queued.toString())
      .putString(FocusGateModule.WIDGET_UNDO, undo.toString())
      .putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis())
      .apply()
    return true
  }

  private fun undo(context: Context): Boolean {
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val undo = try { JSONObject(preferences.getString(FocusGateModule.WIDGET_UNDO, "") ?: "") } catch (_: Exception) { return false }
    if (undo.optLong("expiresAt") <= System.currentTimeMillis()) {
      preferences.edit().remove(FocusGateModule.WIDGET_UNDO).apply()
      return false
    }
    val targetId = undo.optString("id")
    val kind = undo.optString("kind")
    val restored = undo.optJSONObject("state") ?: return false
    val queued = try { JSONArray(preferences.getString(FocusGateModule.WIDGET_COMPLETIONS, "[]") ?: "[]") } catch (_: Exception) { JSONArray() }
    val remaining = JSONArray()
    for (index in 0 until queued.length()) {
      val item = queued.optJSONObject(index) ?: continue
      if (item.optString("id") != targetId || item.optString("kind") != kind) remaining.put(item)
    }
    preferences.edit()
      .putString(FocusGateModule.GATE_STATE, restored.toString())
      .putString(FocusGateModule.WIDGET_COMPLETIONS, remaining.toString())
      .remove(FocusGateModule.WIDGET_UNDO)
      .putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis())
      .apply()
    return true
  }

  private fun updateNextRequired(state: JSONObject) {
    val nextTodoId = state.optString("nextTodoId")
    val nextHabitId = state.optString("nextHabitId")
    if (nextTodoId.isNotBlank()) {
      state.put("nextRequiredId", nextTodoId)
      state.put("nextRequiredTitle", state.optString("nextTodoTitle"))
      state.put("nextRequiredKind", "todo")
    } else if (nextHabitId.isNotBlank()) {
      state.put("nextRequiredId", nextHabitId)
      state.put("nextRequiredTitle", state.optString("nextHabitTitle"))
      state.put("nextRequiredKind", "habit")
    } else {
      state.put("nextRequiredId", "")
      state.put("nextRequiredTitle", "")
      state.put("nextRequiredKind", "")
    }
  }

  private fun updateRules(state: JSONObject, targetId: String, kind: String, removed: Boolean) {
    val rules = state.optJSONArray("rules") ?: JSONArray()
    for (index in 0 until rules.length()) {
      val rule = rules.optJSONObject(index) ?: continue
      val ids = if (kind == "todo") rule.optJSONArray("pendingTodoIds") else rule.optJSONArray("pendingHabitIds")
      var found = false
      if (ids != null) for (idIndex in 0 until ids.length()) if (ids.optString(idIndex) == targetId) found = true
      if (!found) continue
      val remaining = JSONArray()
      if (ids != null) for (idIndex in 0 until ids.length()) {
        val value = ids.optString(idIndex)
        if (value != targetId) remaining.put(value)
      }
      if (kind == "todo") {
        rule.put("pendingTodoIds", remaining)
        rule.put("pendingTodos", (rule.optInt("pendingTodos") - if (removed) 1 else -1).coerceAtLeast(0))
      } else {
        rule.put("pendingHabitIds", remaining)
        rule.put("pendingHabits", (rule.optInt("pendingHabits") - if (removed) 1 else -1).coerceAtLeast(0))
      }
      rule.put("pendingCount", (rule.optInt("pendingCount") - if (removed) 1 else -1).coerceAtLeast(0))
    }
  }

  companion object {
    const val ACTION_COMPLETE = "focusflow.widget.COMPLETE"
    const val ACTION_UNDO = "focusflow.widget.UNDO"
    const val EXTRA_TARGET_ID = "targetId"
    const val EXTRA_KIND = "kind"
    const val UNDO_WINDOW_MS = 15_000L
  }
}

class FocusFlowWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget
  override fun widgetKey() = "overview"
  override fun bind(views: RemoteViews, state: JSONObject) {
    val pending = state.optInt("pendingCount", 0)
    val english = en(state)
    views.setTextViewText(R.id.focus_flow_widget_count, if (pending == 0) if (english) "Done" else "完了" else if (english) "$pending left" else "${pending}件")
    views.setTextViewText(R.id.focus_flow_widget_status, if (!active(state)) if (english) "App limits are off" else "アプリ制限はオフ" else if (pending == 0) if (english) "Today’s must-dos are complete" else "今日の必須項目を完了しました" else if (english) "Finish must-dos to unlock apps" else "必須項目を終えてアプリを解除")
  }
  companion object {
    private val providers = listOf(FocusFlowWidgetProvider::class.java, FocusFlowProgressWidgetProvider::class.java, FocusFlowNextWidgetProvider::class.java, FocusFlowHabitWidgetProvider::class.java, FocusFlowRoutineWidgetProvider::class.java)
    fun refreshAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      providers.forEach { clazz ->
        val provider = clazz.getDeclaredConstructor().newInstance()
        manager.getAppWidgetIds(ComponentName(context, clazz)).forEach { id -> provider.updateWidget(context, manager, id) }
      }
    }
  }
}

class FocusFlowProgressWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget_progress
  override fun widgetKey() = "progress"
  override fun bind(views: RemoteViews, state: JSONObject) {
    val english = en(state)
    val total = state.optInt("requiredTodoTotal", 0) + state.optInt("requiredHabitTotal", 0)
    val done = state.optInt("completedTodoTotal", 0) + state.optInt("completedHabitTotal", 0)
    views.setTextViewText(R.id.focus_flow_widget_title, if (english) "UNLOCK PROGRESS" else "解除の進捗")
    views.setTextViewText(R.id.focus_flow_widget_main, if (total == 0) if (english) "Add a must-do" else "必須項目を追加" else "$done / $total")
    views.setTextViewText(R.id.focus_flow_widget_detail, if (english) "Tasks ${state.optInt("completedTodoTotal", 0)}/${state.optInt("requiredTodoTotal", 0)} · Habits ${state.optInt("completedHabitTotal", 0)}/${state.optInt("requiredHabitTotal", 0)}" else "Todo ${state.optInt("completedTodoTotal", 0)}/${state.optInt("requiredTodoTotal", 0)} ・ 習慣 ${state.optInt("completedHabitTotal", 0)}/${state.optInt("requiredHabitTotal", 0)}")
  }
  override fun adaptForSize(context: Context, id: Int, views: RemoteViews, state: JSONObject) { views.setViewVisibility(R.id.focus_flow_widget_detail, if (isExpanded(context, id)) View.VISIBLE else View.GONE) }
}

class FocusFlowNextWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget_next
  override fun widgetKey() = "next"
  override fun bind(views: RemoteViews, state: JSONObject) {
    val english = en(state)
    val title = state.optString("nextRequiredTitle", "")
    val kind = state.optString("nextRequiredKind", "")
    views.setTextViewText(R.id.focus_flow_widget_title, if (english) "NEXT MUST-DO" else "次の必須項目")
    views.setTextViewText(R.id.focus_flow_widget_main, if (title.isBlank()) if (english) "You’re all set" else "すべて完了です" else title)
    views.setTextViewText(R.id.focus_flow_widget_detail, if (title.isBlank()) if (english) "Open Focus Flow to plan tomorrow" else "Focus Flowで明日の予定を整えましょう" else if (kind == "habit") if (english) "Record today’s habit" else "今日の習慣を記録" else if (english) "Complete this task to unlock apps" else "完了するとアプリを解除できます")
  }
  override fun bindAction(context: Context, id: Int, views: RemoteViews, state: JSONObject) {
    val english = en(state)
    if (bindUndo(context, id, views, english)) return
    val targetId = state.optString("nextRequiredId")
    val kind = state.optString("nextRequiredKind")
    views.setViewVisibility(R.id.focus_flow_widget_action, if (targetId.isBlank()) View.GONE else View.VISIBLE)
    views.setTextViewText(R.id.focus_flow_widget_action, if (english) "Mark complete" else "完了にする")
    if (targetId.isNotBlank() && (kind == "todo" || kind == "habit")) views.setOnClickPendingIntent(R.id.focus_flow_widget_action, completeIntent(context, id, targetId, kind))
  }
  override fun adaptForSize(context: Context, id: Int, views: RemoteViews, state: JSONObject) { views.setViewVisibility(R.id.focus_flow_widget_detail, if (isExpanded(context, id)) View.VISIBLE else View.GONE) }
}

class FocusFlowHabitWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget_habit
  override fun widgetKey() = "habit"
  override fun bind(views: RemoteViews, state: JSONObject) {
    val english = en(state)
    val total = state.optInt("requiredHabitTotal", 0)
    val done = state.optInt("completedHabitTotal", 0)
    views.setTextViewText(R.id.focus_flow_widget_title, if (english) "HABIT PULSE" else "習慣の記録")
    views.setTextViewText(R.id.focus_flow_widget_main, if (total == 0) if (english) "No must-do habits" else "必須習慣はありません" else if (english) "$done of $total complete" else "$done / $total を完了")
    views.setTextViewText(R.id.focus_flow_widget_detail, if (total == 0) if (english) "Add one when a routine matters" else "習慣を必須にするとここに表示" else if (done == total) if (english) "Today’s required habits are done" else "今日の必須習慣は完了しました" else if (english) "Tap to record your progress" else "タップして進捗を記録")
  }
  override fun bindAction(context: Context, id: Int, views: RemoteViews, state: JSONObject) {
    val english = en(state)
    if (bindUndo(context, id, views, english)) return
    val targetId = state.optString("nextHabitId")
    views.setViewVisibility(R.id.focus_flow_widget_action, if (targetId.isBlank()) View.GONE else View.VISIBLE)
    views.setTextViewText(R.id.focus_flow_widget_action, if (english) "Complete habit" else "習慣を完了")
    if (targetId.isNotBlank()) views.setOnClickPendingIntent(R.id.focus_flow_widget_action, completeIntent(context, id, targetId, "habit"))
  }
  override fun adaptForSize(context: Context, id: Int, views: RemoteViews, state: JSONObject) { views.setViewVisibility(R.id.focus_flow_widget_detail, if (isExpanded(context, id)) View.VISIBLE else View.GONE) }
}

class FocusFlowRoutineWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget_routine
  override fun widgetKey() = "routine"
  override fun bind(views: RemoteViews, state: JSONObject) {
    val english = en(state)
    val label = state.optString("routineLabel", "")
    val routineOn = state.optBoolean("routineActive", false)
    views.setTextViewText(R.id.focus_flow_widget_title, if (english) "ROUTINE STATUS" else "日課の状態")
    views.setTextViewText(R.id.focus_flow_widget_main, if (!active(state)) if (english) "App limits are off" else "アプリ制限はオフ" else if (routineOn) if (label.isBlank()) if (english) "Routine active" else "日課を適用中" else label else if (english) "No routine active" else "日課の時間外です")
    views.setTextViewText(R.id.focus_flow_widget_detail, if (!active(state)) if (english) "Turn on App limits in Settings" else "設定からアプリ制限をオンにできます" else if (routineOn) if (english) "Tap to review today’s unlock progress" else "タップして今日の解除進捗を確認" else if (english) "Your next routine will resume automatically" else "次の日課の時間になると自動で再開")
  }
  override fun adaptForSize(context: Context, id: Int, views: RemoteViews, state: JSONObject) { views.setViewVisibility(R.id.focus_flow_widget_detail, if (isExpanded(context, id)) View.VISIBLE else View.GONE) }
}
