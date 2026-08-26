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
      ACTION_INCREMENT, ACTION_DECREMENT, ACTION_TIMER_START -> adjustHabitFromWidget(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty(), intent.action.orEmpty())
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
    val bucket = widgetBucket(manager, id)
    val views = RemoteViews(context.packageName, R.layout.focus_flow_widget_initial)
    bindTheme(views, state)
    bindHeader(views, state, english)
    bindStaticRows(context, views, state, id, english, bucket)
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

  private data class WidgetBucket(val maxRows: Int, val showControls: Boolean, val compactHeader: Boolean)

  private fun widgetBucket(manager: AppWidgetManager, id: Int): WidgetBucket {
    val options = manager.getAppWidgetOptions(id)
    val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 180))
    val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110))
    return when {
      width < 200 || height < 150 -> WidgetBucket(1, false, true)
      height < 250 -> WidgetBucket(2, true, false)
      else -> WidgetBucket(4, true, false)
    }
  }

  private fun bindTheme(views: RemoteViews, state: JSONObject) {
    val palette = state.optJSONObject("widgetPalette")
    val dark = palette?.optBoolean("isDark", false) ?: false
    views.setInt(R.id.focus_flow_widget_card, "setBackgroundResource", widgetCardDrawable(dark, state.optInt("widgetOpacity", 86).coerceIn(0, 100)))
    views.setInt(R.id.focus_flow_widget_header, "setBackgroundColor", paletteColor(palette, "primarySoft", if (dark) "#23483C" else "#E3F1EC"))
    // Use pre-rendered alpha backgrounds rather than setAlpha. RemoteViews
    // hosts render only a restricted hierarchy, and text must not fade with
    // the card surface.
    val divider = if (dark) Color.parseColor("#526B61") else Color.parseColor("#C8D9D1")
    listOf(R.id.focus_flow_widget_static_divider_one, R.id.focus_flow_widget_static_divider_two, R.id.focus_flow_widget_static_divider_three).forEach { dividerId -> views.setTextViewText(dividerId, ""); views.setInt(dividerId, "setBackgroundColor", divider) }
  }

  private fun paletteColor(palette: JSONObject?, key: String, fallback: String): Int = try { Color.parseColor(palette?.optString(key, fallback) ?: fallback) } catch (_: Exception) { Color.parseColor(fallback) }

  private fun widgetCardDrawable(dark: Boolean, opacity: Int): Int {
    val level = when {
      opacity < 13 -> 0
      opacity < 38 -> 25
      opacity < 63 -> 50
      opacity < 88 -> 75
      else -> 100
    }
    return if (dark) when (level) { 0 -> R.drawable.focus_flow_widget_card_dark_0; 25 -> R.drawable.focus_flow_widget_card_dark_25; 50 -> R.drawable.focus_flow_widget_card_dark_50; 75 -> R.drawable.focus_flow_widget_card_dark_75; else -> R.drawable.focus_flow_widget_card_dark_100 } else when (level) { 0 -> R.drawable.focus_flow_widget_card_light_0; 25 -> R.drawable.focus_flow_widget_card_light_25; 50 -> R.drawable.focus_flow_widget_card_light_50; 75 -> R.drawable.focus_flow_widget_card_light_75; else -> R.drawable.focus_flow_widget_card_light_100 }
  }

  private fun bindHeader(views: RemoteViews, state: JSONObject, english: Boolean) {
    val palette = state.optJSONObject("widgetPalette")
    val dark = palette?.optBoolean("isDark", false) ?: false
    val title = paletteColor(palette, "text", if (dark) "#F4FBF7" else "#13251F")
    val detail = paletteColor(palette, "muted", if (dark) "#B7CCC2" else "#4E655B")
    val pending = state.optInt("pendingCount", 0)
    val active = state.optBoolean("active", false)
    views.setTextColor(R.id.focus_flow_widget_title, title)
    views.setTextColor(R.id.focus_flow_widget_status, detail)
    views.setTextColor(R.id.focus_flow_widget_empty, detail)
    val scale = when (state.optString("widgetTextScale", "standard")) { "compact" -> 0.92f; "large" -> 1.14f; else -> 1f }
    views.setTextViewTextSize(R.id.focus_flow_widget_title, android.util.TypedValue.COMPLEX_UNIT_DIP, 12f * scale)
    views.setTextViewTextSize(R.id.focus_flow_widget_status, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
    views.setTextViewTextSize(R.id.focus_flow_widget_empty, android.util.TypedValue.COMPLEX_UNIT_DIP, 11f * scale)
    views.setTextViewText(R.id.focus_flow_widget_title, if (english) "TODAY" else "今日の項目")
    views.setTextViewText(R.id.focus_flow_widget_status, if (!active) if (english) "App limits off" else "集中制限はオフ" else if (pending == 0) if (english) "Must-dos complete" else "必須項目を完了しました" else if (english) "$pending must-do${if (pending == 1) "" else "s"} remaining" else "必須項目 残り${pending}件")
  }

  private data class StaticRowIds(val position: Int, val row: Int, val action: Int, val check: Int, val content: Int, val title: Int, val badge: Int, val meta: Int, val controls: Int, val decrement: Int, val progress: Int, val increment: Int, val timer: Int)

  private fun staticRowIds(index: Int): StaticRowIds = when (index) {
    0 -> StaticRowIds(0, R.id.focus_flow_widget_static_row_one, R.id.focus_flow_widget_static_row_one_action, R.id.focus_flow_widget_static_row_one_check, R.id.focus_flow_widget_static_row_one_content, R.id.focus_flow_widget_static_row_one_title, R.id.focus_flow_widget_static_row_one_badge, R.id.focus_flow_widget_static_row_one_meta, R.id.focus_flow_widget_static_row_one_controls, R.id.focus_flow_widget_static_row_one_decrement, R.id.focus_flow_widget_static_row_one_progress, R.id.focus_flow_widget_static_row_one_increment, R.id.focus_flow_widget_static_row_one_timer)
    1 -> StaticRowIds(1, R.id.focus_flow_widget_static_row_two, R.id.focus_flow_widget_static_row_two_action, R.id.focus_flow_widget_static_row_two_check, R.id.focus_flow_widget_static_row_two_content, R.id.focus_flow_widget_static_row_two_title, R.id.focus_flow_widget_static_row_two_badge, R.id.focus_flow_widget_static_row_two_meta, R.id.focus_flow_widget_static_row_two_controls, R.id.focus_flow_widget_static_row_two_decrement, R.id.focus_flow_widget_static_row_two_progress, R.id.focus_flow_widget_static_row_two_increment, R.id.focus_flow_widget_static_row_two_timer)
    2 -> StaticRowIds(2, R.id.focus_flow_widget_static_row_three, R.id.focus_flow_widget_static_row_three_action, R.id.focus_flow_widget_static_row_three_check, R.id.focus_flow_widget_static_row_three_content, R.id.focus_flow_widget_static_row_three_title, R.id.focus_flow_widget_static_row_three_badge, R.id.focus_flow_widget_static_row_three_meta, R.id.focus_flow_widget_static_row_three_controls, R.id.focus_flow_widget_static_row_three_decrement, R.id.focus_flow_widget_static_row_three_progress, R.id.focus_flow_widget_static_row_three_increment, R.id.focus_flow_widget_static_row_three_timer)
    else -> StaticRowIds(3, R.id.focus_flow_widget_static_row_four, R.id.focus_flow_widget_static_row_four_action, R.id.focus_flow_widget_static_row_four_check, R.id.focus_flow_widget_static_row_four_content, R.id.focus_flow_widget_static_row_four_title, R.id.focus_flow_widget_static_row_four_badge, R.id.focus_flow_widget_static_row_four_meta, R.id.focus_flow_widget_static_row_four_controls, R.id.focus_flow_widget_static_row_four_decrement, R.id.focus_flow_widget_static_row_four_progress, R.id.focus_flow_widget_static_row_four_increment, R.id.focus_flow_widget_static_row_four_timer)
  }

  private fun bindStaticRows(context: Context, views: RemoteViews, state: JSONObject, widgetId: Int, english: Boolean, bucket: WidgetBucket) {
    val all = state.optJSONArray("widgetItems") ?: JSONArray()
    val rows = uniqueStaticItems(all, bucket.maxRows)
    val palette = state.optJSONObject("widgetPalette")
    val titleColor = paletteColor(palette, "text", "#13251F")
    val mutedColor = paletteColor(palette, "muted", "#4E655B")
    val primary = paletteColor(palette, "primary", "#1B6B62")
    val primarySoft = paletteColor(palette, "primarySoft", "#E3F1EC")
    val elevated = paletteColor(palette, "elevated", "#EDF4F0")
    val onPrimary = paletteColor(palette, "background", "#F7F8F5")
    val scale = when (state.optString("widgetTextScale", "standard")) { "compact" -> 0.92f; "large" -> 1.14f; else -> 1f }
    views.setViewVisibility(R.id.focus_flow_widget_empty, if (rows.isEmpty()) View.VISIBLE else View.GONE)
    if (rows.isEmpty()) views.setTextViewText(R.id.focus_flow_widget_empty, if (english) "Open Focus Flow to add today’s items" else "今日の項目はありません")
    val dividers = listOf(R.id.focus_flow_widget_static_divider_one, R.id.focus_flow_widget_static_divider_two, R.id.focus_flow_widget_static_divider_three)
    for (index in 0..3) {
      val ids = staticRowIds(index)
      val item = rows.getOrNull(index)
      views.setViewVisibility(ids.row, if (item == null) View.GONE else View.VISIBLE)
      if (index < dividers.size) views.setViewVisibility(dividers[index], if (index < rows.size - 1) View.VISIBLE else View.GONE)
      if (item != null) bindStaticRow(context, views, ids, item, widgetId, english, titleColor, mutedColor, primary, primarySoft, elevated, onPrimary, scale, bucket.showControls) else clearStaticRow(views, ids)
    }
  }

  private fun uniqueStaticItems(all: JSONArray, limit: Int): List<JSONObject> {
    val seen = mutableSetOf<String>()
    val rows = mutableListOf<JSONObject>()
    for (index in 0 until all.length()) {
      val item = all.optJSONObject(index) ?: continue
      val itemId = item.optString("id").trim()
      val kind = item.optString("kind").trim()
      if (itemId.isBlank() || (kind != "todo" && kind != "habit")) continue
      if (!seen.add("$kind:$itemId")) continue
      rows.add(item)
      if (rows.size == limit) break
    }
    return rows
  }

  private fun clearStaticRow(views: RemoteViews, ids: StaticRowIds) {
    views.setTextViewText(ids.title, "")
    views.setTextViewText(ids.badge, "")
    views.setTextViewText(ids.meta, "")
    views.setViewVisibility(ids.badge, View.GONE)
    views.setViewVisibility(ids.meta, View.GONE)
    views.setViewVisibility(ids.controls, View.GONE)
    views.setViewVisibility(ids.timer, View.GONE)
    views.setInt(ids.check, "setBackgroundResource", R.drawable.focus_flow_widget_checkbox)
    views.setImageViewResource(ids.check, R.drawable.focus_flow_widget_check_empty)
  }

  private fun bindStaticRow(context: Context, views: RemoteViews, ids: StaticRowIds, item: JSONObject, widgetId: Int, english: Boolean, titleColor: Int, mutedColor: Int, primary: Int, primarySoft: Int, elevated: Int, onPrimary: Int, scale: Float, showControls: Boolean) {
    val completed = item.optBoolean("completed", false)
    val canToggle = item.optBoolean("canToggle", false)
    val timedLocked = item.optBoolean("timedLocked", false)
    val title = item.optString("title")
    val badge = compactBadge(item, english)
    views.setTextViewText(ids.title, if (completed) struck(title) else title)
    views.setTextColor(ids.title, if (completed) mutedColor else titleColor)
    views.setTextViewTextSize(ids.title, android.util.TypedValue.COMPLEX_UNIT_DIP, 13f * scale)
    views.setViewVisibility(ids.badge, if (badge.isBlank()) View.GONE else View.VISIBLE)
    views.setTextViewText(ids.badge, badge)
    views.setTextColor(ids.badge, primary)
    views.setInt(ids.badge, "setBackgroundColor", primarySoft)
    views.setTextViewTextSize(ids.badge, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
    val meta = item.optString("windowLabel", "")
    views.setViewVisibility(ids.meta, if (meta.isBlank()) View.GONE else View.VISIBLE)
    views.setTextViewText(ids.meta, meta)
    views.setTextColor(ids.meta, mutedColor)
    views.setTextViewTextSize(ids.meta, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
    if (completed) {
      views.setInt(ids.check, "setBackgroundResource", R.drawable.focus_flow_widget_checkbox_done)
      views.setImageViewResource(ids.check, R.drawable.focus_flow_widget_check_mark)
    } else {
      views.setInt(ids.check, "setBackgroundResource", R.drawable.focus_flow_widget_checkbox)
      views.setImageViewResource(ids.check, if (timedLocked) R.drawable.focus_flow_widget_check_locked else R.drawable.focus_flow_widget_check_empty)
    }
    val itemId = item.optString("id")
    val kind = item.optString("kind")
    views.setOnClickPendingIntent(ids.content, detailIntent(context, widgetId, ids.position, itemId, kind))
    val action = if (completed) ACTION_RESTORE else ACTION_COMPLETE
    views.setOnClickPendingIntent(ids.action, if (canToggle) actionIntent(context, widgetId, ids.position, action, itemId, kind) else todayIntent(context, widgetId + 20 + ids.position))
    val unit = item.optString("progressUnit", "check")
    val supportsControls = showControls && kind == "habit" && !completed && (unit == "count" || unit == "minutes")
    views.setViewVisibility(ids.controls, if (supportsControls) View.VISIBLE else View.GONE)
    views.setViewVisibility(ids.timer, if (supportsControls && unit == "minutes") View.VISIBLE else View.GONE)
    if (supportsControls && unit == "count") {
      listOf(ids.decrement, ids.progress, ids.increment).forEach { control -> views.setViewVisibility(control, View.VISIBLE) }
      val value = item.optInt("progressValue", 0)
      val target = item.optInt("targetValue", 1).coerceAtLeast(1)
      views.setTextViewText(ids.progress, "$value/$target")
      views.setTextColor(ids.progress, primary)
      listOf(ids.decrement, ids.increment).forEach { control -> views.setTextColor(control, primary); views.setInt(control, "setBackgroundColor", elevated) }
      views.setOnClickPendingIntent(ids.decrement, actionIntent(context, widgetId, ids.position, ACTION_DECREMENT, itemId, kind))
      views.setOnClickPendingIntent(ids.increment, actionIntent(context, widgetId, ids.position, ACTION_INCREMENT, itemId, kind))
    } else if (supportsControls) {
      listOf(ids.decrement, ids.progress, ids.increment).forEach { control -> views.setViewVisibility(control, View.GONE) }
      views.setTextViewText(ids.timer, if (item.optBoolean("timerRunning", false)) if (english) "Running" else "計測中" else if (english) "Start" else "開始")
      views.setTextColor(ids.timer, onPrimary)
      views.setInt(ids.timer, "setBackgroundColor", primary)
      views.setOnClickPendingIntent(ids.timer, actionIntent(context, widgetId, ids.position, ACTION_TIMER_START, itemId, kind))
    }
  }

  private fun compactBadge(item: JSONObject, english: Boolean): String {
    val required = item.optBoolean("required", false)
    val hasWindow = item.optString("windowLabel", "").isNotBlank()
    return when {
      required && hasWindow -> if (english) "MUST · TIME" else "必須 · 時間帯"
      required -> if (english) "MUST" else "必須"
      hasWindow -> if (english) "TIME" else "時間帯"
      else -> ""
    }
  }

  private fun struck(value: String): CharSequence = SpannableString(value).apply { setSpan(StrikethroughSpan(), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE); setSpan(StyleSpan(Typeface.BOLD), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) }

  private fun complete(context: Context, targetId: String, kind: String): Boolean {
    if (targetId.isBlank() || (kind != "todo" && kind != "habit")) return false
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val current = state(context)
    val items = current.optJSONArray("widgetItems") ?: return false
    val matches = matchingItems(items, targetId, kind)
    if (matches.size != 1) return false
    val item = matches.single()
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
    val matches = matchingItems(items, targetId, kind)
    if (matches.size != 1) return false
    val item = matches.single()
    if (!item.optBoolean("completed", false) || !item.optBoolean("canToggle", false)) return false
    item.put("completed", false)
    item.put("timedLocked", false)
    if (item.optBoolean("required", false)) restoreRequiredState(current, item, kind)
    val actions = widgetActions(preferences)
    actions.put(JSONObject().put("id", targetId).put("kind", kind).put("operation", "restore"))
    preferences.edit().putString(FocusGateModule.GATE_STATE, current.put("widgetItems", items).toString()).putString(FocusGateModule.WIDGET_ACTIONS, actions.toString()).putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply()
    return true
  }

  private fun adjustHabitFromWidget(context: Context, targetId: String, kind: String, action: String): Boolean {
    if (targetId.isBlank() || kind != "habit") return false
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    val current = state(context)
    val items = current.optJSONArray("widgetItems") ?: return false
    val matches = matchingItems(items, targetId, kind)
    if (matches.size != 1) return false
    val item = matches.single()
    if (item.optBoolean("completed", false)) return false
    val unit = item.optString("progressUnit", "check")
    val operation = when (action) { ACTION_INCREMENT -> "increment"; ACTION_DECREMENT -> "decrement"; ACTION_TIMER_START -> "timer_start"; else -> return false }
    if (operation == "timer_start") {
      if (unit != "minutes" || item.optBoolean("timerRunning", false)) return false
      item.put("timerRunning", true)
    } else {
      if (unit != "count") return false
      val target = item.optInt("targetValue", 1).coerceAtLeast(1)
      val delta = if (operation == "increment") 1 else -1
      val previous = item.optInt("progressValue", 0).coerceIn(0, target)
      val next = (previous + delta).coerceIn(0, target)
      if (next == previous) return false
      item.put("progressValue", next)
      val becameComplete = next >= target && previous < target
      val becameOpen = next < target && previous >= target
      item.put("completed", next >= target)
      if (becameComplete && item.optBoolean("required", false)) updateRequiredState(current, targetId, kind)
      if (becameOpen && item.optBoolean("required", false)) restoreRequiredState(current, item, kind)
    }
    val actions = widgetActions(preferences)
    if (operation == "timer_start" && (0 until actions.length()).any { index -> actions.optJSONObject(index)?.let { it.optString("id") == targetId && it.optString("kind") == kind && it.optString("operation") == operation } == true }) return false
    actions.put(JSONObject().put("id", targetId).put("kind", kind).put("operation", operation))
    preferences.edit().putString(FocusGateModule.GATE_STATE, current.put("widgetItems", items).toString()).putString(FocusGateModule.WIDGET_ACTIONS, actions.toString()).putLong(FocusGateModule.GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply()
    return true
  }

  private fun matchingItems(items: JSONArray, targetId: String, kind: String): List<JSONObject> = (0 until items.length()).mapNotNull { items.optJSONObject(it) }.filter { it.optString("id") == targetId && it.optString("kind") == kind }

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
  private fun detailIntent(context: Context, widgetId: Int, row: Int, targetId: String, kind: String): PendingIntent = PendingIntent.getActivity(context, ("detail:$widgetId:$row:$kind:$targetId").hashCode(), deepLink(context, if (kind == "habit") "habits" else "todos", targetId), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun actionIntent(context: Context, widgetId: Int, row: Int, action: String, targetId: String, kind: String): PendingIntent {
    val identity = "$widgetId:$row:$action:$kind:$targetId"
    return PendingIntent.getBroadcast(context, identity.hashCode(), Intent(context, FocusFlowWidgetProvider::class.java).apply {
      this.action = action
      data = Uri.parse("$DEEP_LINK_SCHEME:///widget/$widgetId/$row/$action/$kind/$targetId")
      putExtra(EXTRA_TARGET_ID, targetId)
      putExtra(EXTRA_KIND, kind)
    }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
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
    const val ACTION_INCREMENT = "focusflow.widget.INCREMENT"
    const val ACTION_DECREMENT = "focusflow.widget.DECREMENT"
    const val ACTION_TIMER_START = "focusflow.widget.TIMER_START"
    const val ACTION_OPEN_ITEM = "focusflow.widget.OPEN_ITEM"
    const val EXTRA_TARGET_ID = "targetId"
    const val EXTRA_KIND = "kind"
    fun refreshAll(context: Context) { val manager = AppWidgetManager.getInstance(context); val provider = FocusFlowWidgetProvider(); manager.getAppWidgetIds(ComponentName(context, FocusFlowWidgetProvider::class.java)).forEach { id -> provider.safeUpdateWidget(context, manager, id) } }
  }
}
