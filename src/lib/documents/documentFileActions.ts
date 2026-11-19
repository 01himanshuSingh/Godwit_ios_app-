/**
 * Document open / download — single facade for vouchers, personal docs, invoices.
 *
 * Architecture:
 *   View     → in-memory session + `/document-viewer` (Godwit chrome)
 *   Fallback → in-app browser sheet (SFSafariView / Custom Tabs)
 *   Last     → system Linking
 *   Download → cache directory + native share / save sheet
 *
 * Never put signed Storage URLs into route query strings (`&` corrupts params).
 */
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

import {
  documentFileExtensionFromUrl,
  documentFileKindFromUrl,
  documentMimeType,
  documentUti,
} from '@/lib/documents/documentFileKinds';
import { createDocumentViewerSession } from '@/lib/documents/documentViewerSession';
import { mapDocumentFileErrorToMessage } from '@/lib/firebase/documents/mapDocumentsLoadError';

/** HTTPS only — blocks javascript:/data:/file: handoff. */
function assertHttpsUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https:\/\//i.test(trimmed)) return null;
  try {
    void new URL(trimmed);
  } catch {
    return null;
  }
  return trimmed;
}

function safeFileStem(label: string): string {
  const stem = label
    .trim()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return stem.length ? stem : 'godwit-document';
}

/**
 * Open a document inside Godwit (stack viewer).
 * Falls back to in-app browser sheet if navigation is unavailable.
 */
export async function openDocumentInApp(documentUrl: string, title = 'Document'): Promise<void> {
  const url = assertHttpsUrl(documentUrl);
  if (!url) {
    Alert.alert('Document', 'This file isn’t available.');
    return;
  }

  const label = title.trim() || 'Document';
  const id = createDocumentViewerSession(url, label);

  try {
    router.push({
      pathname: '/document-viewer',
      params: { id },
    });
  } catch (error) {
    console.error('[openDocumentInApp] navigate', error);
    await openDocumentInBrowserSheet(url);
  }
}

/** SFSafariViewController / Chrome Custom Tabs — still in-app, no full leave. */
export async function openDocumentInBrowserSheet(documentUrl: string): Promise<void> {
  const url = assertHttpsUrl(documentUrl);
  if (!url) {
    Alert.alert('Document', 'This file isn’t available.');
    return;
  }

  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: '#1B2915',
      toolbarColor: '#EDECEA',
      secondaryToolbarColor: '#EDECEA',
      enableDefaultShareMenuItem: true,
      showTitle: true,
    });
  } catch (error) {
    console.error('[openDocumentInBrowserSheet]', error);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // fall through
    }
    Alert.alert('Document', mapDocumentFileErrorToMessage(error, 'open'));
  }
}

/**
 * Android WebView often cannot render PDFs natively.
 * Use Google’s embedded viewer when the Storage URL is reachable.
 */
export function documentViewerSourceUri(documentUrl: string): string {
  const url = documentUrl.trim();
  const kind = documentFileKindFromUrl(url);
  if (kind === 'pdf' && Platform.OS === 'android') {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  }
  return url;
}

/** Download to cache, then open the native share / save sheet. */
export async function downloadDocumentFile(
  documentUrl: string,
  fileLabel = 'godwit-document',
): Promise<void> {
  const url = assertHttpsUrl(documentUrl);
  if (!url) {
    Alert.alert('Document', 'This file isn’t available.');
    return;
  }

  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) {
    Alert.alert('Document', 'Couldn’t download this file. Please try again.');
    return;
  }

  const kind = documentFileKindFromUrl(url);
  const ext = documentFileExtensionFromUrl(url, kind);
  const mime = documentMimeType(kind, url);
  const uti = documentUti(kind);

  try {
    const dest = `${base}${safeFileStem(fileLabel)}.${ext}`;
    const result = await FileSystem.downloadAsync(url, dest);
    if (result.status === 403 || result.status === 401) {
      Alert.alert('Document', 'This file isn’t available to open.');
      return;
    }
    if (result.status !== 200) {
      Alert.alert('Document', 'Couldn’t download this file. Please try again.');
      return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Download saved', 'File saved on this device.');
      return;
    }

    await Sharing.shareAsync(result.uri, {
      mimeType: mime,
      dialogTitle: 'Save document',
      ...(uti ? { UTI: uti } : null),
    });
  } catch (error) {
    console.error('[downloadDocumentFile]', error);
    Alert.alert('Document', mapDocumentFileErrorToMessage(error, 'download'));
  }
}
