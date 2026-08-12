package $PACKAGE_NAME.focusflow

import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FocusGateModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "FocusGate"
  @ReactMethod fun saveGateState(serialized: String, promise: Promise) { context.getSharedPreferences(GATE_PREFS, Context.MODE_PRIVATE).edit().putString(GATE_STATE, serialized).apply(); FocusFlowWidgetProvider.refreshAll(context); promise.resolve(null) }
  @ReactMethod fun getAccessibilityStatus(promise: Promise) { val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES).orEmpty(); promise.resolve(enabled.contains("${context.packageName}/${FocusGateService::class.java.name}")) }
  @ReactMethod fun openAccessibilitySettings(promise: Promise) { try { context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); promise.resolve(null) } catch (error: Exception) { promise.reject("SETTINGS_UNAVAILABLE", error) } }
  @ReactMethod fun getLaunchableApps(promise: Promise) { try { val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER); val apps = context.packageManager.queryIntentActivities(intent, 0).filter { it.activityInfo.packageName != context.packageName }.map { mapOf("packageName" to it.activityInfo.packageName, "label" to it.loadLabel(context.packageManager).toString()) }.distinctBy { it["packageName"] }.sortedBy { it["label"]?.lowercase() }; val result = Arguments.createArray(); apps.forEach { app -> result.pushMap(Arguments.makeNativeMap(app)) }; promise.resolve(result) } catch (error: Exception) { promise.reject("APP_LIST_UNAVAILABLE", error) } }
  companion object { const val GATE_PREFS = "FocusFlowGate"; const val GATE_STATE = "gateState" }
}
