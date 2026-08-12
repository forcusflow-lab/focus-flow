package $PACKAGE_NAME.focusflow

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

class FocusFlowWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { ids.forEach { updateWidget(context, manager, it) } }
  companion object {
    fun refreshAll(context: Context) { val manager = AppWidgetManager.getInstance(context); manager.getAppWidgetIds(ComponentName(context, FocusFlowWidgetProvider::class.java)).forEach { updateWidget(context, manager, it) } }
    private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) { val saved = context.getSharedPreferences(FocusGateModule.GATE_PREFS, Context.MODE_PRIVATE).getString(FocusGateModule.GATE_STATE, null); val state = try { JSONObject(saved ?: "{}") } catch (_: Exception) { JSONObject() }; val pending = state.optInt("pendingCount", 0); val active = state.optBoolean("active", false); val views = RemoteViews(context.packageName, R.layout.focus_flow_widget); views.setTextViewText(R.id.focus_flow_widget_count, if (pending == 0) "完了" else "${pending}件"); views.setTextViewText(R.id.focus_flow_widget_status, if (active) "集中制限中：必須項目を完了すると解除" else "今日の集中ルールは解除されています"); val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply { addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP) }; val pendingIntent = PendingIntent.getActivity(context, id, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE); views.setOnClickPendingIntent(R.id.focus_flow_widget_root, pendingIntent); manager.updateAppWidget(id, views) }
  }
}
