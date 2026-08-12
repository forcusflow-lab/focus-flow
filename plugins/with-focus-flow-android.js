const { AndroidConfig, createRunOncePlugin, withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");
const PLUGIN_NAME = "with-focus-flow-android";

function addComponent(application, key, component) {
  application[key] = application[key] || [];
  const name = component.$["android:name"];
  if (!application[key].some((item) => item.$?.["android:name"] === name)) application[key].push(component);
}

function withFocusFlowAndroid(config) {
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
    addComponent(application, "activity", { $: { "android:name": `${nativePackage}.FocusGateActivity`, "android:exported": "false", "android:excludeFromRecents": "true", "android:theme": "@style/FocusFlowGateTheme" } });
    addComponent(application, "receiver", { $: { "android:name": `${nativePackage}.FocusFlowWidgetProvider`, "android:exported": "true", "android:label": "Focus Flow" }, "intent-filter": [{ action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }] }], "meta-data": [{ $: { "android:name": "android.appwidget.provider", "android:resource": "@xml/focus_flow_widget_info" } }] });
    return config;
  });
  return withDangerousMod(config, ["android", async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const androidRoot = path.join(projectRoot, "android");
    const packageName = config.android?.package ?? "com.app.focusflow";
    const packagePath = packageName.split(".");
    const templateRoot = path.join(projectRoot, "plugins", "native", "android");
    const kotlinTarget = path.join(androidRoot, "app", "src", "main", "java", ...packagePath, "focusflow");
    const resourceTarget = path.join(androidRoot, "app", "src", "main", "res");
    fs.mkdirSync(kotlinTarget, { recursive: true });
    for (const file of ["FocusGateActivity.kt", "FocusGateModule.kt", "FocusGatePackage.kt", "FocusGateService.kt", "FocusFlowWidgetProvider.kt"]) fs.writeFileSync(path.join(kotlinTarget, file), fs.readFileSync(path.join(templateRoot, "kotlin", file), "utf8").replaceAll("$PACKAGE_NAME", packageName));
    for (const [directory, file] of [["layout", "focus_flow_widget.xml"], ["xml", "focus_flow_accessibility_service.xml"], ["xml", "focus_flow_widget_info.xml"], ["values", "focus_flow_styles.xml"], ["drawable", "focus_flow_widget_background.xml"]]) { const destination = path.join(resourceTarget, directory, file); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(path.join(templateRoot, "res", directory, file), destination); }
    const mainApplication = path.join(androidRoot, "app", "src", "main", "java", ...packagePath, "MainApplication.kt");
    if (fs.existsSync(mainApplication)) { let source = fs.readFileSync(mainApplication, "utf8"); if (!source.includes("FocusGatePackage")) { source = source.replace(/package ([^\n]+)\n/, (match) => `${match}import ${packageName}.focusflow.FocusGatePackage\n`); source = source.replace("PackageList(this).packages.apply {", "PackageList(this).packages.apply {\n          add(FocusGatePackage())"); fs.writeFileSync(mainApplication, source); } }
    return config;
  }]);
}
module.exports = createRunOncePlugin(withFocusFlowAndroid, PLUGIN_NAME, "1.0.0");
