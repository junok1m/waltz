import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { createDog } from "../services/dogs";

type Props = {
  userId: string;
  onCreated: () => void | Promise<void>;
};

export function DogOnboardingScreen({ userId, onCreated }: Props) {
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [breed, setBreed] = useState("");
  const [busy, setBusy] = useState(false);

  const year = useMemo(() => Number(birthYear), [birthYear]);

  async function saveDog() {
    if (!name.trim()) {
      Alert.alert("Missing dog", "What should we call your walking buddy?");
      return;
    }

    if (!Number.isInteger(year) || year < 1980 || year > currentYear) {
      Alert.alert("Birthday check", `Enter a birth year between 1980 and ${currentYear}.`);
      return;
    }

    const month = birthMonth.trim() ? Number(birthMonth) : null;
    const day = birthDay.trim() ? Number(birthDay) : null;

    if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
      Alert.alert("Month check", "Month should be between 1 and 12.");
      return;
    }

    if (day !== null && (!Number.isInteger(day) || day < 1 || day > 31)) {
      Alert.alert("Day check", "Day should be between 1 and 31.");
      return;
    }

    if (day !== null && month === null) {
      Alert.alert("Month check", "Add a month if you add a day.");
      return;
    }

    if (month !== null && day !== null) {
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        Alert.alert("Birthday check", "That date doesn't exist. Give the birthday another sniff.");
        return;
      }
    }

    setBusy(true);
    try {
      await createDog({
        ownerId: userId,
        name,
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        breed,
      });
      await onCreated();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Couldn’t save your dog", message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>FIRST THINGS FIRST</Text>
        <Text style={styles.title}>Who’s your walking buddy? 🐕</Text>
        <Text style={styles.subtitle}>You can add more dogs later. Multi-dog households, we see you.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Dog’s name *</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Wang Wang Smith"
          placeholderTextColor="#A0968D"
          style={styles.input}
        />

        <Text style={[styles.label, styles.sectionGap]}>Birthday 🎂</Text>
        <Text style={styles.warning}>Not yours. Your dog’s!</Text>
        <Text style={styles.helper}>Year required · month and day optional</Text>

        <View style={styles.dateRow}>
          <View style={styles.yearField}>
            <Text style={styles.miniLabel}>Year *</Text>
            <TextInput
              value={birthYear}
              onChangeText={setBirthYear}
              placeholder="2021"
              placeholderTextColor="#A0968D"
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
            />
          </View>
          <View style={styles.smallField}>
            <Text style={styles.miniLabel}>Month</Text>
            <TextInput
              value={birthMonth}
              onChangeText={setBirthMonth}
              placeholder="6"
              placeholderTextColor="#A0968D"
              keyboardType="number-pad"
              maxLength={2}
              style={styles.input}
            />
          </View>
          <View style={styles.smallField}>
            <Text style={styles.miniLabel}>Day</Text>
            <TextInput
              value={birthDay}
              onChangeText={setBirthDay}
              placeholder="1"
              placeholderTextColor="#A0968D"
              keyboardType="number-pad"
              maxLength={2}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={[styles.label, styles.sectionGap]}>Breed</Text>
        <TextInput
          value={breed}
          onChangeText={setBreed}
          placeholder="Optional"
          placeholderTextColor="#A0968D"
          style={styles.input}
        />

        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoDog}>🐕</Text>
          <Text style={styles.photoText}>Add a photo later</Text>
        </View>
      </View>

      <Pressable style={styles.continueButton} onPress={saveDog} disabled={busy}>
        <Text style={styles.continueText}>{busy ? "SAVING…" : `${name.trim() || "YOUR DOG"} IS READY TO WALTZ`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "space-between", paddingBottom: 22 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.8, color: "#8C9670" },
  title: { marginTop: 10, fontSize: 30, lineHeight: 36, fontWeight: "800", color: "#1D1A17" },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 22, color: "#726960" },
  card: { backgroundColor: "#FFFDF8", borderRadius: 28, padding: 18 },
  label: { fontSize: 15, fontWeight: "800", color: "#302B26", marginBottom: 7 },
  miniLabel: { fontSize: 11, fontWeight: "700", color: "#7B7168", marginBottom: 5 },
  sectionGap: { marginTop: 16 },
  warning: { fontFamily: "Schoolbell_400Regular", fontSize: 22, color: "#E87859" },
  helper: { marginTop: 2, marginBottom: 10, fontSize: 12, color: "#8C8279" },
  input: { height: 50, borderRadius: 15, backgroundColor: "#F5EEE4", paddingHorizontal: 14, fontSize: 16, color: "#211E1B" },
  dateRow: { flexDirection: "row", gap: 8 },
  yearField: { flex: 1.4 },
  smallField: { flex: 0.8 },
  photoPlaceholder: { marginTop: 16, height: 68, borderRadius: 18, borderWidth: 1, borderStyle: "dashed", borderColor: "#D9CFC2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  photoDog: { fontSize: 28 },
  photoText: { fontSize: 13, color: "#8B8178" },
  continueButton: { minHeight: 60, borderRadius: 22, backgroundColor: "#8C9670", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  continueText: { fontFamily: "Schoolbell_400Regular", color: "#FFFDF8", fontSize: 22, textAlign: "center" },
});
