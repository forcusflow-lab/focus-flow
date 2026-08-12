package $PACKAGE_NAME.focusflow

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class FocusGateActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); val message = intent.getStringExtra(EXTRA_MESSAGE) ?: "今日の必須項目を完了してください"; val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(48, 48, 48, 48); setBackgroundColor(Color.rgb(20, 49, 41)) }; layout.addView(TextView(this).apply { text = "Focus Flow"; textSize = 30f; setTextColor(Color.WHITE); gravity = Gravity.CENTER; setPadding(0, 0, 0, 16) }); layout.addView(TextView(this).apply { text = message; textSize = 18f; setTextColor(Color.rgb(220, 238, 229)); gravity = Gravity.CENTER; setPadding(0, 0, 0, 32) }); layout.addView(Button(this).apply { text = "今日の項目を確認する"; setOnClickListener { packageManager.getLaunchIntentForPackage(packageName)?.let { startActivity(it) }; finish() } }); setContentView(layout) }
  companion object { const val EXTRA_MESSAGE = "focusFlowMessage" }
}
