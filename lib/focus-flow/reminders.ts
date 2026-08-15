import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const DAILY_REMINDER_CHANNEL = "focus-flow-daily-reminders";
const REMINDER_KIND = "focus-flow-daily-reminder";
let initialized = false;

type ReminderCopy = { english: boolean; time: string };

function parseTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return { hour: Math.min(Math.max(Number.isFinite(hours) ? hours : 19, 0), 23), minute: Math.min(Math.max(Number.isFinite(minutes) ? minutes : 0, 0), 59) };
}

function copy({ english }: ReminderCopy) {
  return english
    ? { title: "A quick Focus Flow check-in", body: "Review today’s must-dos and habits when you’re ready." }
    : { title: "Focus Flow のやさしい確認", body: "今日の必須Todoと習慣を、できるタイミングで確認しましょう。" };
}

export async function initializeReminders() {
  if (Platform.OS === "web" || initialized) return;
  Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL, {
      name: "Focus Flow daily reminders",
      description: "A gentle daily check-in for your must-dos and habits.",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120],
      lightColor: "#246B5A",
    });
  }
  initialized = true;
}

export async function getReminderPermissionGranted() {
  if (Platform.OS === "web") return false;
  await initializeReminders();
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function requestReminderPermission() {
  if (Platform.OS === "web") return false;
  await initializeReminders();
  const existing = await getReminderPermissionGranted();
  if (existing) return true;
  const permission = await Notifications.requestPermissionsAsync();
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function cancelExistingDailyReminders() {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((request) => request.content.data?.kind === REMINDER_KIND).map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

export async function scheduleDailyReminder(input: ReminderCopy) {
  if (Platform.OS === "web") return false;
  await initializeReminders();
  await cancelExistingDailyReminders();
  const permitted = await getReminderPermissionGranted();
  if (!permitted) return false;
  const { hour, minute } = parseTime(input.time);
  const trigger = Platform.OS === "android" ? { hour, minute, repeats: true, channelId: DAILY_REMINDER_CHANNEL } : { hour, minute, repeats: true };
  await Notifications.scheduleNotificationAsync({ content: { ...copy(input), data: { kind: REMINDER_KIND, url: "/(tabs)" }, sound: false }, trigger: trigger as Notifications.NotificationTriggerInput });
  return true;
}

export async function cancelDailyReminder() {
  await cancelExistingDailyReminders();
}

export async function sendReminderTest(english: boolean) {
  if (Platform.OS === "web") return false;
  await initializeReminders();
  const permitted = await getReminderPermissionGranted();
  if (!permitted) return false;
  await Notifications.scheduleNotificationAsync({ content: { ...copy({ english, time: "19:00" }), data: { kind: REMINDER_KIND, url: "/(tabs)" }, sound: false }, trigger: null });
  return true;
}
