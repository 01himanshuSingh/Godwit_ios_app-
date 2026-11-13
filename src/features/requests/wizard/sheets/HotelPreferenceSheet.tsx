/**
 * Preferred hotel brand picker — cursor-paginated CRM catalog + prefix search.
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
import {
  getHotelBrandsPage,
  HOTEL_BRANDS_PAGE_SIZE,
  type HotelBrand,
} from '@/lib/firebase/masterData';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type HotelPreferenceSheetProps = {
  visible: boolean;
  value: string;
  valueBrandId?: string | null;
  onClose: () => void;
  onSelect: (next: { name: string; brandId: string | null }) => void;
};

export function HotelPreferenceSheet({
  visible,
  value,
  valueBrandId,
  onClose,
  onSelect,
}: HotelPreferenceSheetProps) {
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

  const brandsQuery = useInfiniteQuery({
    queryKey: ['masterData', 'hotelBrands', 'page', debounced],
    enabled: visible,
    initialPageParam: null as Awaited<ReturnType<typeof getHotelBrandsPage>>['nextCursor'],
    queryFn: ({ pageParam }) =>
      getHotelBrandsPage({
        pageSize: HOTEL_BRANDS_PAGE_SIZE,
        cursor: pageParam,
        namePrefix: debounced.length >= 1 ? debounced : undefined,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });

  const brands = useMemo(() => {
    const merged = brandsQuery.data?.pages.flatMap((p) => p.brands) ?? [];
    const byId = new Map<string, HotelBrand>();
    for (const brand of merged) byId.set(brand.brandId, brand);
    return [...byId.values()];
  }, [brandsQuery.data]);

  const onEndReached = () => {
    if (brandsQuery.hasNextPage && !brandsQuery.isFetchingNextPage) {
      void brandsQuery.fetchNextPage();
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Preferred hotel"
      leftAction={{ label: 'Cancel', onPress: onClose }}
      heightRatio={0.78}
      contentStyle={styles.sheetBody}
    >
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search brands"
          placeholderTextColor="#B5B1A8"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="words"
          accessibilityLabel="Search hotel brands"
        />
      </View>

      <FlatList
        style={styles.list}
        data={brands}
        keyExtractor={(item) => item.brandId}
        keyboardShouldPersistTaps="handled"
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <Pressable
            style={styles.row}
            onPress={() => {
              onSelect({ name: '', brandId: null });
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
          brandsQuery.isPending ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : (
            <Text style={styles.empty}>
              {brandsQuery.isError
                ? 'Could not load hotel brands.'
                : debounced
                  ? 'No brands match that search.'
                  : 'No hotel brands in catalog yet.'}
            </Text>
          )
        }
        ListFooterComponent={
          brandsQuery.isFetchingNextPage ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : undefined
        }
        renderItem={({ item }) => {
          const selected = valueBrandId === item.brandId || (!valueBrandId && value === item.name);
          return (
            <Pressable
              style={styles.row}
              onPress={() => {
                onSelect({ name: item.name, brandId: item.brandId });
                onClose();
              }}
            >
              <View style={[styles.mono, selected && styles.monoSelected]}>
                <Text style={[styles.monoText, selected && styles.monoTextSelected]}>
                  {item.monogram}
                </Text>
              </View>
              <Text style={styles.rowLabel}>{item.name}</Text>
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
  rowLabel: {
    flex: 1,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
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
