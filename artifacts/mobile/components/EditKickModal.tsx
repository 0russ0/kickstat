import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Kick } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type FieldSide = "own" | "opponent";
type PuntResult = "out_of_bounds" | "touchback" | "blocked" | "fair_catch" | "downed" | "punt_return";
type MissType = "left" | "right" | "short" | "blocked";
type TouchbackType = "endzone" | "out_of_endzone";

interface Props {
  kick: Kick | null;
  onClose: () => void;
}

function SideToggle({ value, onChange }: { value: FieldSide; onChange: (v: FieldSide) => void }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
      {(["own", "opponent"] as FieldSide[]).map((side) => (
        <Pressable
          key={side}
          style={{
            flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center",
            borderWidth: 1.5,
            backgroundColor: value === side ? colors.primary : colors.secondary,
            borderColor: value === side ? colors.primary : colors.border,
          }}
          onPress={() => onChange(side)}
        >
          <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: value === side ? "#fff" : colors.mutedForeground }}>
            {side === "own" ? "Own Side" : "Opp Side"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function FieldGoalEditor({ kick, onSave, onClose }: { kick: Kick; onSave: () => void; onClose: () => void }) {
  const colors = useColors();
  const { editKick, kickMode } = useApp();
  const d = kick.data as Record<string, unknown>;

  const [los, setLos] = useState(String(d["los"] ?? ""));
  const [outcome, setOutcome] = useState<"made" | "missed">((d["outcome"] as "made" | "missed") ?? "made");
  const [missType, setMissType] = useState<MissType | null>((d["missType"] as MissType) ?? null);
  const [badSnap, setBadSnap] = useState<boolean>(!!(d["badSnap"]));
  const [isGameWinner, setIsGameWinner] = useState<boolean>(!!(kick.isGameWinner));
  const [saving, setSaving] = useState(false);

  const MISS_TYPES: { value: MissType; label: string }[] = [
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "short", label: "Short" },
    { value: "blocked", label: "Blocked" },
  ];

  const s = makeStyles(colors);

  const handleSave = async () => {
    if (!los || isNaN(Number(los))) { Alert.alert("Missing", "Enter LOS."); return; }
    if (outcome === "missed" && !missType && !badSnap) { Alert.alert("Missing", "Select a miss type or mark Bad Snap."); return; }
    setSaving(true);
    try {
      await editKick(kick.id, {
        los: Number(los),
        totalDistance: Number(los) + 17,
        outcome,
        missType: outcome === "missed" ? (missType ?? null) : null,
        badSnap,
      }, isGameWinner);
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 14 }}>
      <Text style={s.label}>LOS</Text>
      <TextInput style={s.input} value={los} onChangeText={setLos} keyboardType="numeric" maxLength={3} placeholder="—" placeholderTextColor={colors.mutedForeground} />

      <Text style={s.label}>Outcome</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {(["made", "missed"] as const).map((o) => (
          <Pressable key={o} style={[s.toggleBtn, { flex: 1, backgroundColor: outcome === o ? (o === "made" ? colors.success : colors.destructive) : colors.secondary, borderColor: outcome === o ? (o === "made" ? colors.success : colors.destructive) : colors.border }]} onPress={() => { setOutcome(o); if (o === "made") setMissType(null); }}>
            <Text style={[s.toggleBtnText, { color: outcome === o ? "#fff" : colors.mutedForeground }]}>{o === "made" ? "Made" : "Missed"}</Text>
          </Pressable>
        ))}
      </View>

      {outcome === "missed" && (
        <>
          <Text style={s.label}>Miss Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {MISS_TYPES.map((m) => (
              <Pressable key={m.value} style={[s.chip, { backgroundColor: missType === m.value ? colors.primary : colors.secondary, borderColor: missType === m.value ? colors.primary : colors.border }]} onPress={() => setMissType(missType === m.value ? null : m.value)}>
                <Text style={[s.chipText, { color: missType === m.value ? "#fff" : colors.mutedForeground }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 12 }} onPress={() => setBadSnap(!badSnap)}>
        <View style={[s.checkBox, { backgroundColor: badSnap ? colors.warning : "transparent", borderColor: badSnap ? colors.warning : colors.border }]}>
          {badSnap && <Feather name="check" size={14} color="#fff" />}
        </View>
        <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: badSnap ? colors.warning : colors.foreground }}>Bad Snap</Text>
      </Pressable>

      {kick.gameId && (
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 12 }} onPress={() => setIsGameWinner(!isGameWinner)}>
          <View style={[s.checkBox, { backgroundColor: isGameWinner ? colors.warning : "transparent", borderColor: isGameWinner ? colors.warning : colors.border }]}>
            {isGameWinner && <Feather name="check" size={14} color="#fff" />}
          </View>
          <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: isGameWinner ? colors.warning : colors.foreground }}>🏆 Game-Winning FG</Text>
        </Pressable>
      )}

      <Pressable style={[s.saveBtn, { opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
        <Text style={s.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
      </Pressable>
      <Pressable style={s.cancelBtn} onPress={onClose}>
        <Text style={s.cancelBtnText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

function PuntEditor({ kick, onSave, onClose }: { kick: Kick; onSave: () => void; onClose: () => void }) {
  const colors = useColors();
  const { editKick } = useApp();
  const d = kick.data as Record<string, unknown>;

  const [snapYard, setSnapYard] = useState(String(d["snapYard"] ?? ""));
  const [snapSide, setSnapSide] = useState<FieldSide>((d["snapSide"] as FieldSide) ?? "own");
  const [landingYard, setLandingYard] = useState(String(d["landingYard"] ?? d["obYard"] ?? ""));
  const [landingSide, setLandingSide] = useState<FieldSide>((d["landingSide"] as FieldSide) ?? (d["obSide"] as FieldSide) ?? "opponent");
  const [result, setResult] = useState<PuntResult | null>((d["result"] as PuntResult) ?? null);
  const [badSnap, setBadSnap] = useState<boolean>(!!(d["badSnap"]));
  const [returnYards, setReturnYards] = useState(String(d["returnYards"] ?? ""));
  const [saving, setSaving] = useState(false);

  const RESULTS: { value: PuntResult; label: string }[] = [
    { value: "out_of_bounds", label: "Out of Bounds" },
    { value: "touchback", label: "Touchback" },
    { value: "fair_catch", label: "Fair Catch" },
    { value: "downed", label: "Downed" },
    { value: "punt_return", label: "Punt Return" },
    { value: "blocked", label: "Blocked" },
  ];

  const snapN = snapYard ? Number(snapYard) : null;
  const landN = landingYard ? Number(landingYard) : null;
  const isOB = result === "out_of_bounds";

  function calcDist() {
    if (snapN == null || landN == null) return null;
    const snapPos = snapSide === "own" ? snapN : 100 - snapN;
    const landPos = landingSide === "own" ? landN : 100 - landN;
    return Math.max(0, landPos - snapPos);
  }
  const distance = calcDist();

  const s = makeStyles(colors);

  const handleSave = async () => {
    if (!snapYard || snapN === null) { Alert.alert("Missing", "Enter snap yard line."); return; }
    setSaving(true);
    try {
      await editKick(kick.id, {
        snapYard: snapN,
        snapSide,
        landingYard: !isOB ? (landN ?? null) : null,
        landingSide: !isOB && landN !== null ? landingSide : null,
        obYard: isOB ? (landN ?? null) : null,
        obSide: isOB ? landingSide : null,
        distance: distance ?? null,
        hangtime: d["hangtime"] ?? 0,
        result: result ?? null,
        badSnap,
        returnYards: result === "punt_return" && returnYards ? Number(returnYards) : null,
      });
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 14 }}>
      <Text style={s.label}>Snap Yard Line</Text>
      <SideToggle value={snapSide} onChange={setSnapSide} />
      <TextInput style={s.input} value={snapYard} onChangeText={setSnapYard} keyboardType="numeric" maxLength={2} placeholder="—" placeholderTextColor={colors.mutedForeground} />

      <Text style={s.label}>{isOB ? "Out-of-Bounds Yard Line" : "Landing Yard Line"}</Text>
      <SideToggle value={landingSide} onChange={setLandingSide} />
      <TextInput style={s.input} value={landingYard} onChangeText={setLandingYard} keyboardType="numeric" maxLength={2} placeholder="—" placeholderTextColor={colors.mutedForeground} />

      {distance !== null && (
        <View style={{ backgroundColor: colors.secondary, borderRadius: 10, padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Distance</Text>
          <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: colors.primary }}>{distance}yd</Text>
        </View>
      )}

      <Text style={s.label}>Result</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {RESULTS.map((r) => (
          <Pressable key={r.value} style={[s.chip, { backgroundColor: result === r.value ? colors.primary : colors.secondary, borderColor: result === r.value ? colors.primary : colors.border }]} onPress={() => setResult(result === r.value ? null : r.value)}>
            <Text style={[s.chipText, { color: result === r.value ? "#fff" : colors.mutedForeground }]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 12 }} onPress={() => setBadSnap(!badSnap)}>
        <View style={[s.checkBox, { backgroundColor: badSnap ? colors.warning : "transparent", borderColor: badSnap ? colors.warning : colors.border }]}>
          {badSnap && <Feather name="check" size={14} color="#fff" />}
        </View>
        <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: badSnap ? colors.warning : colors.foreground }}>Bad Snap</Text>
      </Pressable>

      {result === "punt_return" && (
        <>
          <Text style={s.label}>Return Yards</Text>
          <TextInput style={s.input} value={returnYards} onChangeText={setReturnYards} keyboardType="numeric" maxLength={3} placeholder="—" placeholderTextColor={colors.mutedForeground} />
        </>
      )}

      <Pressable style={[s.saveBtn, { opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
        <Text style={s.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
      </Pressable>
      <Pressable style={s.cancelBtn} onPress={onClose}>
        <Text style={s.cancelBtnText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

function KickoffEditor({ kick, onSave, onClose }: { kick: Kick; onSave: () => void; onClose: () => void }) {
  const colors = useColors();
  const { editKick } = useApp();
  const d = kick.data as Record<string, unknown>;

  const [touchback, setTouchback] = useState<boolean | null>(d["touchback"] != null ? !!(d["touchback"]) : null);
  const [touchbackType, setTouchbackType] = useState<TouchbackType | null>((d["touchbackType"] as TouchbackType) ?? null);
  const [landingYard, setLandingYard] = useState(String(d["landingYard"] ?? ""));
  const [returnYards, setReturnYards] = useState(String(d["returnYards"] ?? ""));
  const [saving, setSaving] = useState(false);

  const s = makeStyles(colors);

  const handleSave = async () => {
    if (touchback === null) { Alert.alert("Missing", "Select Touchback or Returned."); return; }
    if (touchback && !touchbackType) { Alert.alert("Missing", "Select the touchback type."); return; }
    setSaving(true);
    try {
      await editKick(kick.id, {
        touchback,
        touchbackType: touchback ? touchbackType : null,
        hangtime: d["hangtime"] ?? 0,
        landingYard: landingYard ? Number(landingYard) : null,
        returnYards: !touchback && returnYards ? Number(returnYards) : null,
      });
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 14 }}>
      <Text style={s.label}>Result</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable style={[s.toggleBtn, { flex: 1, backgroundColor: touchback === true ? colors.success : colors.secondary, borderColor: touchback === true ? colors.success : colors.border }]} onPress={() => { setTouchback(true); setReturnYards(""); }}>
          <Text style={[s.toggleBtnText, { color: touchback === true ? "#fff" : colors.mutedForeground }]}>Touchback</Text>
        </Pressable>
        <Pressable style={[s.toggleBtn, { flex: 1, backgroundColor: touchback === false ? colors.primary : colors.secondary, borderColor: touchback === false ? colors.primary : colors.border }]} onPress={() => { setTouchback(false); setTouchbackType(null); }}>
          <Text style={[s.toggleBtnText, { color: touchback === false ? "#fff" : colors.mutedForeground }]}>Returned</Text>
        </Pressable>
      </View>

      {touchback === true && (
        <>
          <Text style={s.label}>Touchback Type</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {(["endzone", "out_of_endzone"] as TouchbackType[]).map((t) => (
              <Pressable key={t} style={[s.toggleBtn, { flex: 1, backgroundColor: touchbackType === t ? colors.primary : colors.secondary, borderColor: touchbackType === t ? colors.primary : colors.border }]} onPress={() => setTouchbackType(t)}>
                <Text style={[s.toggleBtnText, { color: touchbackType === t ? "#fff" : colors.mutedForeground }]}>{t === "endzone" ? "Endzone" : "Out of Endzone"}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={s.label}>Landing Yard Line</Text>
      <TextInput style={s.input} value={landingYard} onChangeText={setLandingYard} keyboardType="numeric" maxLength={3} placeholder="—" placeholderTextColor={colors.mutedForeground} />

      {touchback === false && (
        <>
          <Text style={s.label}>Return Yards</Text>
          <TextInput style={s.input} value={returnYards} onChangeText={setReturnYards} keyboardType="numeric" maxLength={3} placeholder="—" placeholderTextColor={colors.mutedForeground} />
        </>
      )}

      <Pressable style={[s.saveBtn, { opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
        <Text style={s.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
      </Pressable>
      <Pressable style={s.cancelBtn} onPress={onClose}>
        <Text style={s.cancelBtnText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    label: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 0.8, textTransform: "uppercase" },
    input: { backgroundColor: colors.input, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" },
    toggleBtn: { paddingVertical: 11, borderRadius: 10, alignItems: "center", borderWidth: 1.5 },
    toggleBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
    chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: colors.primary },
    saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
    cancelBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    cancelBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
  });
}

export function EditKickModal({ kick, onClose }: Props) {
  const colors = useColors();

  if (!kick) return null;

  const kickTypeName =
    kick.kickType === "field_goal" ? "Field Goal" :
    kick.kickType === "punt" ? "Punt" : "Kickoff";

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%", borderTopWidth: 1, borderColor: colors.border },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
    title: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 16 },
  });

  const handleSave = () => onClose();

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={s.title}>Edit {kickTypeName}</Text>
          {kick.kickType === "field_goal" && <FieldGoalEditor kick={kick} onSave={handleSave} onClose={onClose} />}
          {kick.kickType === "punt" && <PuntEditor kick={kick} onSave={handleSave} onClose={onClose} />}
          {kick.kickType === "kickoff" && <KickoffEditor kick={kick} onSave={handleSave} onClose={onClose} />}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
