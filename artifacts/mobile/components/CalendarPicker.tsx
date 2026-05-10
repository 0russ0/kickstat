import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Returns today's date string in Eastern Time (YYYY-MM-DD) */
export function todayEastern(): string {
  const now = new Date();
  // Determine Eastern offset: EST = -5, EDT = -4
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const stdOff = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDST = now.getTimezoneOffset() < stdOff;
  const etOffsetHrs = isDST ? -4 : -5;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const etDate = new Date(utcMs + etOffsetHrs * 3600000);
  const y = etDate.getFullYear();
  const m = String(etDate.getMonth() + 1).padStart(2, "0");
  const d = String(etDate.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format YYYY-MM-DD to human readable "Mon DD, YYYY" */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
  maxDate?: string; // YYYY-MM-DD, defaults to today Eastern
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function CalendarPicker({ visible, value, onSelect, onClose, maxDate }: Props) {
  const colors = useColors();
  const today = todayEastern();
  const cap = maxDate ?? today;

  const parseDate = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  };

  const sel = parseDate(value || today);
  const capParsed = parseDate(cap);

  const [viewYear, setViewYear] = useState(sel.year);
  const [viewMonth, setViewMonth] = useState(sel.month);

  const canGoNext = viewYear < capParsed.year || (viewYear === capParsed.year && viewMonth < capParsed.month);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const numDays = daysInMonth(viewYear, viewMonth);
  const startDow = firstDayOfWeek(viewYear, viewMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);

  const isSelected = (d: number) => viewYear === sel.year && viewMonth === sel.month && d === sel.day;
  const isFuture = (d: number) => {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return ds > cap;
  };
  const isToday = (d: number) => {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return ds === today;
  };

  const handleSelect = (d: number) => {
    if (isFuture(d)) return;
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    onSelect(ds);
    onClose();
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
    sheet: { backgroundColor: colors.card, borderRadius: 18, padding: 20, width: 320, borderWidth: 1, borderColor: colors.border },
    nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    navBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.secondary },
    monthLabel: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground },
    dayHeader: { flexDirection: "row", marginBottom: 6 },
    dayHeaderCell: { flex: 1, alignItems: "center" },
    dayHeaderText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
    dayBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    dayText: { fontSize: 14, fontFamily: "Inter_500Medium" },
    todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 1 },
    cancelRow: { marginTop: 12, alignItems: "center" },
    cancelText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.nav}>
            <Pressable style={s.navBtn} onPress={prevMonth}>
              <Feather name="chevron-left" size={18} color={colors.foreground} />
            </Pressable>
            <Text style={s.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <Pressable style={[s.navBtn, !canGoNext && { opacity: 0.3 }]} onPress={nextMonth} disabled={!canGoNext}>
              <Feather name="chevron-right" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={s.dayHeader}>
            {DAY_NAMES.map((name) => (
              <View key={name} style={s.dayHeaderCell}>
                <Text style={s.dayHeaderText}>{name}</Text>
              </View>
            ))}
          </View>

          <View style={s.grid}>
            {cells.map((d, i) => (
              <View key={i} style={s.cell}>
                {d !== null && (
                  <Pressable
                    style={[
                      s.dayBtn,
                      isSelected(d) && { backgroundColor: colors.primary },
                      !isSelected(d) && isToday(d) && { backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: colors.primary },
                    ]}
                    onPress={() => handleSelect(d)}
                    disabled={isFuture(d)}
                  >
                    <Text style={[
                      s.dayText,
                      { color: isFuture(d) ? colors.muted : isSelected(d) ? "#fff" : colors.foreground },
                    ]}>
                      {d}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          <Pressable style={s.cancelRow} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
