/**
 * Range calendar bottom sheet — check-in / check-out with nights chip.
 */
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SheetModal } from '@/features/requests/wizard/sheets/SheetModal';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type DateRangeSheetProps = {
  visible: boolean;
  checkIn: Date | null;
  checkOut: Date | null;
  onClose: () => void;
  onApply: (checkIn: Date, checkOut: Date | null) => void;
  /** `range` requires start+end; `single` confirms on one date. */
  mode?: 'range' | 'single';
  /** When true in range mode, end date is optional (Done with start only). */
  optionalEnd?: boolean;
  title?: string;
  footerHint?: string;
  nightsLabel?: boolean;
  /** How many months ahead to show (including current). */
  monthCount?: number;
};

function nightsBetween(a: Date | null, b: Date | null): number {
  if (!a || !b) return 0;
  return Math.max(0, differenceInCalendarDays(startOfDay(b), startOfDay(a)));
}

function MonthGrid({
  month,
  today,
  rangeStart,
  rangeEnd,
  onSelect,
}: {
  month: Date;
  today: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onSelect: (day: Date) => void;
}) {
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfMonth(month);
    const days: Date[] = [];
    let cursor = start;
    while (cursor <= end || days.length % 7 !== 0) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
      if (days.length > 42) break;
    }
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [month]);

  return (
    <View style={styles.monthBlock}>
      <Text style={styles.monthTitle}>{format(month, 'MMMM yyyy')}</Text>
      <View style={styles.dowRow}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.dow}>
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day) => {
            const dayStart = startOfDay(day);
            const inMonth = day.getMonth() === month.getMonth();
            const past = isBefore(dayStart, today);
            const disabled = !inMonth || past;
            const isStart = rangeStart ? isSameDay(dayStart, rangeStart) : false;
            const isEnd = rangeEnd ? isSameDay(dayStart, rangeEnd) : false;
            const inRange =
              rangeStart &&
              rangeEnd &&
              isWithinInterval(dayStart, { start: rangeStart, end: rangeEnd }) &&
              !isStart &&
              !isEnd;

            return (
              <Pressable
                key={`${month.getFullYear()}-${month.getMonth()}-${day.getDate()}-${inMonth ? 'in' : 'out'}`}
                disabled={disabled}
                onPress={() => onSelect(dayStart)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityState={{ disabled, selected: isStart || isEnd }}
                style={[
                  styles.dayCell,
                  inRange && styles.dayInRange,
                  (isStart || isEnd) && styles.dayEndpoint,
                  !inMonth && styles.dayOutside,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    disabled && styles.dayMuted,
                    (isStart || isEnd) && styles.dayEndpointText,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function DateRangeSheet({
  visible,
  checkIn,
  checkOut,
  onClose,
  onApply,
  mode = 'range',
  optionalEnd = false,
  title = 'Select Dates',
  footerHint = 'Check-in from 3:00 PM · Check-out until 12:00 PM',
  nightsLabel = true,
  monthCount = 12,
}: DateRangeSheetProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [start, setStart] = useState<Date | null>(checkIn);
  const [end, setEnd] = useState<Date | null>(checkOut);
  const openSyncKey = visible
    ? `open:${checkIn?.getTime() ?? 'x'}:${checkOut?.getTime() ?? 'x'}`
    : 'closed';
  const [syncedKey, setSyncedKey] = useState(openSyncKey);

  // Sync draft range when the sheet opens (adjust state during render — not an effect).
  if (syncedKey !== openSyncKey) {
    setSyncedKey(openSyncKey);
    if (visible) {
      setStart(checkIn ? startOfDay(checkIn) : null);
      setEnd(checkOut ? startOfDay(checkOut) : null);
    }
  }

  const months = useMemo(() => {
    const first = startOfMonth(today);
    const count = Math.min(Math.max(monthCount, 2), 18);
    return Array.from({ length: count }, (_, i) => addMonths(first, i));
  }, [monthCount, today]);
  const nights = nightsBetween(start, end);

  function onSelect(day: Date) {
    const d = startOfDay(day);
    if (mode === 'single') {
      setStart(d);
      setEnd(null);
      return;
    }
    if (!start || (start && end)) {
      setStart(d);
      setEnd(null);
      return;
    }
    if (isBefore(d, start) || isSameDay(d, start)) {
      setStart(d);
      setEnd(null);
      return;
    }
    setEnd(d);
  }

  const rangeLabel =
    mode === 'single'
      ? start
        ? format(start, 'EEE, d MMM yyyy')
        : 'Select a date'
      : start && end
        ? `${format(start, 'EEE, d MMM')} — ${format(end, 'EEE, d MMM')}`
        : start
          ? `${format(start, 'EEE, d MMM')} — Select check-out`
          : 'Select check-in and check-out';

  const canDone =
    mode === 'single' ? Boolean(start) : optionalEnd ? Boolean(start) : Boolean(start && end);

  const handleDone = () => {
    if (mode === 'single' && start) {
      onApply(start, null);
      return;
    }
    if (start && end) {
      onApply(start, end);
      return;
    }
    if (start && optionalEnd) {
      onApply(start, end);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      leftAction={{ label: 'Cancel', onPress: onClose }}
      rightAction={{
        label: 'Reset',
        onPress: () => {
          setStart(null);
          setEnd(null);
        },
      }}
      heightRatio={0.9}
      fillHeight
      contentStyle={styles.sheetBody}
      footer={
        <View style={styles.footer}>
          {footerHint ? <Text style={styles.footerHint}>{footerHint}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={!canDone}
            onPress={handleDone}
            style={[styles.doneBtn, !canDone && styles.doneDisabled]}
          >
            <Text style={styles.doneLabel}>
              {nightsLabel && nights > 0
                ? `Done (${nights} night${nights === 1 ? '' : 's'})`
                : 'Done'}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.rangeCard}>
        <Text style={styles.rangeEyebrow}>SELECTED RANGE</Text>
        <View style={styles.rangeRow}>
          <Text style={styles.rangeValue}>{rangeLabel}</Text>
          {nights > 0 ? (
            <View style={styles.nightsChip}>
              <Text style={styles.nightsChipText}>
                {nights} night{nights === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.calScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.calScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {months.map((m) => (
          <MonthGrid
            key={`${m.getFullYear()}-${m.getMonth()}`}
            month={m}
            today={today}
            rangeStart={start}
            rangeEnd={end}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    flex: 1,
    minHeight: 0,
  },
  rangeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  rangeEyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.muted,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rangeValue: {
    flex: 1,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
  },
  nightsChip: {
    backgroundColor: colors.sand,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nightsChipText: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    color: colors.forest,
  },
  calScroll: {
    flex: 1,
    minHeight: 0,
  },
  calScrollContent: {
    paddingBottom: 16,
    gap: 18,
  },
  monthBlock: {
    gap: 8,
  },
  monthTitle: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 22,
    color: colors.forest,
  },
  dowRow: {
    flexDirection: 'row',
  },
  dow: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    color: colors.muted,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 44,
  },
  dayInRange: {
    backgroundColor: colors.surface,
  },
  dayEndpoint: {
    backgroundColor: colors.forest,
    borderRadius: 22,
  },
  dayOutside: {
    opacity: 0.35,
  },
  dayText: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.forest,
  },
  dayMuted: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  dayEndpointText: {
    color: colors.sand,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  footerHint: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    color: colors.muted,
  },
  doneBtn: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneDisabled: {
    opacity: 0.4,
  },
  doneLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 16,
    color: colors.sand,
  },
});
