/**
 * Preferred airline picker — cursor-paginated CRM catalog + prefix search.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SheetModal } from '@/features/requests/wizard/sheets/SheetModal';
import { getAirlinesPage, AIRLINES_PAGE_SIZE, type Airline } from '@/lib/firebase/masterData';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type AirlineSelection = {
  label: string;
  airlineId: string | null;
  code: string | null;
  cabinClasses: string[];
};

type AirlinePreferenceSheetProps = {
  visible: boolean;
  value: string;
  valueAirlineId?: string | null;
  onClose: () => void;
  onSelect: (next: AirlineSelection) => void;
};

export function AirlinePreferenceSheet({
  visible,
  value,
  valueAirlineId,
  onClose,
  onSelect,
}: AirlinePreferenceSheetProps) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);

  // Reset search when the sheet closes (adjust state during render — not an effect).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (!visible && (search || debounced)) {
      setSearch('');
      setDebounced('');
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 280);
    return () => clearTimeout(t);
  }, [search]);

  const airlinesQuery = useInfiniteQuery({
    queryKey: ['masterData', 'airlines', 'page', debounced],
    enabled: visible,
    initialPageParam: null as Awaited<ReturnType<typeof getAirlinesPage>>['nextCursor'],
    queryFn: ({ pageParam }) =>
      getAirlinesPage({
        pageSize: AIRLINES_PAGE_SIZE,
        cursor: pageParam,
        namePrefix: debounced.length >= 1 ? debounced : undefined,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });

  const airlines = useMemo(() => {
    const merged = airlinesQuery.data?.pages.flatMap((p) => p.airlines) ?? [];
    const byId = new Map<string, Airline>();
    for (const airline of merged) byId.set(airline.airlineId, airline);
    return [...byId.values()];
  }, [airlinesQuery.data]);

  const onEndReached = () => {
    if (airlinesQuery.hasNextPage && !airlinesQuery.isFetchingNextPage) {
      void airlinesQuery.fetchNextPage();
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Preferred airline"
      leftAction={{ label: 'Cancel', onPress: onClose }}
      heightRatio={0.78}
      fillHeight
      contentStyle={styles.sheetBody}
    >
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search airlines"
          placeholderTextColor="#B5B1A8"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="words"
          accessibilityLabel="Search airlines"
        />
      </View>

      <FlatList
        style={styles.list}
        data={airlines}
        keyExtractor={(item) => item.airlineId}
        keyboardShouldPersistTaps="handled"
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <Pressable
            style={styles.row}
            onPress={() => {
              onSelect({ label: '', airlineId: null, code: null, cabinClasses: [] });
              onClose();
            }}
          >
            <View style={[styles.mono, !value && styles.monoSelected]}>
              <Text style={[styles.monoText, !value && styles.monoTextSelected]}>—</Text>
            </View>
            <Text style={styles.rowLabel}>No preference</Text>
          </Pressable>
        }
        ListEmptyComponent={
          airlinesQuery.isPending ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <Text style={styles.empty}>
              {airlinesQuery.isError
                ? 'Could not load airlines.'
                : debounced
                  ? 'No airlines match that search.'
                  : 'No airlines in catalog yet.'}
            </Text>
          )
        }
        ListFooterComponent={
          airlinesQuery.isFetchingNextPage ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : undefined
        }
        renderItem={({ item }) => {
          const selected =
            valueAirlineId === item.airlineId ||
            (!valueAirlineId && (value === item.label || value === item.name));
          return (
            <Pressable
              style={styles.row}
              onPress={() => {
                onSelect({
                  label: item.label,
                  airlineId: item.airlineId,
                  code: item.code || null,
                  cabinClasses: item.cabinClasses,
                });
                onClose();
              }}
            >
              <View style={[styles.mono, selected && styles.monoSelected]}>
                <Text style={[styles.monoText, selected && styles.monoTextSelected]}>
                  {item.monogram}
                </Text>
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowLabel}>{item.name}</Text>
                {item.code ? <Text style={styles.rowMeta}>{item.code}</Text> : null}
              </View>
            </Pressable>
          );
        }}
      />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    flex: 1,
    minHeight: 320,
  },
  list: {
    flex: 1,
  },
  searchWrap: {
    marginBottom: 8,
  },
  searchInput: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    color: colors.forest,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 48,
  },
  mono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monoSelected: {
    backgroundColor: colors.forest,
  },
  monoText: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    color: colors.forest,
  },
  monoTextSelected: {
    color: colors.sand,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
  },
  rowMeta: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    color: colors.muted,
  },
  loader: {
    marginVertical: 16,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
});
