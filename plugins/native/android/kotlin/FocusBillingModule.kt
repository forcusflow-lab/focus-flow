package $PACKAGE_NAME.focusflow

import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FocusBillingModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), PurchasesUpdatedListener {
  private val client = BillingClient.newBuilder(context).setListener(this).enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).enableAutoServiceReconnection().build()

  override fun getName() = "FocusBilling"

  @ReactMethod fun getPlusStatus(promise: Promise) { resolveStatus(promise) }
  @ReactMethod fun restorePlus(promise: Promise) { resolveStatus(promise) }

  @ReactMethod fun purchasePlus(promise: Promise) {
    val activity = currentActivity
    if (activity == null) { promise.resolve(status("error", false, reason = "NO_ACTIVITY")); return }
    withConnection { result ->
      if (result.responseCode != BillingClient.BillingResponseCode.OK) { promise.resolve(status("error", false, reason = result.responseCode.toString())); return@withConnection }
      queryProduct { details ->
        if (details == null) { promise.resolve(status("unavailable", false)); return@queryProduct }
        val offer = details.subscriptionOfferDetails?.firstOrNull()
        if (offer == null) { promise.resolve(status("unavailable", false)); return@queryProduct }
        val params = BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details).setOfferToken(offer.offerToken).build())).build()
        val launched = client.launchBillingFlow(activity, params)
        promise.resolve(status(if (launched.responseCode == BillingClient.BillingResponseCode.OK) "pending" else "error", false, details, launched.responseCode.toString()))
      }
    }
  }

  override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
    // The app refreshes the authoritative status on foreground and explicit restore.
    // No entitlement is granted here until Google Play reports PURCHASED and acknowledgement succeeds.
  }

  private fun resolveStatus(promise: Promise) {
    withConnection { connection ->
      if (connection.responseCode != BillingClient.BillingResponseCode.OK) { promise.resolve(status("error", false, reason = connection.responseCode.toString())); return@withConnection }
      queryProduct { details ->
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()) { query, purchases ->
          if (query.responseCode != BillingClient.BillingResponseCode.OK) { promise.resolve(status("error", false, details, query.responseCode.toString())); return@queryPurchasesAsync }
          val purchase = purchases.firstOrNull { it.products.contains(PLUS_PRODUCT_ID) }
          when (purchase?.purchaseState) {
            Purchase.PurchaseState.PURCHASED -> acknowledgeThenResolve(purchase, details, promise)
            Purchase.PurchaseState.PENDING -> promise.resolve(status("pending", false, details))
            else -> promise.resolve(status(if (details == null) "unavailable" else "eligible", false, details))
          }
        }
      }
    }
  }

  private fun acknowledgeThenResolve(purchase: Purchase, details: ProductDetails?, promise: Promise) {
    if (purchase.isAcknowledged) { promise.resolve(status("active", true, details)); return }
    client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.purchaseToken).build()) { result ->
      promise.resolve(status(if (result.responseCode == BillingClient.BillingResponseCode.OK) "active" else "error", result.responseCode == BillingClient.BillingResponseCode.OK, details, result.responseCode.toString()))
    }
  }

  private fun withConnection(onReady: (BillingResult) -> Unit) {
    if (client.isReady) { onReady(BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.OK).build()); return }
    client.startConnection(object : BillingClientStateListener {
      override fun onBillingSetupFinished(result: BillingResult) = onReady(result)
      override fun onBillingServiceDisconnected() = Unit
    })
  }

  private fun queryProduct(callback: (ProductDetails?) -> Unit) {
    val product = QueryProductDetailsParams.Product.newBuilder().setProductId(PLUS_PRODUCT_ID).setProductType(BillingClient.ProductType.SUBS).build()
    client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(listOf(product)).build()) { result, catalog -> callback(if (result.responseCode == BillingClient.BillingResponseCode.OK) catalog.productDetailsList.firstOrNull() else null) }
  }

  private fun status(state: String, active: Boolean, details: ProductDetails? = null, reason: String? = null) = Arguments.makeNativeMap(mapOf("status" to state, "active" to active, "productId" to PLUS_PRODUCT_ID, "price" to details?.subscriptionOfferDetails?.firstOrNull()?.pricingPhases?.pricingPhaseList?.firstOrNull()?.formattedPrice, "reason" to reason))

  companion object { const val PLUS_PRODUCT_ID = "focus_flow_plus" }
}
