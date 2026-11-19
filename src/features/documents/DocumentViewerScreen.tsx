/**
 * In-app document viewer — Godwit chrome, kind-aware body, download action.
 * Opened via `openDocumentInApp` (session id), not raw Storage URLs in the route.
 */
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import {
  documentViewerSourceUri,
  downloadDocumentFile,
  openDocumentInBrowserSheet,
} from '@/lib/documents/documentFileActions';
import { documentFileKindFromUrl } from '@/lib/documents/documentFileKinds';
import { getDocumentViewerSession } from '@/lib/documents/documentViewerSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function DocumentViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string; url?: string; title?: string }>();

  const sessionId = firstParam(params.id).trim();
  const legacyUrl = firstParam(params.url).trim();
  const legacyTitle = firstParam(params.title).trim();

  const session = useMemo(() => {
    if (sessionId) return getDocumentViewerSession(sessionId);
    if (legacyUrl) {
      return {
        url: legacyUrl,
        title: legacyTitle || 'Document',
        createdAt: 0,
      };
    }
    return null;
  }, [legacyTitle, legacyUrl, sessionId]);

  const url = session?.url?.trim() ?? '';
  const title = session?.title?.trim() || 'Document';
  const pagePad = width < 360 ? 16 : 24;

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const kind = useMemo(() => documentFileKindFromUrl(url), [url]);
  const viewerUri = useMemo(() => (url ? documentViewerSourceUri(url) : ''), [url]);
  const useNativeImage = kind === 'image';
  const useWebPreview = kind === 'pdf' || kind === 'other';

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, [router]);

  const onDownload = useCallback(async () => {
    if (!url || downloading) return;
    setDownloading(true);
    try {
      await downloadDocumentFile(url, title);
    } finally {
      setDownloading(false);
    }
  }, [downloading, title, url]);

  const onOpenSheet = useCallback(() => {
    if (!url) return;
    void openDocumentInBrowserSheet(url);
  }, [url]);

  const topPad = { paddingTop: insets.top };
  const bottomPad = { paddingBottom: Math.max(insets.bottom, 8) };

  if (!url) {
    return (
      <View style={[styles.root, topPad, bottomPad]}>
        <View style={[styles.topBar, { paddingHorizontal: pagePad }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack}>
            <View style={styles.backRow}>
              <Feather name="chevron-left" size={20} color={colors.muted} />
              <Text style={styles.backLabel}>Back</Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Document unavailable</Text>
          <Text style={styles.emptyBody}>This file doesn’t have a valid link.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, topPad, bottomPad]}>
      <View style={[styles.topBar, { paddingHorizontal: pagePad }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={8}
          style={styles.backPressable}
        >
          <View style={styles.backRow}>
            <Feather name="chevron-left" size={20} color={colors.muted} />
            <Text style={styles.backLabel} numberOfLines={1}>
              Back
            </Text>
          </View>
        </Pressable>

        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open in browser sheet"
            onPress={onOpenSheet}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Feather name="external-link" size={18} color={colors.forest} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download document"
            onPress={() => void onDownload()}
            disabled={downloading}
            hitSlop={8}
            style={styles.iconBtn}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.forest} />
            ) : (
              <Feather name="download" size={18} color={colors.forest} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.viewer}>
        {kind === 'pkpass' ? (
          <View style={styles.empty}>
            <Feather name="smartphone" size={28} color={colors.forest} />
            <Text style={styles.emptyTitle}>Pass file</Text>
            <Text style={styles.emptyBody}>
              Wallet passes can’t preview here. Download to add them on this device.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void onDownload()}
              disabled={downloading}
              style={styles.fallbackBtn}
            >
              <Text style={styles.fallbackLabel}>
                {downloading ? 'Downloading…' : 'Download pass'}
              </Text>
            </Pressable>
          </View>
        ) : failed ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Couldn’t preview</Text>
            <Text style={styles.emptyBody}>
              {kind === 'pdf'
                ? 'This PDF couldn’t be shown here. Open it in the browser sheet or download it.'
                : 'This file couldn’t be shown here. Try download or open in browser sheet.'}
            </Text>
            <Pressable accessibilityRole="button" onPress={onOpenSheet} style={styles.fallbackBtn}>
              <Text style={styles.fallbackLabel}>Open in browser</Text>
            </Pressable>
          </View>
        ) : useNativeImage ? (
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: url }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel={title}
              onLoadStart={() => {
                setLoading(true);
                setFailed(false);
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />
            {loading ? (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator color={colors.forest} />
              </View>
            ) : null}
          </View>
        ) : useWebPreview ? (
          <>
            <WebView
              source={{ uri: viewerUri }}
              style={styles.web}
              onLoadStart={() => {
                setLoading(true);
                setFailed(false);
              }}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              onHttpError={() => {
                setLoading(false);
                setFailed(true);
              }}
              startInLoadingState
              allowsFullscreenVideo={false}
              setSupportMultipleWindows={false}
              originWhitelist={['https://*']}
              javaScriptEnabled={kind === 'pdf'}
              domStorageEnabled={kind === 'pdf'}
            />
            {loading ? (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator color={colors.forest} />
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Preview unavailable</Text>
            <Text style={styles.emptyBody}>
              Download this file or open it in the browser sheet.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void onDownload()}
              style={styles.fallbackBtn}
            >
              <Text style={styles.fallbackLabel}>Download</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.headerBorder,
  },
  backPressable: {
    flexShrink: 0,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.muted,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.forest,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  web: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  imageWrap: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 236, 234, 0.55)',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 22,
    color: colors.forest,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 300,
  },
  fallbackBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.forest,
  },
  fallbackLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 13,
    color: colors.primaryForeground,
  },
});
