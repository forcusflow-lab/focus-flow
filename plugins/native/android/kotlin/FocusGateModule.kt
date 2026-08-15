package $PACKAGE_NAME.focusflow

import android.content.Context
import android.content.Intent
import android.app.ActivityManager
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FocusGateModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "FocusGate"
  @ReactMethod fun saveGateState(serialized: String, promise: Promise) { context.getSharedPreferences(GATE_PREFS, Context.MODE_PRIVATE).edit().putString(GATE_STATE, serialized).remove(WIDGET_UNDO).putLong(GATE_STATE_UPDATED_AT, System.currentTimeMillis()).apply(); FocusFlowWidgetProvider.refreshAll(context); promise.resolve(null) }
  @ReactMethod fun consumeWidgetCompletions(promise: Promise) { try { val preferences = context.getSharedPreferences(GATE_PREFS, Context.MODE_PRIVATE); val queued = org.json.JSONArray(preferences.getString(WIDGET_COMPLETIONS, "[]") ?: "[]"); preferences.edit().remove(WIDGET_COMPLETIONS).apply(); val result = Arguments.createArray(); for (index in 0 until queued.length()) { val action = queued.optJSONObject(index) ?: continue; result.pushMap(Arguments.makeNativeMap(mapOf("id" to action.optString("id"), "kind" to action.optString("kind")))) }; promise.resolve(result) } catch (error: Exception) { promise.reject("WIDGET_COMPLETIONS_UNAVAILABLE", error) } }
  @ReactMethod fun getAccessibilityStatus(promise: Promise) { val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES).orEmpty(); promise.resolve(enabled.contains("${context.packageName}/${FocusGateService::class.java.name}")) }
  @ReactMethod fun openAccessibilitySettings(promise: Promise) { try { context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); promise.resolve(null) } catch (error: Exception) { promise.reject("SETTINGS_UNAVAILABLE", error) } }
  @ReactMethod fun openAppDetailsSettings(promise: Promise) { try { context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, android.net.Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); promise.resolve(null) } catch (error: Exception) { promise.reject("APP_SETTINGS_UNAVAILABLE", error) } }
  @ReactMethod fun getGateDiagnostics(promise: Promise) { try { val preferences = context.getSharedPreferences(GATE_PREFS, Context.MODE_PRIVATE); val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES).orEmpty().contains("${context.packageName}/${FocusGateService::class.java.name}"); val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager; val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager; promise.resolve(Arguments.makeNativeMap(mapOf("accessibilityEnabled" to enabled, "batteryOptimizationIgnored" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) powerManager.isIgnoringBatteryOptimizations(context.packageName) else null, "backgroundRestricted" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) activityManager.isBackgroundRestricted else false, "apiLevel" to Build.VERSION.SDK_INT, "manufacturer" to Build.MANUFACTURER, "model" to Build.MODEL, "lastGateStateUpdatedAt" to preferences.getLong(GATE_STATE_UPDATED_AT, 0L), "safetyPauseUntil" to preferences.getLong(SAFETY_PAUSE_UNTIL, 0L)))); } catch (error: Exception) { promise.reject("DIAGNOSTICS_UNAVAILABLE", error) } }
  @ReactMethod fun getLaunchableApps(promise: Promise) { try { val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER); val apps = context.packageManager.queryIntentActivities(intent, 0).filter { it.activityInfo.packageName != context.packageName }.map { mapOf("packageName" to it.activityInfo.packageName, "label" to it.loadLabel(context.packageManager).toString()) }.distinctBy { it["packageName"] }.sortedBy { it["label"]?.lowercase() }; val result = Arguments.createArray(); apps.forEach { app -> result.pushMap(Arguments.makeNativeMap(app)) }; promise.resolve(result) } catch (error: Exception) { promise.reject("APP_LIST_UNAVAILABLE", error) } }
  companion object {
    const val GATE_PREFS = "FocusFlowGate"; const val GATE_STATE = "gateState"; const val GATE_STATE_UPDATED_AT = "gateStateUpdatedAt"; const val SAFETY_PAUSE_UNTIL = "safetyPauseUntil"; const val WIDGET_COMPLETIONS = "widgetCompletions"; const val WIDGET_UNDO = "widgetUndo"
    fun setSafetyPause(context: Context, minutes: Int = 10) { context.getSharedPreferences(GATE_PREFS, Context.MODE_PRIVATE).edit().putLong(SAFETY_PAUSE_UNTIL, System.currentTimeMillis() + minutes.coerceIn(1, 60) * 60_000L).apply() }
    fun isSafetyPaused(context: Context): Boolean = context.getSharedPreferences(GATE_PREFS, Context.MODE_PRIVATE).getLong(SAFETY_PAUSE_UNTIL, 0L) > System.currentTimeMillis()
  }
}
