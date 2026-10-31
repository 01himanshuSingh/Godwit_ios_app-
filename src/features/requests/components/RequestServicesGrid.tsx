/**
 * Fixed 2-column × 4-row category card grid (8 services).
 * Calculates explicit cardWidth so every tile renders as its own card on iOS/Android.
 */
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { RequestServiceCard } from '@/features/requests/components/RequestServiceCard';
import { REQUEST_SERVICES, type RequestService } from '@/features/requests/data/requestServices';

type RequestServicesGridProps = {
  onSelectService?: (service: RequestService) => void;
};

const COLUMNS = 2;
const ROWS = 4;

function layoutMetrics(windowWidth: number) {
  const pagePad = windowWidth < 360 ? 16 : windowWidth < 768 ? 24 : 40;
  const gap = windowWidth < 360 ? 10 : windowWidth < 768 ? 12 : 14;
  const containerMaxWidth = Math.min(windowWidth, windowWidth >= 768 ? 680 : windowWidth);
  const availableWidth = Math.max(containerMaxWidth - pagePad * 2, 200);
  const cardWidth = Math.floor((availableWidth - gap) / COLUMNS);

  return { gap, cardWidth };
}

export function RequestServicesGrid({ onSelectService }: RequestServicesGridProps) {
  const { width } = useWindowDimensions();
  const { gap, cardWidth } = useMemo(() => layoutMetrics(width), [width]);

  const rows = useMemo(() => {
    const services = REQUEST_SERVICES.slice(0, COLUMNS * ROWS);
    const out: RequestService[][] = [];
    for (let i = 0; i < services.length; i += COLUMNS) {
      out.push(services.slice(i, i + COLUMNS));
    }
    return out;
  }, []);

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View
          key={row.map((s) => s.id).join('-')}
          style={[styles.row, rowIndex < rows.length - 1 ? { marginBottom: gap } : null]}
        >
          {row.map((service, colIndex) => (
            <View key={service.id} style={colIndex === 0 ? { marginRight: gap } : null}>
              <RequestServiceCard
                service={service}
                cardWidth={cardWidth}
                onPress={onSelectService}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
