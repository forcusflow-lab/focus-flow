package $PACKAGE_NAME.focusflow

import android.content.Context
import android.graphics.Typeface
import android.util.AttributeSet
import android.widget.TextView

/** TextView with a RemoteViews-safe setter for the app's font preference. */
class FocusFlowWidgetTextView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = 0,
) : TextView(context, attrs, defStyleAttr) {
  fun setFontFamilyName(name: String?) {
    typeface = when (name) {
      "serif" -> Typeface.create("serif", Typeface.NORMAL)
      "sans-serif-light" -> Typeface.create("sans-serif-light", Typeface.NORMAL)
      "monospace" -> Typeface.create("monospace", Typeface.NORMAL)
      else -> Typeface.create("sans-serif", Typeface.NORMAL)
    }
  }
}

// $PACKAGE_NAME is replaced by the native plugin generator when this file is copied.
