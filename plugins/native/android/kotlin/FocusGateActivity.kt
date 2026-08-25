package $PACKAGE_NAME.focusflow

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class FocusGateActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val english = intent.getStringExtra(EXTRA_LANGUAGE) == "en"
    val message = intent.getStringExtra(EXTRA_MESSAGE) ?: if (english) "Complete today's must-dos first" else "今日の必須項目を完了してください"
    val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(48, 48, 48, 48); setBackgroundColor(Color.rgb(20, 49, 41)) }
    layout.addView(TextView(this).apply { text = "Focus Flow"; textSize = 30f; setTextColor(Color.WHITE); gravity = Gravity.CENTER; setPadding(0, 0, 0, 16) })
    layout.addView(TextView(this).apply { text = message; textSize = 18f; setTextColor(Color.rgb(220, 238, 229)); gravity = Gravity.CENTER; setPadding(0, 0, 0, 24) })
    layout.addView(Button(this).apply {
      text = if (english) "Review items in Focus Flow" else "Focus Flowで項目を確認する"
      setOnClickListener {
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("$DEEP_LINK_SCHEME:///"))
          .setPackage(packageName)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP))
        finish()
      }
    })
    layout.addView(TextView(this).apply { text = if (english) "Timed items unlock when their scheduled time has elapsed. Early completion is available from the item in Focus Flow." else "時間管理項目は設定時間の経過後に完了します。早期完了はFocus Flowの項目画面から利用できます。"; textSize = 13f; setTextColor(Color.rgb(190, 220, 209)); gravity = Gravity.CENTER; setPadding(0, 20, 0, 8) })
    layout.addView(Button(this).apply { text = if (english) "Open Focus Flow app settings" else "Focus Flowのアプリ情報を開く"; setOnClickListener { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))); finish() } })
    setContentView(layout)
  }

  companion object { const val EXTRA_MESSAGE = "focusFlowMessage"; const val EXTRA_LANGUAGE = "focusFlowLanguage" }
}
