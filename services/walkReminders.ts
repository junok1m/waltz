import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export type WalkReminderKind = "morning" | "evening";
export type WalkReminder = { kind: WalkReminderKind; hour: number; minute: number; enabled: boolean };
const CHANNEL = "walk-reminders";
const defaults: Record<WalkReminderKind, Omit<WalkReminder, "kind">> = { morning: { hour: 7, minute: 0, enabled: false }, evening: { hour: 18, minute: 0, enabled: false } };

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

export function formatReminderTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}
async function ensureChannel() { if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Walk reminders", importance: Notifications.AndroidImportance.DEFAULT }); }
function kindFromRequest(request: Notifications.NotificationRequest): WalkReminderKind | null { const kind = request.content.data?.walkReminder; return kind === "morning" || kind === "evening" ? kind : null; }

export async function getWalkReminders(): Promise<WalkReminder[]> {
  await ensureChannel();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return (["morning", "evening"] as WalkReminderKind[]).map((kind) => {
    const found = scheduled.find((request) => kindFromRequest(request) === kind);
    if (!found) return { kind, ...defaults[kind] };
    const trigger = found.trigger as { hour?: number; minute?: number };
    return { kind, hour: typeof trigger.hour === "number" ? trigger.hour : defaults[kind].hour, minute: typeof trigger.minute === "number" ? trigger.minute : defaults[kind].minute, enabled: true };
  });
}

export async function setWalkReminder(reminder: WalkReminder, dogName: string) {
  await ensureChannel();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((request) => kindFromRequest(request) === reminder.kind).map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
  if (!reminder.enabled) return;
  const permission = await Notifications.getPermissionsAsync();
  let granted = permission.granted;
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) throw new Error("Notifications are off. Enable them in your phone settings to use walk reminders.");
  const morning = reminder.kind === "morning";
  await Notifications.scheduleNotificationAsync({
    content: { title: morning ? "Morning Waltz? ☀️" : "Evening Waltz? 🌙", body: morning ? `Ready for a walk with ${dogName}?` : `Time for another lap with ${dogName}?`, data: { walkReminder: reminder.kind } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: reminder.hour, minute: reminder.minute, channelId: Platform.OS === "android" ? CHANNEL : undefined },
  });
}
