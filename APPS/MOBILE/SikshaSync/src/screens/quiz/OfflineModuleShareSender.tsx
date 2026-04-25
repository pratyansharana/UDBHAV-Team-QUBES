import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import {
  EncodeSharePayloadResult,
  ShareableModule,
  encodeModuleSharePayload,
  getSingleQrPayloadLimit,
} from '../../services/OfflineModuleShareService';

interface OfflineModuleShareSenderProps {
  module: ShareableModule;
}

const formatBytes = (bytes: number): string => `${bytes.toLocaleString()} B`;

export const OfflineModuleShareSender: React.FC<OfflineModuleShareSenderProps> = ({ module }) => {
  const result = useMemo<EncodeSharePayloadResult>(() => {
    return encodeModuleSharePayload(module, {
      maxQrPayloadBytes: getSingleQrPayloadLimit(),
    });
  }, [module]);

  return (
    <View>
      <View style={styles.qrCard}>
        {result.fitsSingleQr ? (
          <QRCode value={result.payload} size={200} backgroundColor="#FFFFFF" color="#0A0A0A" />
        ) : (
          <View style={styles.tooLargeState}>
            <Text style={styles.tooLargeTitle}>Payload too large for one QR</Text>
            <Text style={styles.tooLargeText}>
              Reduce content length or split into multi-part QR sequence.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Raw JSON</Text>
        <Text style={styles.metaValue}>{formatBytes(result.rawJsonSizeBytes)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Compressed</Text>
        <Text style={styles.metaValue}>{formatBytes(result.compressedSizeBytes)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>QR Payload</Text>
        <Text style={styles.metaValue}>{formatBytes(result.qrPayloadSizeBytes)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Limit</Text>
        <Text style={styles.metaValue}>{formatBytes(result.maxQrPayloadBytes)}</Text>
      </View>

      {!result.fitsSingleQr ? (
        <Text style={styles.warningText}>
          This module cannot be shared in a single QR. Use chunking with sequence IDs.
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  qrCard: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  tooLargeState: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tooLargeTitle: {
    color: '#8B1D1D',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  tooLargeText: {
    color: '#6A6A6A',
    textAlign: 'center',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    color: '#AFAFAF',
    fontSize: 12,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  warningText: {
    marginTop: 10,
    color: '#FFC785',
    fontSize: 12,
  },
});
