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
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: android.os.Bundle) {
    super.onAppWidgetOptionsChanged(context, manager, id, options)
    rememberWidgetBucket(context, id, options)
    safeUpdateWidget(context, manager, id, options)
  }
  override fun onDeleted(context: Context, ids: IntArray) {
    val editor = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).edit()
    ids.forEach { id -> editor.remove("$WIDGET_SIZE_PREFIX$id").remove(completedVisibilityKey(id)) }
    editor.apply()
    super.onDeleted(context, ids)
  }

  override fun onReceive(context: Context, intent: Intent) {
    val updated = when (intent.action) {
      ACTION_COMPLETE -> complete(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty())
      ACTION_RESTORE -> restore(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty())
      ACTION_INCREMENT, ACTION_DECREMENT, ACTION_TIMER_START, ACTION_TIMER_PAUSE -> adjustHabitFromWidget(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty(), intent.action.orEmpty())
      ACTION_TOGGLE_COMPLETED -> toggleCompletedVisibility(context, intent.getIntExtra(EXTRA_WIDGET_ID, -1))
      ACTION_OPEN_ITEM -> { openItem(context, intent.getStringExtra(EXTRA_TARGET_ID).orEmpty(), intent.getStringExtra(EXTRA_KIND).orEmpty()); false }
      else -> null
    }
    if (updated != null) { if (updated) refreshAll(context); return }
    super.onReceive(context, intent)
  }

  private fun safeUpdateWidget(context: Context, manager: AppWidgetManager, id: Int, options: android.os.Bundle? = null) {
    try { updateWidget(context, manager, id, options) } catch (_: Exception) { updateFallbackWidget(context, manager, id, options) }
  }

  // This layout is intentionally free of AdapterView, layout_weight and 0dp
  // sizing. It must remain safe for the launcher to inflate during add and
  // later refreshes, even before the app has synchronized any item state.
  private fun updateInitialWidget(context: Context, manager: AppWidgetManager, id: Int, fallback: Boolean = false, options: android.os.Bundle? = null) {
    val state = state(context)
    val english = state.optString("language", "ja") == "en"
    // Use one static RemoteViews tree for every launcher and Android version.
    // Size-specific maps can make some hosts reject the widget during placement;
    // resize callbacks still update the persisted row bucket for density.
    manager.updateAppWidget(id, createWidgetViews(context, state, id, english, widgetBucket(context, manager, id, options), fallback))
  }

  private fun createWidgetViews(context: Context, state: JSONObject, id: Int, english: Boolean, bucket: WidgetBucket, fallback: Boolean): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.focus_flow_widget_initial)
    bindTheme(views, state)
    bindHeader(context, views, state, id, english, bucket)
    bindStaticRows(context, views, state, id, english, bucket)
    if (fallback) views.setTextViewText(R.id.focus_flow_widget_empty, if (english) "Open Focus Flow to refresh your list" else "Focus Flowを開くと項目を更新します")
    val revealCompleted = !widgetCompletedVisible(context, id) && state.optInt("widgetHiddenCompletedCount", 0) > 0
    views.setOnClickPendingIntent(R.id.focus_flow_widget_root, todayIntent(context, id, revealCompleted))
    views.setOnClickPendingIntent(R.id.focus_flow_widget_header, todayIntent(context, id, revealCompleted))
    return views
  }

  // Keep a placed widget valid on a launcher that rejects an advanced action.
  // The fallback intentionally uses only primitive RemoteViews operations and
  // does not retry the failing responsive map or font setter.
  private fun updateFallbackWidget(context: Context, manager: AppWidgetManager, id: Int, options: android.os.Bundle? = null) {
    val views = RemoteViews(context.packageName, R.layout.focus_flow_widget_initial)
    val english = state(context).optString("language", "ja") == "en"
    val fontFamily = state(context).optString("fontFamily", "system")
    views.setTextViewText(R.id.focus_flow_widget_title, fontText(if (english) "TODAY" else "今日の項目", fontFamily))
    views.setTextViewText(R.id.focus_flow_widget_status, fontText(if (english) "Open Focus Flow to refresh your list" else "Focus Flowを開くと項目を更新します", fontFamily))
    views.setViewVisibility(R.id.focus_flow_widget_empty, View.VISIBLE)
    views.setTextViewText(R.id.focus_flow_widget_empty, fontText(if (english) "Open Focus Flow to add today’s items" else "今日の項目はありません", fontFamily))
    views.setOnClickPendingIntent(R.id.focus_flow_widget_header, todayIntent(context, id, false))
    views.setOnClickPendingIntent(R.id.focus_flow_widget_root, todayIntent(context, id, false))
    manager.updateAppWidget(id, views)
  }

  private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int, options: android.os.Bundle? = null) {
    updateInitialWidget(context, manager, id, false, options)
  }

  private fun state(context: Context): JSONObject {
    val saved = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null)
    return try { JSONObject(saved ?: "{}") } catch (_: Exception) { JSONObject() }
  }

  private fun completedVisibilityKey(id: Int) = "$WIDGET_SHOW_COMPLETED_PREFIX$id"

  private fun widgetCompletedVisible(context: Context, id: Int): Boolean {
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    return if (preferences.contains(completedVisibilityKey(id))) preferences.getBoolean(completedVisibilityKey(id), false) else preferences.getBoolean(WIDGET_SHOW_COMPLETED, false)
  }

  private fun visibleWidgetItems(context: Context, id: Int, all: JSONArray): JSONArray {
    if (widgetCompletedVisible(context, id)) return all
    return JSONArray().also { visible -> for (index in 0 until all.length()) { all.optJSONObject(index)?.takeIf { !it.optBoolean("completed", false) }?.let(visible::put) } }
  }

  private fun toggleCompletedVisibility(context: Context, id: Int): Boolean {
    if (id < 0) return false
    val state = state(context)
    if (state.optInt("widgetHiddenCompletedCount", 0) <= 0) return false
    val preferences = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE)
    preferences.edit().putBoolean(completedVisibilityKey(id), !widgetCompletedVisible(context, id)).apply()
    return true
  }

  private data class WidgetBucket(val maxRows: Int, val showControls: Boolean, val compactHeader: Boolean)

  private fun widgetBucket(context: Context, manager: AppWidgetManager, id: Int, updatedOptions: android.os.Bundle? = null): WidgetBucket {
    if (updatedOptions == null) rememberedWidgetBucket(context, id)?.let { return it }
    // Pre-Android 12 hosts offer only min/max bounds. Persist the callback
    // bucket so refreshAll after app-state synchronization never discards the
    // size that the launcher has just reported.
    val options = updatedOptions ?: manager.getAppWidgetOptions(id)
    val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 180))
    val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 110))
    return widgetBucket(width.toFloat(), height.toFloat())
  }

  private fun rememberWidgetBucket(context: Context, id: Int, options: android.os.Bundle) {
    val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 180))
    val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 110))
    context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).edit().putInt("$WIDGET_SIZE_PREFIX$id", widgetBucket(width.toFloat(), height.toFloat()).maxRows).apply()
  }

  private fun rememberedWidgetBucket(context: Context, id: Int): WidgetBucket? = when (context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getInt("$WIDGET_SIZE_PREFIX$id", 0)) {
    1 -> WidgetBucket(1, false, true)
    2 -> WidgetBucket(2, true, false)
    3 -> WidgetBucket(3, true, false)
    5 -> WidgetBucket(5, true, false)
    else -> null
  }

  private fun widgetBucket(width: Float, height: Float): WidgetBucket {
    return when {
      width < 190f || height < 150f -> WidgetBucket(1, false, true)
      height < 210f -> WidgetBucket(2, true, false)
      height < 250f -> WidgetBucket(3, true, false)
      else -> WidgetBucket(5, true, false)
    }
  }

  private fun bindTheme(views: RemoteViews, state: JSONObject) {
    val palette = state.optJSONObject("widgetPalette")
    val dark = palette?.optBoolean("isDark", false) ?: false
    val background = paletteColor(palette, "background", if (dark) "#14231F" else "#F7F8F5")
    val elevated = paletteColor(palette, "elevated", if (dark) "#263E36" else "#EDF4F0")
    val border = paletteColor(palette, "border", if (dark) "#3B554B" else "#D7E2DD")
    val primary = paletteColor(palette, "primary", if (dark) "#7FCBB0" else "#1B6B62")
    val opacity = state.optInt("widgetBackgroundOpacity", state.optInt("widgetOpacity", 86)).coerceIn(0, 100)
    // Todoist系の情報階層に合わせ、ヘッダーだけをprimaryのアクセント面へ。
    // 背景との混色で各テーマの個性を残し、透過設定は従来どおり維持する。
    // 薄いprimarySoftではなく、見出し専用のアクセント面として認識できる濃度にする。
    // ダークは明るいprimary、ライトは濃いprimaryを背景へ混ぜるため、双方で同等の階層感になる。
    val headerSurface = blendColors(background, primary, if (dark) 0.36f else 0.30f)
    views.setInt(R.id.focus_flow_widget_card, "setBackgroundColor", colorWithOpacity(background, opacity))
    views.setInt(R.id.focus_flow_widget_header, "setBackgroundColor", colorWithOpacity(headerSurface, opacity))
    listOf(R.id.focus_flow_widget_static_divider_one, R.id.focus_flow_widget_static_divider_two).forEach { dividerId -> views.setTextViewText(dividerId, ""); views.setInt(dividerId, "setBackgroundColor", colorWithOpacity(border, opacity)) }
  }

  private fun paletteColor(palette: JSONObject?, key: String, fallback: String): Int = try { Color.parseColor(palette?.optString(key, fallback) ?: fallback) } catch (_: Exception) { Color.parseColor(fallback) }

  private fun fontText(value: CharSequence, font: String): CharSequence {
    val family = when (font) {
      "reading" -> "serif"
      "notebook" -> "sans-serif-light"
      "focus" -> "monospace"
      else -> "sans-serif"
    }
    return SpannableString(value).apply {
      if (length > 0) setSpan(android.text.style.TypefaceSpan(family), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    }
  }

  private fun blendColors(base: Int, overlay: Int, fraction: Float): Int {
    val amount = fraction.coerceIn(0f, 1f)
    return Color.rgb(
      (Color.red(base) * (1f - amount) + Color.red(overlay) * amount).toInt(),
      (Color.green(base) * (1f - amount) + Color.green(overlay) * amount).toInt(),
      (Color.blue(base) * (1f - amount) + Color.blue(overlay) * amount).toInt(),
    )
  }

  private fun colorWithOpacity(color: Int, opacity: Int): Int = Color.argb((opacity.coerceIn(0, 100) * 255 / 100), Color.red(color), Color.green(color), Color.blue(color))

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

  private fun bindHeader(context: Context, views: RemoteViews, state: JSONObject, widgetId: Int, english: Boolean, bucket: WidgetBucket) {
    val palette = state.optJSONObject("widgetPalette")
    val dark = palette?.optBoolean("isDark", false) ?: false
    // Use the theme accent for the header so "今日の項目" reads as a
    // section title, while each theme keeps its own light/dark contrast pair.
    val detail = paletteColor(palette, "muted", if (dark) "#B7CCC2" else "#4E655B")
    val primary = paletteColor(palette, "primary", if (dark) "#7FCBB0" else "#1B6B62")
    val title = primary
    val pending = state.optInt("pendingCount", 0)
    val active = state.optBoolean("active", false)
    val scale = when (state.optString("widgetTextScale", "standard")) { "compact" -> 0.92f; "large" -> 1.14f; else -> 1f }
    views.setTextColor(R.id.focus_flow_widget_title, title)
    views.setImageViewResource(R.id.focus_flow_widget_add_todo, R.drawable.focus_flow_widget_add_todo)
    // Keep the 48dp hit target but remove the card surface: the add control is
    // an icon-only secondary action and deliberately uses the same accent as TODAY.
    views.setInt(R.id.focus_flow_widget_add_todo, "setBackgroundColor", Color.TRANSPARENT)
    views.setInt(R.id.focus_flow_widget_add_todo, "setColorFilter", primary)
    views.setContentDescription(R.id.focus_flow_widget_add_todo, if (english) "Add task" else "Todoを追加")
    views.setOnClickPendingIntent(R.id.focus_flow_widget_add_todo, addTodoIntent(context, widgetId))
    views.setTextColor(R.id.focus_flow_widget_status, detail)
    views.setTextColor(R.id.focus_flow_widget_empty, detail)
    views.setTextViewTextSize(R.id.focus_flow_widget_title, android.util.TypedValue.COMPLEX_UNIT_DIP, 12f * scale)
    views.setTextViewTextSize(R.id.focus_flow_widget_status, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
    views.setTextViewTextSize(R.id.focus_flow_widget_empty, android.util.TypedValue.COMPLEX_UNIT_DIP, 11f * scale)
    views.setTextViewText(R.id.focus_flow_widget_title, fontText(if (english) "TODAY" else "今日の項目", state.optString("fontFamily", "system")))
    val candidates = visibleWidgetItems(context, widgetId, state.optJSONArray("widgetItems") ?: JSONArray()).length()
    val overflow = (candidates - bucket.maxRows).coerceAtLeast(0)
    val baseStatus = if (!active) if (english) "App limits off" else "集中制限はオフ" else if (pending == 0) if (english) "Must-dos complete" else "必須項目を完了しました" else if (english) "$pending must-do${if (pending == 1) "" else "s"} remaining" else "必須項目 残り${pending}件"
    views.setTextViewText(R.id.focus_flow_widget_status, fontText(if (overflow > 0) "$baseStatus · ${if (english) "$overflow more" else "ほか${overflow}件"}" else baseStatus, state.optString("fontFamily", "system")))
    val completedCount = state.optInt("widgetHiddenCompletedCount", 0)
    val showingCompleted = widgetCompletedVisible(context, widgetId)
    views.setViewVisibility(R.id.focus_flow_widget_completed_toggle, if (completedCount > 0) View.VISIBLE else View.GONE)
    if (completedCount > 0) {
      views.setTextViewText(R.id.focus_flow_widget_completed_toggle, fontText(if (showingCompleted) if (english) "Open only" else "未完了のみ" else if (english) "Show all ($completedCount)" else "すべて表示（$completedCount）", state.optString("fontFamily", "system")))
      views.setTextColor(R.id.focus_flow_widget_completed_toggle, primary)
      views.setTextViewTextSize(R.id.focus_flow_widget_completed_toggle, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
      views.setOnClickPendingIntent(R.id.focus_flow_widget_completed_toggle, completedToggleIntent(context, widgetId))
    }
  }

  private data class StaticRowIds(val position: Int, val row: Int, val rail: Int, val action: Int, val check: Int, val content: Int, val title: Int, val badgeContainer: Int, val badgeBackground: Int, val badge: Int, val meta: Int, val chronometer: Int, val controls: Int, val controlsBackground: Int, val decrement: Int, val progress: Int, val increment: Int, val timerContainer: Int, val timerBackground: Int, val timer: Int)

  private fun staticRowIds(index: Int): StaticRowIds = when (index) {
    0 -> StaticRowIds(0, R.id.focus_flow_widget_static_row_one, R.id.focus_flow_widget_static_row_one_rail, R.id.focus_flow_widget_static_row_one_action, R.id.focus_flow_widget_static_row_one_check, R.id.focus_flow_widget_static_row_one_content, R.id.focus_flow_widget_static_row_one_title, R.id.focus_flow_widget_static_row_one_badge_container, R.id.focus_flow_widget_static_row_one_badge_background, R.id.focus_flow_widget_static_row_one_badge, R.id.focus_flow_widget_static_row_one_meta, R.id.focus_flow_widget_static_row_one_chronometer, R.id.focus_flow_widget_static_row_one_controls, R.id.focus_flow_widget_static_row_one_controls_background, R.id.focus_flow_widget_static_row_one_decrement, R.id.focus_flow_widget_static_row_one_progress, R.id.focus_flow_widget_static_row_one_increment, R.id.focus_flow_widget_static_row_one_timer_container, R.id.focus_flow_widget_static_row_one_timer_background, R.id.focus_flow_widget_static_row_one_timer)
    1 -> StaticRowIds(1, R.id.focus_flow_widget_static_row_two, R.id.focus_flow_widget_static_row_two_rail, R.id.focus_flow_widget_static_row_two_action, R.id.focus_flow_widget_static_row_two_check, R.id.focus_flow_widget_static_row_two_content, R.id.focus_flow_widget_static_row_two_title, R.id.focus_flow_widget_static_row_two_badge_container, R.id.focus_flow_widget_static_row_two_badge_background, R.id.focus_flow_widget_static_row_two_badge, R.id.focus_flow_widget_static_row_two_meta, R.id.focus_flow_widget_static_row_two_chronometer, R.id.focus_flow_widget_static_row_two_controls, R.id.focus_flow_widget_static_row_two_controls_background, R.id.focus_flow_widget_static_row_two_decrement, R.id.focus_flow_widget_static_row_two_progress, R.id.focus_flow_widget_static_row_two_increment, R.id.focus_flow_widget_static_row_two_timer_container, R.id.focus_flow_widget_static_row_two_timer_background, R.id.focus_flow_widget_static_row_two_timer)
    2 -> StaticRowIds(2, R.id.focus_flow_widget_static_row_three, R.id.focus_flow_widget_static_row_three_rail, R.id.focus_flow_widget_static_row_three_action, R.id.focus_flow_widget_static_row_three_check, R.id.focus_flow_widget_static_row_three_content, R.id.focus_flow_widget_static_row_three_title, R.id.focus_flow_widget_static_row_three_badge_container, R.id.focus_flow_widget_static_row_three_badge_background, R.id.focus_flow_widget_static_row_three_badge, R.id.focus_flow_widget_static_row_three_meta, R.id.focus_flow_widget_static_row_three_chronometer, R.id.focus_flow_widget_static_row_three_controls, R.id.focus_flow_widget_static_row_three_controls_background, R.id.focus_flow_widget_static_row_three_decrement, R.id.focus_flow_widget_static_row_three_progress, R.id.focus_flow_widget_static_row_three_increment, R.id.focus_flow_widget_static_row_three_timer_container, R.id.focus_flow_widget_static_row_three_timer_background, R.id.focus_flow_widget_static_row_three_timer)
    3 -> StaticRowIds(3, R.id.focus_flow_widget_static_row_four, R.id.focus_flow_widget_static_row_four_rail, R.id.focus_flow_widget_static_row_four_action, R.id.focus_flow_widget_static_row_four_check, R.id.focus_flow_widget_static_row_four_content, R.id.focus_flow_widget_static_row_four_title, R.id.focus_flow_widget_static_row_four_badge_container, R.id.focus_flow_widget_static_row_four_badge_background, R.id.focus_flow_widget_static_row_four_badge, R.id.focus_flow_widget_static_row_four_meta, R.id.focus_flow_widget_static_row_four_chronometer, R.id.focus_flow_widget_static_row_four_controls, R.id.focus_flow_widget_static_row_four_controls_background, R.id.focus_flow_widget_static_row_four_decrement, R.id.focus_flow_widget_static_row_four_progress, R.id.focus_flow_widget_static_row_four_increment, R.id.focus_flow_widget_static_row_four_timer_container, R.id.focus_flow_widget_static_row_four_timer_background, R.id.focus_flow_widget_static_row_four_timer)
    else -> StaticRowIds(4, R.id.focus_flow_widget_static_row_five, R.id.focus_flow_widget_static_row_five_rail, R.id.focus_flow_widget_static_row_five_action, R.id.focus_flow_widget_static_row_five_check, R.id.focus_flow_widget_static_row_five_content, R.id.focus_flow_widget_static_row_five_title, R.id.focus_flow_widget_static_row_five_badge_container, R.id.focus_flow_widget_static_row_five_badge_background, R.id.focus_flow_widget_static_row_five_badge, R.id.focus_flow_widget_static_row_five_meta, R.id.focus_flow_widget_static_row_five_chronometer, R.id.focus_flow_widget_static_row_five_controls, R.id.focus_flow_widget_static_row_five_controls_background, R.id.focus_flow_widget_static_row_five_decrement, R.id.focus_flow_widget_static_row_five_progress, R.id.focus_flow_widget_static_row_five_increment, R.id.focus_flow_widget_static_row_five_timer_container, R.id.focus_flow_widget_static_row_five_timer_background, R.id.focus_flow_widget_static_row_five_timer)
  }

  private fun bindStaticRows(context: Context, views: RemoteViews, state: JSONObject, widgetId: Int, english: Boolean, bucket: WidgetBucket) {
    val all = state.optJSONArray("widgetItems") ?: JSONArray()
    val rows = uniqueStaticItems(visibleWidgetItems(context, widgetId, all), bucket.maxRows)
    val palette = state.optJSONObject("widgetPalette")
    val dark = palette?.optBoolean("isDark", false) ?: false
    val titleColor = paletteColor(palette, "text", "#13251F")
    val mutedColor = paletteColor(palette, "muted", "#4E655B")
    val primary = paletteColor(palette, "primary", "#1B6B62")
    val primarySoft = paletteColor(palette, "primarySoft", "#E3F1EC")
    val elevated = paletteColor(palette, "elevated", "#EDF4F0")
    val onPrimary = paletteColor(palette, "background", "#F7F8F5")
    val surface = paletteColor(palette, "surface", if (dark) "#1C302A" else "#FFFFFF")
    val theme = state.optString("widgetTheme", "mist")
    val rowOpacity = state.optInt("widgetCardOpacity", 100).coerceIn(0, 100)
    val scale = when (state.optString("widgetTextScale", "standard")) { "compact" -> 0.92f; "large" -> 1.14f; else -> 1f }
    views.setViewVisibility(R.id.focus_flow_widget_empty, if (rows.isEmpty()) View.VISIBLE else View.GONE)
    if (rows.isEmpty()) views.setTextViewText(R.id.focus_flow_widget_empty, fontText(if (english) "Open Focus Flow to add today’s items" else "今日の項目はありません", state.optString("fontFamily", "system")))
    val dividers = listOf(R.id.focus_flow_widget_static_divider_one, R.id.focus_flow_widget_static_divider_two, R.id.focus_flow_widget_static_divider_three, R.id.focus_flow_widget_static_divider_four)
    for (index in 0..4) {
      val ids = staticRowIds(index)
      val item = rows.getOrNull(index)
      views.setViewVisibility(ids.row, if (item == null) View.GONE else View.VISIBLE)
      if (index < dividers.size) views.setViewVisibility(dividers[index], if (index < rows.size - 1) View.VISIBLE else View.GONE)
      if (item != null) bindStaticRow(context, views, ids, item, widgetId, english, state.optString("fontFamily", "system"), titleColor, mutedColor, primary, primarySoft, elevated, onPrimary, surface, rowOpacity, scale, bucket.showControls, dark, theme) else clearStaticRow(views, ids)
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
    views.setViewVisibility(ids.badgeContainer, View.GONE)
    views.setViewVisibility(ids.meta, View.GONE)
    views.setViewVisibility(ids.controls, View.GONE)
    views.setViewVisibility(ids.timerContainer, View.GONE)
    views.setViewVisibility(ids.timer, View.GONE)
    views.setViewVisibility(ids.chronometer, View.GONE)
    views.setInt(ids.rail, "setBackgroundColor", Color.TRANSPARENT)
    views.setInt(ids.row, "setBackgroundColor", Color.TRANSPARENT)
    views.setInt(ids.check, "setBackgroundResource", R.drawable.focus_flow_widget_checkbox)
    views.setImageViewResource(ids.check, R.drawable.focus_flow_widget_check_empty)
  }

  private fun bindStaticRow(context: Context, views: RemoteViews, ids: StaticRowIds, item: JSONObject, widgetId: Int, english: Boolean, fontFamily: String, titleColor: Int, mutedColor: Int, primary: Int, primarySoft: Int, elevated: Int, onPrimary: Int, surface: Int, rowOpacity: Int, scale: Float, showControls: Boolean, dark: Boolean, theme: String) {
    val completed = item.optBoolean("completed", false)
    val canToggle = item.optBoolean("canToggle", false)
    val title = item.optString("title")
    val badge = compactBadge(item, english)
    views.setInt(ids.row, "setBackgroundColor", colorWithOpacity(if (completed) elevated else surface, rowOpacity))
    val kind = item.optString("kind")
    val accentFallback = if (kind == "habit") primary else Color.parseColor("#3566B7")
    val accent = try { Color.parseColor(item.optString("accentColor")) } catch (_: Exception) { accentFallback }
    views.setInt(ids.rail, "setBackgroundColor", accent)
    views.setTextViewText(ids.title, fontText(if (completed) struck(title) else title, fontFamily))
    views.setTextColor(ids.title, if (completed) mutedColor else titleColor)
    views.setTextViewTextSize(ids.title, android.util.TypedValue.COMPLEX_UNIT_DIP, 13f * scale)
    views.setViewVisibility(ids.badgeContainer, if (badge.isBlank()) View.GONE else View.VISIBLE)
    views.setTextViewText(ids.badge, fontText(badge, fontFamily))
    views.setTextColor(ids.badge, primary)
    views.setImageViewResource(ids.badgeBackground, widgetBadgeDrawable(context, theme, dark, rowOpacity))
    views.setTextViewTextSize(ids.badge, android.util.TypedValue.COMPLEX_UNIT_DIP, 11f * scale)
    val unit = item.optString("progressUnit", "check")
    val timerRunning = item.optBoolean("timerRunning", false)
    val timerPaused = item.optBoolean("timerPaused", false)
    val timerElapsed = item.optInt("timerElapsedSeconds", 0).coerceAtLeast(0)
    val timerTarget = item.optInt("timerTargetSeconds", 0).coerceAtLeast(0)
    val timerClock = "${timerElapsed / 60}:${String.format(java.util.Locale.US, "%02d", timerElapsed % 60)} / ${timerTarget / 60}:${String.format(java.util.Locale.US, "%02d", timerTarget % 60)}"
    val meta = when {
      unit == "minutes" && timerRunning -> if (english) "Timing" else "計測中"
      unit == "minutes" && timerPaused -> if (english) "Paused $timerClock" else "一時停止 $timerClock"
      unit == "minutes" -> if (english) "Time goal $timerClock" else "時間目標 $timerClock"
      kind == "habit" -> if (english) "Habit" else "習慣"
      else -> if (english) "Todo" else "Todo"
    }
    views.setViewVisibility(ids.meta, if (meta.isBlank()) View.GONE else View.VISIBLE)
    views.setTextViewText(ids.meta, fontText(meta, fontFamily))
    views.setTextColor(ids.meta, mutedColor)
    views.setTextViewTextSize(ids.meta, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
    val showChronometer = unit == "minutes" && timerRunning && !completed
    views.setViewVisibility(ids.chronometer, if (showChronometer) View.VISIBLE else View.GONE)
    if (showChronometer) {
      val startedAtMillis = item.optLong("timerStartedAtMillis", 0L)
      val elapsedAtRender = if (startedAtMillis > 0L) (timerElapsed + ((System.currentTimeMillis() - startedAtMillis).coerceAtLeast(0L) / 1_000L).toInt()).coerceAtLeast(0) else timerElapsed
      val baseElapsedRealtime = android.os.SystemClock.elapsedRealtime() - elapsedAtRender.toLong() * 1_000L
      val targetClock = "${timerTarget / 60}:${String.format(java.util.Locale.US, "%02d", timerTarget % 60)}"
      views.setTextColor(ids.chronometer, mutedColor)
      views.setTextViewTextSize(ids.chronometer, android.util.TypedValue.COMPLEX_UNIT_DIP, 10f * scale)
      views.setChronometer(ids.chronometer, baseElapsedRealtime, "%s / $targetClock", true)
    }
    if (completed) {
      views.setInt(ids.check, "setBackgroundResource", R.drawable.focus_flow_widget_check_circle_done)
      views.setImageViewResource(ids.check, R.drawable.focus_flow_widget_check_mark)
    } else {
      views.setInt(ids.check, "setBackgroundResource", R.drawable.focus_flow_widget_check_circle)
      views.setImageViewResource(ids.check, R.drawable.focus_flow_widget_check_empty)
    }
    val itemId = item.optString("id")
    views.setOnClickPendingIntent(ids.content, detailIntent(context, widgetId, ids.position, itemId, kind))
    val action = if (completed) ACTION_RESTORE else ACTION_COMPLETE
    views.setOnClickPendingIntent(ids.action, if (canToggle) actionIntent(context, widgetId, ids.position, action, itemId, kind) else noOpIntent(context, widgetId, ids.position, itemId, kind))
    val supportsControls = showControls && kind == "habit" && !completed && (unit == "count" || unit == "minutes")
    views.setViewVisibility(ids.controls, if (supportsControls) View.VISIBLE else View.GONE)
    if (supportsControls && unit == "count") {
      views.setViewVisibility(ids.controlsBackground, View.VISIBLE)
      views.setViewVisibility(ids.timerContainer, View.GONE)
      views.setImageViewResource(ids.controlsBackground, widgetCardDrawable(dark, rowOpacity))
      listOf(ids.decrement, ids.progress, ids.increment).forEach { control -> views.setViewVisibility(control, View.VISIBLE) }
      val value = item.optInt("progressValue", 0)
      val target = item.optInt("targetValue", 1).coerceAtLeast(1)
      views.setTextViewText(ids.progress, fontText("$value/$target", fontFamily))
      views.setTextColor(ids.progress, primary)
      views.setTextViewText(ids.decrement, fontText("−", fontFamily))
      views.setTextViewText(ids.increment, fontText("+", fontFamily))
      listOf(ids.decrement, ids.increment).forEach { control ->
        views.setTextColor(control, primary)
        views.setInt(control, "setBackgroundResource", widgetCardDrawable(dark, rowOpacity))
        views.setTextViewTextSize(control, android.util.TypedValue.COMPLEX_UNIT_DIP, 14f * scale)
      }
      views.setContentDescription(ids.decrement, if (english) "Decrease count" else "回数を減らす")
      views.setContentDescription(ids.increment, if (english) "Increase count" else "回数を増やす")
      views.setInt(ids.progress, "setBackgroundColor", colorWithOpacity(elevated, rowOpacity))
      views.setTextViewTextSize(ids.progress, android.util.TypedValue.COMPLEX_UNIT_DIP, 11f * scale)
      views.setOnClickPendingIntent(ids.decrement, actionIntent(context, widgetId, ids.position, ACTION_DECREMENT, itemId, kind))
      views.setOnClickPendingIntent(ids.increment, actionIntent(context, widgetId, ids.position, ACTION_INCREMENT, itemId, kind))
    } else if (supportsControls) {
      views.setViewVisibility(ids.controlsBackground, View.GONE)
      views.setViewVisibility(ids.timerContainer, View.VISIBLE)
      views.setViewVisibility(ids.timerBackground, View.GONE)
      listOf(ids.decrement, ids.progress, ids.increment).forEach { control -> views.setViewVisibility(control, View.GONE) }
      val timerAction = if (timerRunning) ACTION_TIMER_PAUSE else ACTION_TIMER_START
      views.setTextViewText(ids.timer, fontText(if (timerRunning) if (english) "Pause" else "停止" else if (timerPaused) if (english) "Resume" else "再開" else if (english) "Start" else "開始", fontFamily))
      views.setTextColor(ids.timer, primary)
      views.setInt(ids.timer, "setBackgroundResource", widgetCardDrawable(dark, rowOpacity))
      views.setOnClickPendingIntent(ids.timer, actionIntent(context, widgetId, ids.position, timerAction, itemId, kind))
      views.setOnClickPendingIntent(ids.controls, actionIntent(context, widgetId, ids.position, timerAction, itemId, kind))
    }
  }

  private fun compactBadge(item: JSONObject, english: Boolean): String {
    val required = item.optBoolean("required", false)
    val hasWindow = item.optString("windowLabel", "").isNotBlank()
    return when {
      required -> if (english) "MUST" else "必須"
      hasWindow -> if (english) "TIME" else "時間帯"
      else -> ""
    }
  }

  private fun widgetBadgeDrawable(context: Context, theme: String, dark: Boolean, opacity: Int): Int {
    val appearance = if (dark) "dark" else "light"
    val level = when { opacity < 13 -> 0; opacity < 38 -> 25; opacity < 63 -> 50; opacity < 88 -> 75; else -> 100 }
    val name = "focus_flow_widget_badge_${theme}_${appearance}_$level"
    return context.resources.getIdentifier(name, "drawable", context.packageName).takeIf { it != 0 }
      ?: context.resources.getIdentifier("focus_flow_widget_badge_mist_${appearance}_$level", "drawable", context.packageName)
  }

  private fun itemCardDrawable(theme: String, dark: Boolean, completed: Boolean, required: Boolean): Int = widgetSurfaceDrawable(theme, dark)

  private fun widgetSurfaceDrawable(theme: String, dark: Boolean): Int = when (theme) {
    "slate" -> if (dark) R.drawable.focus_flow_widget_surface_slate_dark else R.drawable.focus_flow_widget_surface_slate_light
    "evergreen" -> if (dark) R.drawable.focus_flow_widget_surface_evergreen_dark else R.drawable.focus_flow_widget_surface_evergreen_light
    "ocean" -> if (dark) R.drawable.focus_flow_widget_surface_ocean_dark else R.drawable.focus_flow_widget_surface_ocean_light
    "orchid" -> if (dark) R.drawable.focus_flow_widget_surface_orchid_dark else R.drawable.focus_flow_widget_surface_orchid_light
    "sunrise" -> if (dark) R.drawable.focus_flow_widget_surface_sunrise_dark else R.drawable.focus_flow_widget_surface_sunrise_light
    else -> if (dark) R.drawable.focus_flow_widget_surface_mist_dark else R.drawable.focus_flow_widget_surface_mist_light
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
    item.put("completed", true)
    item.put("timedLocked", false)
    current.put("widgetItems", items)
    if (item.optBoolean("gateRequired", false)) updateRequiredState(current, targetId, kind)
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
    if (item.optBoolean("gateRequired", false)) restoreRequiredState(current, item, kind)
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
    val operation = when (action) { ACTION_INCREMENT -> "increment"; ACTION_DECREMENT -> "decrement"; ACTION_TIMER_START -> "timer_start"; ACTION_TIMER_PAUSE -> "timer_pause"; else -> return false }
    if (operation == "timer_start") {
      if (unit != "minutes" || item.optBoolean("timerRunning", false)) return false
      item.put("timerRunning", true)
      item.put("timerPaused", false)
      item.put("timerStartedAtMillis", System.currentTimeMillis())
    } else if (operation == "timer_pause") {
      if (unit != "minutes" || !item.optBoolean("timerRunning", false)) return false
      val startedAt = item.optLong("timerStartedAtMillis", System.currentTimeMillis())
      val elapsed = item.optInt("timerElapsedSeconds", 0).coerceAtLeast(0) + ((System.currentTimeMillis() - startedAt).coerceAtLeast(0L) / 1_000L).toInt()
      item.put("timerRunning", false)
      item.put("timerPaused", true)
      item.put("timerElapsedSeconds", elapsed)
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
    if ((operation == "timer_start" || operation == "timer_pause") && (0 until actions.length()).any { index -> actions.optJSONObject(index)?.let { it.optString("id") == targetId && it.optString("kind") == kind && it.optString("operation") == operation } == true }) return false
    val queuedAction = JSONObject().put("id", targetId).put("kind", kind).put("operation", operation)
    if (operation == "timer_start") queuedAction.put("startedAt", java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }.format(java.util.Date()))
    if (operation == "timer_pause") queuedAction.put("elapsedSeconds", item.optInt("timerElapsedSeconds", 0).coerceAtLeast(0))
    actions.put(queuedAction)
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
  private fun todayIntent(context: Context, id: Int, showCompleted: Boolean = false): PendingIntent = PendingIntent.getActivity(context, id, deepLink(context, "today", showCompleted = showCompleted), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
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
  private fun completedToggleIntent(context: Context, widgetId: Int): PendingIntent = PendingIntent.getBroadcast(context, ("completed-toggle:$widgetId").hashCode(), Intent(context, FocusFlowWidgetProvider::class.java).apply {
    action = ACTION_TOGGLE_COMPLETED
    data = Uri.parse("$DEEP_LINK_SCHEME:///widget/$widgetId/completed-toggle")
    putExtra(EXTRA_WIDGET_ID, widgetId)
  }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun noOpIntent(context: Context, widgetId: Int, row: Int, targetId: String, kind: String): PendingIntent = PendingIntent.getBroadcast(context, ("noop:$widgetId:$row:$kind:$targetId").hashCode(), Intent(context, FocusFlowWidgetProvider::class.java).apply { action = ACTION_NOOP; data = Uri.parse("$DEEP_LINK_SCHEME:///widget/$widgetId/$row/noop/$kind/$targetId") }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun addTodoIntent(context: Context, widgetId: Int): PendingIntent = PendingIntent.getActivity(context, ("add-todo:$widgetId").hashCode(), deepLink(context, "todos", createTodo = true), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun deepLink(context: Context, destination: String, targetId: String? = null, showCompleted: Boolean = false, createTodo: Boolean = false): Intent {
    val uri = Uri.parse("$DEEP_LINK_SCHEME:///").buildUpon().apply {
      when (destination) {
        "todos" -> appendPath("todos")
        "habits" -> appendPath("habits")
      }
      if (targetId != null) appendQueryParameter("open", targetId)
      if (showCompleted) appendQueryParameter("completed", "1")
      if (createTodo) appendQueryParameter("create", "1")
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
    const val ACTION_TIMER_PAUSE = "focusflow.widget.TIMER_PAUSE"
    const val ACTION_TOGGLE_COMPLETED = "focusflow.widget.TOGGLE_COMPLETED"
    const val ACTION_OPEN_ITEM = "focusflow.widget.OPEN_ITEM"
    const val ACTION_NOOP = "focusflow.widget.NOOP"
    const val EXTRA_TARGET_ID = "targetId"
    const val EXTRA_KIND = "kind"
    const val EXTRA_WIDGET_ID = "widgetId"
    const val WIDGET_SIZE_PREFIX = "widgetSizeRows:"
    const val WIDGET_SHOW_COMPLETED = "widgetShowCompleted"
    const val WIDGET_SHOW_COMPLETED_PREFIX = "widgetShowCompleted:"
    fun refreshAll(context: Context) { val manager = AppWidgetManager.getInstance(context); val provider = FocusFlowWidgetProvider(); manager.getAppWidgetIds(ComponentName(context, FocusFlowWidgetProvider::class.java)).forEach { id -> provider.safeUpdateWidget(context, manager, id) } }
  }
}
