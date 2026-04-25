import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, RadioButton, ProgressBar, Chip, ActivityIndicator, TextInput, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  addGeneratedModuleOffline,
  downloadMoreModulesOffline,
  generateOfflineQuizForModule,
  getCurrentQuizSyncStatus,
  getAllAvailableModules,
  OfflineQuizQuestion,
  QuizSyncStatus,
  runQuizSyncNow,
  saveQuizAttemptOffline,
} from '../services/Quiz';
import { generateLearningModuleWithGemini } from '../services/Chatbot';

export const QuizScreen: React.FC = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isDownloadingModules, setIsDownloadingModules] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [allModules, setAllModules] = useState<Array<{
    id: string;
    title: string;
    summary: string;
    detailedContent: string;
    learningOutcomes: string[];
    estimatedMinutes: number;
    questions: Array<{ id: string }>;
    subjectId: string;
    subjectName: string;
  }>>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(5);
  const [questions, setQuestions] = useState<OfflineQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [hasQuizStarted, setHasQuizStarted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<QuizSyncStatus>('syncing');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerateDialogVisible, setIsGenerateDialogVisible] = useState(false);
  const [newModulePrompt, setNewModulePrompt] = useState('');
  const [isGeneratingModule, setIsGeneratingModule] = useState(false);

  const BOOTSTRAP_TIMEOUT_MS = 5000;

  const selectedModule = useMemo(
    () => allModules.find((module) => module.id === selectedModuleId),
    [allModules, selectedModuleId]
  );

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return allModules;
    }

    return allModules
      .filter((module) => {
        const searchableText = `${module.title} ${module.summary} ${module.subjectName}`.toLowerCase();
        return searchableText.includes(query);
      })
      .sort((first, second) => {
        const firstTitleMatch = first.title.toLowerCase().startsWith(query) ? 1 : 0;
        const secondTitleMatch = second.title.toLowerCase().startsWith(query) ? 1 : 0;
        return secondTitleMatch - firstTitleMatch;
      });
  }, [allModules, searchQuery]);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswerIndex = currentQuestion ? answersByQuestionId[currentQuestion.id] : undefined;

  useEffect(() => {
    const refreshSyncStatusInBackground = () => {
      void runQuizSyncNow()
        .then((status) => {
          setSyncStatus(status);
        })
        .catch(async () => {
          const status = await getCurrentQuizSyncStatus();
          setSyncStatus(status);
        });
    };

    const initialize = async () => {
      setIsBootstrapping(true);
      setScreenError(null);
      try {
        const modules = await Promise.race([
          getAllAvailableModules(),
          new Promise<typeof allModules>((resolve) => {
            setTimeout(() => resolve([]), BOOTSTRAP_TIMEOUT_MS);
          }),
        ]);

        setAllModules(modules);
        if (modules.length > 0) {
          setSelectedModuleId(modules[0].id);
        } else {
          setScreenError('Modules are taking too long to load. Please retry.');
        }

        setSyncStatus('syncing');
        refreshSyncStatusInBackground();
      } catch (error) {
        console.error('DEBUG (QuizScreen): Failed to initialize modules', error);
        setScreenError('Could not load modules. Please try again.');
        const status = await getCurrentQuizSyncStatus();
        setSyncStatus(status);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void initialize();
  }, []);

  const score = useMemo(() => {
    if (!showResults) {
      return 0;
    }

    return questions.reduce((total, question) => {
      const selected = answersByQuestionId[question.id];
      return selected === question.answerIndex ? total + 1 : total;
    }, 0);
  }, [answersByQuestionId, questions, showResults]);

  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;

  const refreshModules = async () => {
    const modules = await getAllAvailableModules();
    setAllModules(modules);
    if (!modules.some((module) => module.id === selectedModuleId) && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  };

  const handleDownloadMoreModules = async () => {
    setIsGenerateDialogVisible(true);
  };

  const handleGenerateModuleFromPrompt = async () => {
    const prompt = newModulePrompt.trim();
    if (!prompt) {
      setScreenError('Please enter a topic before generating a module.');
      return;
    }

    setIsDownloadingModules(true);
    setIsGeneratingModule(true);
    setScreenError(null);
    try {
      const generatedModule = await generateLearningModuleWithGemini(prompt);
      const { savedModuleId } = await addGeneratedModuleOffline(generatedModule, 'computer-science');
      await refreshModules();
      setSelectedModuleId(savedModuleId);
      setNewModulePrompt('');
      setIsGenerateDialogVisible(false);
      setSyncStatus('syncing');
      const status = await runQuizSyncNow();
      setSyncStatus(status);
    } catch (error) {
      console.error('DEBUG (QuizScreen): Failed to generate module with Gemini', error);
      setScreenError(
        error instanceof Error
          ? `Could not generate module: ${error.message}`
          : 'Could not generate module right now.'
      );
      const status = await getCurrentQuizSyncStatus();
      setSyncStatus(status);
    } finally {
      setIsDownloadingModules(false);
      setIsGeneratingModule(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedModuleId) {
      return;
    }

    const quiz = await generateOfflineQuizForModule({
      moduleId: selectedModuleId,
      questionCount: selectedQuestionCount,
    });

    setQuestions(quiz.questions);
    setCurrentQuestionIndex(0);
    setAnswersByQuestionId({});
    setShowResults(false);
    setHasQuizStarted(true);
  };

  const handleSelectAnswer = (answerIndex: number) => {
    if (!currentQuestion || showResults) {
      return;
    }

    setAnswersByQuestionId((previous) => ({
      ...previous,
      [currentQuestion.id]: answerIndex,
    }));
  };

  const handleNext = async () => {
    if (!currentQuestion) {
      return;
    }

    if (currentQuestionIndex === questions.length - 1) {
      const calculatedScore = questions.reduce((total, question) => {
        const selected = answersByQuestionId[question.id];
        return selected === question.answerIndex ? total + 1 : total;
      }, 0);

      await saveQuizAttemptOffline({
        id: `${Date.now()}-${selectedModuleId}`,
        subjectId: currentQuestion.subjectId,
        subjectName: currentQuestion.subjectName,
        moduleId: currentQuestion.moduleId,
        moduleTitle: currentQuestion.moduleTitle,
        selectedQuestionCount,
        totalQuestions: questions.length,
        score: calculatedScore,
        percentage: Math.round((calculatedScore / Math.max(1, questions.length)) * 100),
        createdAt: new Date().toISOString(),
      });
      setSyncStatus('syncing');
      const status = await runQuizSyncNow();
      setSyncStatus(status);
      setShowResults(true);
      return;
    }

    setCurrentQuestionIndex((previous) => previous + 1);
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((previous) => Math.max(0, previous - 1));
  };

  const handleRestart = () => {
    void handleGenerateQuiz();
  };

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator color="#00FFCC" size="large" />
          <Text style={styles.loadingText}>Loading offline modules...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const syncStatusMeta: Record<QuizSyncStatus, { label: string; color: string; bg: string }> = {
    synced: { label: 'Synced to cloud', color: '#00FFCC', bg: '#0F2A24' },
    syncing: { label: 'Syncing...', color: '#FFE08A', bg: '#2E2612' },
    'offline-pending': { label: 'Saved offline, pending sync', color: '#FFC26F', bg: '#2C2214' },
    'offline-no-network': { label: 'Offline: no internet', color: '#FFB98A', bg: '#2E1F17' },
    'offline-no-user': { label: 'Offline: login required for cloud sync', color: '#BFC6D6', bg: '#1F2632' },
    'permission-denied': { label: 'Sync blocked by Firestore rules', color: '#FF9E9E', bg: '#331B1B' },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="help-circle" size={44} color="#00FFCC" />
          <Text variant="headlineMedium" style={styles.title}>Quiz Mode</Text>
          <View style={[styles.syncBadge, { backgroundColor: syncStatusMeta[syncStatus].bg }]}> 
            <MaterialCommunityIcons
              name={syncStatus === 'synced' ? 'cloud-check' : syncStatus === 'syncing' ? 'cloud-sync' : 'cloud-alert'}
              size={14}
              color={syncStatusMeta[syncStatus].color}
            />
            <Text style={[styles.syncBadgeText, { color: syncStatusMeta[syncStatus].color }]}>
              {syncStatusMeta[syncStatus].label}
            </Text>
          </View>
        </View>

        {screenError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{screenError}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.downloadHeader}>
            <Text variant="titleMedium" style={styles.availableTitle}>Available Modules</Text>
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadMoreModules} disabled={isDownloadingModules}>
              {isDownloadingModules ? (
                <ActivityIndicator size="small" color="#0A0A0A" />
              ) : (
                <>
                  <MaterialCommunityIcons name="creation" size={16} color="#0A0A0A" />
                  <Text style={styles.downloadButtonText}>Create Module</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            mode="outlined"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search module by title, topic, or subject"
            left={<TextInput.Icon icon="magnify" />}
            style={styles.searchInput}
            outlineColor="#2E2E2E"
            activeOutlineColor="#00FFCC"
            textColor="#FFFFFF"
            theme={{ colors: { background: '#101010', onSurfaceVariant: '#7F7F7F' } }}
          />

          <View style={styles.resultHeader}>
            <Text style={styles.resultHeaderText}>Showing {filteredModules.length} of {allModules.length}</Text>
          </View>

          {filteredModules.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={[styles.moduleListRow, selectedModuleId === module.id ? styles.moduleListRowSelected : null]}
              onPress={() => setSelectedModuleId(module.id)}
            >
              <View style={styles.moduleRowHeader}>
                <Text style={styles.moduleRowTitle}>{module.title}</Text>
                <MaterialCommunityIcons
                  name={selectedModuleId === module.id ? 'check-circle' : 'chevron-right'}
                  size={18}
                  color={selectedModuleId === module.id ? '#00FFCC' : '#7F7F7F'}
                />
              </View>

              <Text style={styles.moduleRowSummary} numberOfLines={1}>{module.summary}</Text>

              <View style={styles.moduleRowMetaGroup}>
                <View style={styles.metaPill}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={13} color="#00FFCC" />
                  <Text style={styles.metaPillText}>{module.questions.length} Q</Text>
                </View>
                <View style={styles.metaPill}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color="#00FFCC" />
                  <Text style={styles.metaPillText}>{module.estimatedMinutes} min</Text>
                </View>
                <View style={styles.metaPill}>
                  <MaterialCommunityIcons name="tag-outline" size={13} color="#00FFCC" />
                  <Text style={styles.metaPillText}>{module.subjectName}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {allModules.length === 0 ? (
            <Text style={styles.emptyStateText}>No modules found in local storage yet.</Text>
          ) : null}

          {allModules.length > 0 && filteredModules.length === 0 ? (
            <Text style={styles.emptyStateText}>No module matches your search.</Text>
          ) : null}
        </View>

        {selectedModule ? (
          <View style={styles.card}>
            <Text variant="titleMedium" style={styles.availableTitle}>{selectedModule.title}</Text>
            <Text style={styles.moduleSummary}>{selectedModule.summary}</Text>
            <Text style={styles.moduleDetails}>{selectedModule.detailedContent}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.availableTitle}>Quiz Length</Text>
          <View style={styles.subjectRow}>
            {[5, 10, 15, 0].map((count) => (
              <Chip
                key={`count-${count}`}
                mode="outlined"
                selected={selectedQuestionCount === count}
                onPress={() => setSelectedQuestionCount(count)}
                style={[
                  styles.subjectChip,
                  selectedQuestionCount === count ? styles.subjectChipSelected : null,
                ]}
                textStyle={styles.subjectChipText}
              >
                {count === 0 ? 'All' : count}
              </Chip>
            ))}
          </View>

          <Button
            mode="contained"
            buttonColor="#00FFCC"
            textColor="#0A0A0A"
            onPress={() => void handleGenerateQuiz()}
            disabled={!selectedModule}
            style={styles.generateButton}
          >
            Generate Quiz
          </Button>
        </View>

        {hasQuizStarted ? (
          <View style={styles.card}>
          <View style={styles.progressContainer}>
            <Text variant="bodySmall" style={styles.progressLabel}>
              Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}
            </Text>
            <ProgressBar
              progress={progress}
              style={styles.progressBar}
              color="#00FFCC"
            />
          </View>

          {!showResults && currentQuestion ? (
            <>
              <Text variant="titleLarge" style={[styles.question, { marginVertical: 20 }]}>
                {currentQuestion.question}
              </Text>
              <Text style={styles.moduleLabel}>Module: {currentQuestion.moduleTitle}</Text>

              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <View key={`${currentQuestion.id}-${option}`} style={styles.optionRow}>
                    <RadioButton
                      value={`${index}`}
                      status={selectedAnswerIndex === index ? 'checked' : 'unchecked'}
                      onPress={() => handleSelectAnswer(index)}
                      color="#00FFCC"
                      uncheckedColor="#6E6E6E"
                    />
                    <Text variant="bodyMedium" style={[styles.optionText]} onPress={() => handleSelectAnswer(index)}>
                      {option}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Quiz Complete</Text>
              <Text style={styles.resultsValue}>
                Score: {score}/{questions.length}
              </Text>
              <Text style={styles.resultsMeta}>
                Accuracy: {Math.round((score / Math.max(1, questions.length)) * 100)}%
              </Text>
            </View>
          )}
          </View>
        ) : null}

        {hasQuizStarted ? (
          <View style={styles.buttonContainer}>
          <Button mode="outlined" style={styles.button} textColor="#CFCFCF" onPress={handlePrevious} disabled={showResults || currentQuestionIndex === 0}>
            Previous
          </Button>

          {!showResults ? (
            <Button
              mode="contained"
              style={styles.button}
              buttonColor="#00FFCC"
              textColor="#0A0A0A"
              disabled={typeof selectedAnswerIndex !== 'number'}
              onPress={() => void handleNext()}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
            </Button>
          ) : (
            <Button mode="contained" style={styles.button} buttonColor="#00FFCC" textColor="#0A0A0A" onPress={handleRestart}>
              New Quiz
            </Button>
          )}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.availableTitle}>Selected Module Outcomes</Text>
          {(selectedModule?.learningOutcomes ?? []).map((outcome, index) => (
            <Text key={`outcome-${index}`} style={styles.topicItem}>{outcome}</Text>
          ))}
        </View>

        <Portal>
          <Dialog visible={isGenerateDialogVisible} onDismiss={() => !isGeneratingModule && setIsGenerateDialogVisible(false)} style={styles.generateDialog}>
            <Dialog.Title style={styles.generateDialogTitle}>Generate Module with Gemini</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.generateDialogHint}>
                Enter a topic like "Binary Search Trees" or "Operating Systems Scheduling".
              </Text>
              <TextInput
                mode="outlined"
                value={newModulePrompt}
                onChangeText={setNewModulePrompt}
                placeholder="Type module topic..."
                style={styles.generateDialogInput}
                outlineColor="#2E2E2E"
                activeOutlineColor="#00FFCC"
                textColor="#FFFFFF"
                multiline
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button textColor="#BEBEBE" disabled={isGeneratingModule} onPress={() => setIsGenerateDialogVisible(false)}>
                Cancel
              </Button>
              <Button
                buttonColor="#00FFCC"
                textColor="#0A0A0A"
                loading={isGeneratingModule}
                disabled={isGeneratingModule}
                mode="contained"
                onPress={() => void handleGenerateModuleFromPrompt()}
              >
                Generate
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    marginTop: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#B4B4B4',
  },
  syncBadge: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  generateDialog: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  generateDialogTitle: {
    color: '#FFFFFF',
  },
  generateDialogHint: {
    color: '#A7A7A7',
    marginBottom: 10,
  },
  generateDialogInput: {
    backgroundColor: '#101010',
    minHeight: 76,
  },
  errorBanner: {
    backgroundColor: '#2E1515',
    borderWidth: 1,
    borderColor: '#7B2B2B',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  errorBannerText: {
    color: '#FFB9B9',
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252525',
    padding: 14,
  },
  downloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  downloadButton: {
    backgroundColor: '#00FFCC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 120,
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#0A0A0A',
    fontWeight: '700',
    fontSize: 12,
  },
  searchInput: {
    marginBottom: 10,
    backgroundColor: '#101010',
  },
  resultHeader: {
    marginBottom: 8,
  },
  resultHeaderText: {
    color: '#8C8C8C',
    fontSize: 12,
  },
  moduleListRow: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  moduleListRowSelected: {
    borderColor: '#00FFCC',
  },
  moduleRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleRowTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
  },
  moduleRowSummary: {
    color: '#C6C6C6',
    marginTop: 6,
    fontSize: 12,
  },
  moduleRowMetaGroup: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#244138',
    backgroundColor: '#0C1E19',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: {
    color: '#A7EEDF',
    fontSize: 11,
    fontWeight: '600',
  },
  moduleSummary: {
    color: '#C6C6C6',
    marginTop: 4,
    fontSize: 12,
  },
  moduleDetails: {
    color: '#8C8C8C',
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyStateText: {
    color: '#8C8C8C',
    textAlign: 'center',
    paddingVertical: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    color: '#8F8F8F',
  },
  progressBar: {
    marginTop: 8,
    height: 6,
    backgroundColor: '#2A2A2A',
  },
  question: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionsContainer: {
    marginVertical: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    backgroundColor: '#111111',
  },
  optionText: {
    marginLeft: 8,
    flex: 1,
    color: '#DADADA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderColor: '#2E2E2E',
  },
  availableTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    backgroundColor: '#101010',
    borderColor: '#2E2E2E',
  },
  subjectChipSelected: {
    borderColor: '#00FFCC',
  },
  subjectChipText: {
    color: '#FFFFFF',
  },
  generateButton: {
    marginTop: 12,
  },
  moduleLabel: {
    color: '#8F8F8F',
    marginTop: -6,
    marginBottom: 12,
  },
  resultsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  resultsValue: {
    color: '#00FFCC',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  resultsMeta: {
    color: '#AFAFAF',
    marginTop: 6,
  },
  topicItem: {
    color: '#C9C9C9',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
});
