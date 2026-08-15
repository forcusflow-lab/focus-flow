package $PACKAGE_NAME.focusflow

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

internal abstract class FocusFlowBaseWidgetProvider : AppWidgetProvider() {
  abstract fun layoutResource(): Int
  abstract fun bind(views: RemoteViews, state: JSONObject)
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { ids.forEach { updateWidget(context, manager, it) } }
  fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) { val views = RemoteViews(context.packageName, layoutResource()); bind(views, state(context)); views.setOnClickPendingIntent(R.id.focus_flow_widget_root, launchIntent(context, id)); manager.updateAppWidget(id, views) }
  protected fun state(context: Context): JSONObject { val saved = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null); return try { JSONObject(saved ?: "{}") } catch (_: Exception) { JSONObject() } }
  protected fun launchIntent(context: Context, id: Int): PendingIntent { val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply { addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP) }; return PendingIntent.getActivity(context, id, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE) }
  protected fun en(state: JSONObject) = state.optString("language", "ja") == "en"
  protected fun active(state: JSONObject) = state.optBoolean("active", false)
}

class FocusFlowWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget
  override fun bind(views: RemoteViews, state: JSONObject) { val pending = state.optInt("pendingCount", 0); val english = en(state); views.setTextViewText(R.id.focus_flow_widget_count, if (pending == 0) if (english) "Done" else "完了" else if (english) "$pending left" else "${pending}件"); views.setTextViewText(R.id.focus_flow_widget_status, if (!active(state)) if (english) "App limits are off" else "アプリ制限はオフ" else if (pending == 0) if (english) "Today’s must-dos are complete" else "今日の必須項目を完了しました" else if (english) "Finish must-dos to unlock apps" else "必須項目を終えてアプリを解除") }
  companion object { private val providers = listOf(FocusFlowWidgetProvider::class.java, FocusFlowProgressWidgetProvider::class.java, FocusFlowNextWidgetProvider::class.java, FocusFlowHabitWidgetProvider::class.java, FocusFlowRoutineWidgetProvider::class.java); fun refreshAll(context: Context) { val manager = AppWidgetManager.getInstance(context); providers.forEach { clazz -> val provider = clazz.getDeclaredConstructor().newInstance(); manager.getAppWidgetIds(ComponentName(context, clazz)).forEach { id -> provider.updateWidget(context, manager, id) } } } }
}

class FocusFlowProgressWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget_progress
  override fun bind(views: RemoteViews, state: JSONObject) { val english = en(state); val total = state.optInt("requiredTodoTotal", 0) + state.optInt("requiredHabitTotal", 0); val done = state.optInt("completedTodoTotal", 0) + state.optInt("completedHabitTotal", 0); views.setTextViewText(R.id.focus_flow_widget_title, if (english) "UNLOCK PROGRESS" else "解除の進捗"); views.setTextViewText(R.id.focus_flow_widget_main, if (total == 0) if (english) "Add a must-do" else "必須項目を追加" else "$done / $total"); views.setTextViewText(R.id.focus_flow_widget_detail, if (english) "Tasks ${state.optInt("completedTodoTotal", 0)}/${state.optInt("requiredTodoTotal", 0)} · Habits ${state.optInt("completedHabitTotal", 0)}/${state.optInt("requiredHabitTotal", 0)}" else "Todo ${state.optInt("completedTodoTotal", 0)}/${state.optInt("requiredTodoTotal", 0)} ・ 習慣 ${state.optInt("completedHabitTotal", 0)}/${state.optInt("requiredHabitTotal", 0)}") }
}

class FocusFlowNextWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget_next
  override fun bind(views: RemoteViews, state: JSONObject) { val english = en(state); val title = state.optString("nextRequiredTitle", ""); val kind = state.optString("nextRequiredKind", ""); views.setTextViewText(R.id.focus_flow_widget_title, if (english) "NEXT MUST-DO" else "次の必須項目"); views.setTextViewText(R.id.focus_flow_widget_main, if (title.isBlank()) if (english) "You’re all set" else "すべて完了です" else title); views.setTextViewText(R.id.focus_flow_widget_detail, if (title.isBlank()) if (english) "Open Focus Flow to plan tomorrow" else "Focus Flowで明日の予定を整えましょう" else if (kind == "habit") if (english) "Record today’s habit" else "今日の習慣を記録" else if (english) "Complete this task to unlock apps" else "完了するとアプリを解除できます") }
}

class FocusFlowHabitWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget_habit
  override fun bind(views: RemoteViews, state: JSONObject) { val english = en(state); val total = state.optInt("requiredHabitTotal", 0); val done = state.optInt("completedHabitTotal", 0); views.setTextViewText(R.id.focus_flow_widget_title, if (english) "HABIT PULSE" else "習慣の記録"); views.setTextViewText(R.id.focus_flow_widget_main, if (total == 0) if (english) "No must-do habits" else "必須習慣はありません" else if (english) "$done of $total complete" else "$done / $total を完了"); views.setTextViewText(R.id.focus_flow_widget_detail, if (total == 0) if (english) "Add one when a routine matters" else "習慣を必須にするとここに表示" else if (done == total) if (english) "Today’s required habits are done" else "今日の必須習慣は完了しました" else if (english) "Tap to record your progress" else "タップして進捗を記録") }
}

class FocusFlowRoutineWidgetProvider : FocusFlowBaseWidgetProvider() {
  override fun layoutResource() = R.layout.focus_flow_widget_routine
  override fun bind(views: RemoteViews, state: JSONObject) { val english = en(state); val label = state.optString("routineLabel", ""); val routineOn = state.optBoolean("routineActive", false); views.setTextViewText(R.id.focus_flow_widget_title, if (english) "ROUTINE STATUS" else "日課の状態"); views.setTextViewText(R.id.focus_flow_widget_main, if (!active(state)) if (english) "App limits are off" else "アプリ制限はオフ" else if (routineOn) if (label.isBlank()) if (english) "Routine active" else "日課を適用中" else label else if (english) "No routine active" else "日課の時間外です"); views.setTextViewText(R.id.focus_flow_widget_detail, if (!active(state)) if (english) "Turn on App limits in Settings" else "設定からアプリ制限をオンにできます" else if (routineOn) if (english) "Tap to review today’s unlock progress" else "タップして今日の解除進捗を確認" else if (english) "Your next routine will resume automatically" else "次の日課の時間になると自動で再開") }
}
