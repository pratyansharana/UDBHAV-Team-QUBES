import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import modulesData from '../data/subjectModules.json';

type Question = {
  id: string;
};

type ModuleItem = {
  id: string;
  title: string;
  summary: string;
  detailedContent: string;
  estimatedMinutes: number;
  questions: Question[];
  subjectName: string;
};

type Subject = {
  name: string;
  modules: Omit<ModuleItem, 'subjectName'>[];
};

type ModulesPayload = {
  subjects: Subject[];
};

const parsedModules = modulesData as ModulesPayload;

export const ModulesScreen: React.FC = () => {
  const [loadingModuleId, setLoadingModuleId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [shareModule, setShareModule] = useState<ModuleItem | null>(null);

  const modules = useMemo<ModuleItem[]>(
    () =>
      parsedModules.subjects.flatMap((subject) =>
        subject.modules.map((module) => ({
          ...module,
          subjectName: subject.name,
        }))
      ),
    []
  );

  const handleOpenModule = (module: ModuleItem) => {
    if (loadingModuleId) {
      return;
    }

    setLoadingModuleId(module.id);

    // Simulate background processing/navigation for large module payloads.
    setTimeout(() => {
      setSelectedModuleId(module.id);
      setLoadingModuleId(null);
    }, 700);
  };

  const handleOpenShareModal = (module: ModuleItem) => {
    setShareModule(module);
    setIsQrModalVisible(true);
  };

  const handleCloseShareModal = () => {
    setIsQrModalVisible(false);
    setShareModule(null);
  };

  const qrPayload = shareModule
    ? JSON.stringify({
        action: 'share_module',
        id: shareModule.id,
        title: shareModule.title,
      })
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text variant="headlineSmall" style={styles.heading}>
            Modules
          </Text>
          <Text style={styles.subHeading}>Tap a module to open. Share via offline QR.</Text>
        </View>

        {modules.map((module) => {
          const isLoading = loadingModuleId === module.id;
          const isSelected = selectedModuleId === module.id;

          return (
            <Card key={module.id} style={[styles.card, isSelected ? styles.cardSelected : null]}>
              <Card.Content>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTitleGroup}>
                    <Text variant="titleMedium" style={styles.cardTitle}>
                      {module.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {module.subjectName} • {module.questions.length} questions • {module.estimatedMinutes} min
                    </Text>
                  </View>

                  <IconButton
                    icon="qrcode"
                    size={20}
                    mode="contained-tonal"
                    style={styles.shareButton}
                    iconColor="#0A0A0A"
                    containerColor="#00FFCC"
                    onPress={() => handleOpenShareModal(module)}
                    accessibilityLabel="Offline Share"
                  />
                </View>

                <Text style={styles.summary} numberOfLines={2}>
                  {module.summary}
                </Text>

                <TouchableOpacity
                  style={[styles.openButton, isLoading ? styles.openButtonLoading : null]}
                  onPress={() => handleOpenModule(module)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingInlineRow}>
                      <ActivityIndicator size="small" color="#0A0A0A" />
                      <Text style={styles.openButtonText}>Opening...</Text>
                    </View>
                  ) : (
                    <Text style={styles.openButtonText}>Open Module</Text>
                  )}
                </TouchableOpacity>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      <Portal>
        <Dialog visible={isQrModalVisible} onDismiss={handleCloseShareModal} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Offline Share</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Scan this QR from another SikshaSync device to import the module metadata.
            </Text>

            <View style={styles.qrWhitePad}>
              {qrPayload ? <QRCode value={qrPayload} size={200} /> : null}
            </View>

            {shareModule ? (
              <Text style={styles.dialogModuleTitle}>{shareModule.title}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="contained" buttonColor="#00FFCC" textColor="#0A0A0A" onPress={handleCloseShareModal}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  headerRow: {
    marginBottom: 12,
  },
  heading: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subHeading: {
    color: '#8E8E8E',
    marginTop: 4,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#171717',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#252525',
  },
  cardSelected: {
    borderColor: '#00FFCC',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardMeta: {
    color: '#8C8C8C',
    marginTop: 4,
    fontSize: 12,
  },
  shareButton: {
    margin: 0,
  },
  summary: {
    color: '#C8C8C8',
    marginTop: 10,
    marginBottom: 12,
  },
  openButton: {
    backgroundColor: '#00FFCC',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonLoading: {
    opacity: 0.9,
  },
  openButtonText: {
    color: '#0A0A0A',
    fontWeight: '700',
  },
  loadingInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialog: {
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#303030',
  },
  dialogTitle: {
    color: '#FFFFFF',
  },
  dialogText: {
    color: '#C2C2C2',
    marginBottom: 12,
  },
  qrWhitePad: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
  },
  dialogModuleTitle: {
    marginTop: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
