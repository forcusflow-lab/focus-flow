const { AndroidConfig, createRunOncePlugin, withAndroidManifest, withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");
const PLUGIN_NAME = "with-focus-flow-android";

function addComponent(application, key, component) {
  application[key] = application[key] || [];
  const name = component.$["android:name"];
  if (!application[key].some((item) => item.$?.["android:name"] === name)) application[key].push(component);
}

function withFocusFlowReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let source = config.modResults.contents;
    if (source.includes("FOCUS_FLOW_UPLOAD_STORE_FILE")) return config;

    source = source.replace(
      "    signingConfigs {\n",
      `    signingConfigs {
        // CI supplies these Gradle properties from GitHub Actions Secrets. Keeping
        // them out of gradle.properties prevents upload-key material entering Git.
        release {
            if (project.hasProperty("FOCUS_FLOW_UPLOAD_STORE_FILE")) {
                storeFile file(FOCUS_FLOW_UPLOAD_STORE_FILE)
                storePassword FOCUS_FLOW_UPLOAD_STORE_PASSWORD
                keyAlias FOCUS_FLOW_UPLOAD_KEY_ALIAS
                keyPassword FOCUS_FLOW_UPLOAD_KEY_PASSWORD
            }
        }
`,
    );
    source = source.replace(
      /(buildTypes\s*\{[\s\S]*?\n\s*release\s*\{[\s\S]*?\n\s*)signingConfig = signingConfigs\.debug/,
      "$1signingConfig = project.hasProperty(\"FOCUS_FLOW_UPLOAD_STORE_FILE\") ? signingConfigs.release : signingConfigs.debug",
    );
    config.modResults.contents = source;
    return config;
  });
}

function withFocusFlowAndroid(config) {
  config = withFocusFlowReleaseSigning(config);
  config = withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const manifest = config.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    if (!manifest["uses-permission"].some((item) => item.$?.["android:name"] === "android.permission.QUERY_ALL_PACKAGES")) {
      manifest["uses-permission"].push({ $: { "android:name": "android.permission.QUERY_ALL_PACKAGES" } });
    }
    const packageName = config.android?.package ?? "com.app.focusflow";
    const nativePackage = `${packageName}.focusflow`;
    addComponent(application, "service", { $: { "android:name": `${nativePackage}.FocusGateService`, "android:permission": "android.permission.BIND_ACCESSIBILITY_SERVICE", "android:exported": "true", "android:label": "Focus Flow 集中制限" }, "intent-filter": [{ action: [{ $: { "android:name": "android.accessibilityservice.AccessibilityService" } }] }], "meta-data": [{ $: { "android:name": "android.accessibilityservice", "android:resource": "@xml/focus_flow_accessibility_service" } }] });
    application.service = (application.service || []).filter((service) => service.$?.["android:name"] !== `${nativePackage}.FocusFlowWidgetItemsService`);
    addComponent(application, "activity", { $: { "android:name": `${nativePackage}.FocusGateActivity`, "android:exported": "false", "android:excludeFromRecents": "true", "android:theme": "@style/FocusFlowGateTheme" } });
    const legacyWidgetNames = ["FocusFlowProgressWidgetProvider", "FocusFlowNextWidgetProvider", "FocusFlowHabitWidgetProvider", "FocusFlowRoutineWidgetProvider"].map((name) => `${nativePackage}.${name}`);
    application.receiver = (application.receiver || []).filter((receiver) => !legacyWidgetNames.includes(receiver.$?.["android:name"]));
    // The launcher inflates this minimal RemoteViews-only layout before Provider
    // updates begin. Keeping it separate from the Collection Widget avoids a
    // launcher-level add failure if a device has not yet bound the remote service.
    const widgets = [["FocusFlowWidgetProvider", "Focus Flow · Today", "focus_flow_widget_initial_info"]];
    widgets.forEach(([name, label, resource]) => addComponent(application, "receiver", { $: { "android:name": `${nativePackage}.${name}`, "android:exported": "true", "android:label": label }, "intent-filter": [{ action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }, { $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE_OPTIONS" } }] }], "meta-data": [{ $: { "android:name": "android.appwidget.provider", "android:resource": `@xml/${resource}` } }] }));
    return config;
  });
  return withDangerousMod(config, ["android", async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const androidRoot = path.join(projectRoot, "android");
    const packageName = config.android?.package ?? "com.app.focusflow";
    const deepLinkScheme = Array.isArray(config.scheme) ? config.scheme[0] : config.scheme ?? "manusfocusflow";
    const packagePath = packageName.split(".");
    const templateRoot = path.join(projectRoot, "plugins", "native", "android");
    const kotlinTarget = path.join(androidRoot, "app", "src", "main", "java", ...packagePath, "focusflow");
    const resourceTarget = path.join(androidRoot, "app", "src", "main", "res");
    fs.mkdirSync(kotlinTarget, { recursive: true });
    for (const file of ["FocusGateActivity.kt", "FocusGateModule.kt", "FocusGatePackage.kt", "FocusGateService.kt", "FocusFlowWidgetProvider.kt"]) fs.writeFileSync(path.join(kotlinTarget, file), fs.readFileSync(path.join(templateRoot, "kotlin", file), "utf8").replaceAll("$PACKAGE_NAME", packageName).replaceAll("$DEEP_LINK_SCHEME", deepLinkScheme));
    const themeDrawables = ["background_forest", "background_ocean", "background_violet", "background_amber", "background_blush", "background_ink", "accent_mint", "accent_sky", "accent_violet", "accent_coral", "accent_gold", "accent_ink", "count_mint", "count_sky", "count_violet", "count_coral", "count_gold", "count_ink"].map((name) => ["drawable", `focus_flow_widget_${name}.xml`]);
    const cardDrawables = ["light_0", "light_25", "light_50", "light_75", "light_100", "dark_0", "dark_25", "dark_50", "dark_75", "dark_100"].map((name) => ["drawable", `focus_flow_widget_card_${name}.xml`]);
    for (const [directory, file] of [["layout", "focus_flow_widget_initial.xml"], ["xml", "focus_flow_accessibility_service.xml"], ["xml", "focus_flow_widget_initial_info.xml"], ["values", "focus_flow_styles.xml"], ["drawable", "focus_flow_widget_background.xml"], ["drawable", "focus_flow_widget_checkbox.xml"], ["drawable", "focus_flow_widget_checkbox_done.xml"], ["drawable", "focus_flow_widget_check_empty.xml"], ["drawable", "focus_flow_widget_check_locked.xml"], ["drawable", "focus_flow_widget_check_mark.xml"], ["drawable", "focus_flow_widget_badge_light.xml"], ["drawable", "focus_flow_widget_badge_dark.xml"], ["drawable", "focus_flow_widget_check_circle.xml"], ["drawable", "focus_flow_widget_check_circle_done.xml"], ...cardDrawables, ...themeDrawables]) { const destination = path.join(resourceTarget, directory, file); fs.mkdirSync(path.dirname(destination, file), { recursive: true }); fs.copyFileSync(path.join(templateRoot, "res", directory, file), destination); }
    const mainApplication = path.join(androidRoot, "app", "src", "main", "java", ...packagePath, "MainApplication.kt");
    if (fs.existsSync(mainApplication)) { let source = fs.readFileSync(mainApplication, "utf8"); if (!source.includes("FocusGatePackage")) { source = source.replace(/package ([^\n]+)\n/, (match) => `${match}import ${packageName}.focusflow.FocusGatePackage\n`); source = source.replace("PackageList(this).packages.apply {", "PackageList(this).packages.apply {\n          add(FocusGatePackage())"); fs.writeFileSync(mainApplication, source); } }
    return config;
  }]);
}
module.exports = createRunOncePlugin(withFocusFlowAndroid, PLUGIN_NAME, "1.0.16");
