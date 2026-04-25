import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  DecodeSharePayloadResult,
  ShareableModule,
  decodeModuleSharePayload,
} from '../../services/OfflineModuleShareService';

interface OfflineModuleShareScannerProps {
  onModuleImported: (module: ShareableModule) => Promise<void>;
}

export const OfflineModuleShareScanner: React.FC<OfflineModuleShareScannerProps> = ({ onModuleImported }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isHandlingScan, setIsHandlingScan] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>('Point camera at a SikshaSync QR code.');

  const canScan = useMemo(() => permission?.granted === true && !isHandlingScan, [permission?.granted, isHandlingScan]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!canScan) {
      return;
    }

    setIsHandlingScan(true);

    const decoded: DecodeSharePayloadResult = decodeModuleSharePayload(data, {
      enforceTtl: true,
    });

    if (!decoded.ok || !decoded.module) {
      setScanMessage(decoded.reason ?? 'Invalid QR payload');
      setIsHandlingScan(false);
      return;
    }

    try {
      await onModuleImported(decoded.module);
      setScanMessage('Module imported successfully.');
    } catch (error) {
      console.error('Offline module import failed', error);
      setScanMessage('Module import failed. Please try again.');
    } finally {
      setTimeout(() => {
        setIsHandlingScan(false);
      }, 1200);
    }
  };

  if (!permission) {
    return <Text style={styles.infoText}>Loading camera permission...</Text>;
  }

  if (!permission.granted) {
    return (
      <View>
        <Text style={styles.infoText}>Camera access is required to scan QR codes.</Text>
        <Button mode="contained" buttonColor="#00FFCC" textColor="#0A0A0A" onPress={() => void requestPermission()}>
          Grant Camera Access
        </Button>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={canScan ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      </View>

      <Text style={styles.scanStatus}>{scanMessage}</Text>
      {isHandlingScan ? (
        <Button mode="outlined" textColor="#E9E9E9" onPress={() => setIsHandlingScan(false)}>
          Scan Next
        </Button>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  cameraWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginBottom: 10,
  },
  camera: {
    width: '100%',
    height: 260,
  },
  infoText: {
    color: '#C9C9C9',
    marginBottom: 10,
  },
  scanStatus: {
    color: '#B8B8B8',
    marginBottom: 10,
    fontSize: 12,
  },
});
