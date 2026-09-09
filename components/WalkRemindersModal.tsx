import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Dog } from "../types/dog";
import { formatReminderTime, getWalkReminders, setWalkReminder, WalkReminder } from "../services/walkReminders";

type Props = { visible: boolean; dog: Dog; onClose: () => void };

function shiftTime(reminder: WalkReminder, minutes: number): WalkReminder {
  const total = (reminder.hour * 60 + reminder.minute + minutes + 1440) % 1440;
  return { ...reminder, hour: Math.floor(total / 60), minute: total % 60 };
}

export function WalkRemindersModal({ visible, dog, onClose }: Props) {
  const [reminders, setReminders] = useState<WalkReminder[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getWalkReminders().then(setReminders).catch(() => setReminders([]));
  }, [visible]);

  async function save(next: WalkReminder) {
    setBusy(true);
    try {
      await setWalkReminder(next, dog.name);
      setReminders((current) => current.map((item) => item.kind === next.kind ? next : item));
    } catch (error) {
      Alert.alert("Couldn't set reminder", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.head}>
            <View>
              <Text style={s.title}>Walk reminders</Text>
              <Text style={s.subtitle}>A tiny nudge so you don't forget to press Start.</Text>
            </View>
            <Pressable onPress={onClose}><Text style={s.done}>Done</Text></Pressable>
          </View>

          {reminders.map((reminder) => (
            <View key={reminder.kind} style={s.card}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{reminder.kind === "morning" ? "Morning Waltz ☀️" : "Evening Waltz 🌙"}</Text>
                  <Text style={s.time}>{formatReminderTime(reminder.hour, reminder.minute)}</Text>
                </View>
                <Switch
                  value={reminder.enabled}
                  disabled={busy}
                  onValueChange={(enabled) => void save({ ...reminder, enabled })}
                  trackColor={{ true: "#AAB38A" }}
                />
              </View>
              <View style={s.timeControls}>
                <Pressable style={s.timeButton} disabled={busy} onPress={() => void save(shiftTime(reminder, -30))}>
                  <Text style={s.timeButtonText}>− 30 min</Text>
                </Pressable>
                <Pressable style={s.timeButton} disabled={busy} onPress={() => void save(shiftTime(reminder, 30))}>
                  <Text style={s.timeButtonText}>+ 30 min</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Text style={s.note}>Reminders stay on this phone. Waltz doesn't need your location until you actually start a walk.</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,.28)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFDF8", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 38 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  title: { fontFamily: "Schoolbell_400Regular", fontSize: 31, color: "#1D1A17" },
  subtitle: { fontSize: 11, color: "#82786E", marginTop: 2 },
  done: { fontWeight: "800", color: "#78845C", paddingTop: 8 },
  card: { backgroundColor: "#F5EEE4", borderRadius: 20, padding: 16, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  label: { fontSize: 15, fontWeight: "800", color: "#302B26" },
  time: { fontFamily: "Schoolbell_400Regular", fontSize: 27, color: "#596442", marginTop: 3 },
  timeControls: { flexDirection: "row", gap: 8, marginTop: 12 },
  timeButton: { flex: 1, borderWidth: 1, borderColor: "#D7CDBF", borderRadius: 999, paddingVertical: 9, alignItems: "center", backgroundColor: "#FFFDF8" },
  timeButtonText: { fontSize: 11, fontWeight: "800", color: "#655D54" },
  note: { fontSize: 10, lineHeight: 15, color: "#9A9187", textAlign: "center", marginTop: 5, paddingHorizontal: 10 },
});
