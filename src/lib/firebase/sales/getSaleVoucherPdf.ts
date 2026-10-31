/**
 * Trip voucher PDF URL from Instant Sale (`confirmationDoc`).
 * Same for hotel / air / yacht / VIP / any service.
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, Linking } from 'react-native';

import { mapDocumentFileErrorToMessage } from '@/lib/firebase/documents/mapDocumentsLoadError';
import { db } from '@/lib/firebase/firestore';

export type SaleVoucherPdf = {
  voucherUrl: string | null;
  confirmationNo: string | null;
  serviceName: string | null;
};

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

/**
 * Load CRM-uploaded voucher / confirmation PDF URL for one sale.
 */
export async function getSaleVoucherPdf(
  adminId: string,
  clientId: string,
  saleId: string,
): Promise<SaleVoucherPdf> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();

  if (!aid || !cid || !sid) {
    return { voucherUrl: null, confirmationNo: null, serviceName: null };
  }

  const ref = doc(db, 'admins', aid, 'clients', cid, 'sales', sid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { voucherUrl: null, confirmationNo: null, serviceName: null };
  }

  const data = snap.data();
  const serviceList0 =
    Array.isArray(data.serviceModelList) && data.serviceModelList[0]
      ? (data.serviceModelList[0] as { serviceName?: unknown })
      : null;

  return {
    voucherUrl: readString(data.confirmationDoc),
    confirmationNo: readString(data.confirmationNo),
    serviceName: readString(data.serviceName) || readString(serviceList0?.serviceName),
  };
}

/** Open voucher PDF URL in the system browser / viewer. */
export async function openSaleVoucherPdf(voucherUrl: string): Promise<void> {
  const url = voucherUrl.trim();
  if (!url) {
    Alert.alert('Document', 'This file isn’t available.');
    return;
  }

  try {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('Document', 'Couldn’t open this file. Please try again.');
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error('[openSaleVoucherPdf]', error);
    Alert.alert('Document', mapDocumentFileErrorToMessage(error, 'open'));
  }
}

function safeFileStem(label: string): string {
  const stem = label
    .trim()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return stem.length ? stem : 'trip-voucher';
}

/** Download voucher PDF then open the native share sheet. */
export async function downloadSaleVoucherPdf(
  voucherUrl: string,
  fileLabel = 'trip-voucher',
): Promise<void> {
  const url = voucherUrl.trim();
  if (!url) {
    Alert.alert('Document', 'This file isn’t available.');
    return;
  }

  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) {
    Alert.alert('Document', 'Couldn’t download this file. Please try again.');
    return;
  }

  try {
    const dest = `${base}${safeFileStem(fileLabel)}.pdf`;
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
      mimeType: 'application/pdf',
      dialogTitle: 'Save document',
      UTI: 'com.adobe.pdf',
    });
  } catch (error) {
    console.error('[downloadSaleVoucherPdf]', error);
    Alert.alert('Document', mapDocumentFileErrorToMessage(error, 'download'));
  }
}
