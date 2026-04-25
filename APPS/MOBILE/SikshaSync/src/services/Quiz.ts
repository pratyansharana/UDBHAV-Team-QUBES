import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import subjectModules from '../data/subjectModules.json';
import { auth, db } from '../firebase/firebaseconfig';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface OfflineQuizQuestion {
	id: string;
	subjectId: string;
	subjectName: string;
	moduleId: string;
	moduleTitle: string;
	question: string;
	options: string[];
	answerIndex: number;
	difficulty: QuestionDifficulty;
	explanation: string;
}

export interface ModuleQuestion {
	id: string;
	question: string;
	options: string[];
	answerIndex: number;
	difficulty: QuestionDifficulty;
	explanation: string;
}

export interface LearningModule {
	id: string;
	title: string;
	summary: string;
	detailedContent: string;
	learningOutcomes: string[];
	estimatedMinutes: number;
	questions: ModuleQuestion[];
}

export interface SharedModuleImportPayload {
	id: string;
	title: string;
	content: string;
	hash: string;
}

export interface SubjectData {
	id: string;
	name: string;
	description: string;
	modules: LearningModule[];
}

interface SubjectModulesData {
	subjects: SubjectData[];
}

interface PendingSyncState {
	modulesDirty: boolean;
	attemptsDirty: boolean;
}

export interface QuizSession {
	subjectId: string;
	subjectName: string;
	moduleId: string;
	moduleTitle: string;
	totalQuestions: number;
	questions: OfflineQuizQuestion[];
}

export interface QuizAttempt {
	id: string;
	subjectId: string;
	subjectName: string;
	moduleId: string;
	moduleTitle: string;
	selectedQuestionCount: number;
	totalQuestions: number;
	score: number;
	percentage: number;
	createdAt: string;
}

export interface QuizGenerationOptions {
	moduleId: string;
	questionCount: number;
}

export type QuizSyncStatus =
	| 'synced'
	| 'syncing'
	| 'offline-pending'
	| 'offline-no-network'
	| 'offline-no-user'
	| 'permission-denied';

const MODULE_STORAGE_KEY = 'sikshasync.modules.v2';
const ATTEMPTS_STORAGE_KEY = 'sikshasync.quizAttempts.v1';
const PENDING_SYNC_KEY = 'sikshasync.pendingSync.v1';

const bundledData = subjectModules as SubjectModulesData;
let hasLoggedPermissionWarning = false;

const downloadableModulePack: LearningModule[] = [
	{
		id: 'advanced-recursion-patterns',
		title: 'Advanced Recursion Patterns',
		summary: 'Mutual recursion, recursive decomposition patterns, and optimization tactics.',
		detailedContent:
			'This bonus module is designed as a downloadable expansion pack. It focuses on advanced recursion forms such as mutual recursion, divide-merge decomposition, and layered stopping conditions. The content includes practical design checklists for selecting recursion shape, controlling growth of branching trees, and validating correctness under constrained memory.',
		learningOutcomes: [
			'Differentiate single, mutual, and divide-merge recursion patterns.',
			'Select recursion templates based on branching characteristics.',
			'Audit recursive implementations for stack safety and correctness.',
			'Apply optimization heuristics for high-depth recursive workloads.',
		],
		estimatedMinutes: 105,
		questions: Array.from({ length: 20 }).map((_, index) => ({
			id: `advanced-recursion-patterns-q${index + 1}`,
			question: `In advanced recursion patterns, what is the best design principle for checkpoint ${index + 1}?`,
			options: [
				'Use explicit base conditions, validate progress per call, and verify return contracts.',
				'Avoid base conditions because deep recursion improves correctness.',
				'Change algorithm behavior randomly across call levels.',
				'Skip testing edge inputs for recursive routines.',
			],
			answerIndex: 0,
			difficulty: index < 7 ? 'easy' : index < 14 ? 'medium' : 'hard',
			explanation:
				'Reliable recursive design needs a base condition, measurable progress toward it, and explicit return contract checks.',
		})),
	},
];

const shuffle = <T,>(items: T[]): T[] => {
	const copy = [...items];
	for (let index = copy.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
	}
	return copy;
};

const normalizeQuestion = (
	subject: SubjectData,
	module: LearningModule,
	question: ModuleQuestion
): OfflineQuizQuestion => ({
	id: question.id,
	subjectId: subject.id,
	subjectName: subject.name,
	moduleId: module.id,
	moduleTitle: module.title,
	question: question.question,
	options: question.options,
	answerIndex: question.answerIndex,
	difficulty: question.difficulty,
	explanation: question.explanation,
});

const getPendingSyncState = async (): Promise<PendingSyncState> => {
	const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
	if (!raw) {
		return { modulesDirty: false, attemptsDirty: false };
	}

	try {
		return JSON.parse(raw) as PendingSyncState;
	} catch {
		return { modulesDirty: true, attemptsDirty: true };
	}
};

const setPendingSyncState = async (state: PendingSyncState): Promise<void> => {
	await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(state));
};

const markSyncDirty = async (field: keyof PendingSyncState): Promise<void> => {
	const state = await getPendingSyncState();
	state[field] = true;
	await setPendingSyncState(state);
};

const saveSubjectsOffline = async (subjects: SubjectData[]): Promise<void> => {
	await AsyncStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(subjects));
};

const isValidSubjectsPayload = (value: unknown): value is SubjectData[] => {
	if (!Array.isArray(value) || value.length === 0) {
		return false;
	}

	return value.every((subject) => {
		if (!subject || typeof subject !== 'object') {
			return false;
		}

		const typedSubject = subject as SubjectData;
		if (!typedSubject.id || !typedSubject.name || !Array.isArray(typedSubject.modules)) {
			return false;
		}

		return typedSubject.modules.every((module) => {
			if (!module || typeof module !== 'object') {
				return false;
			}

			const typedModule = module as LearningModule;
			return Boolean(typedModule.id && typedModule.title && Array.isArray(typedModule.questions));
		});
	});
};

export const loadOfflineSubjects = async (): Promise<SubjectData[]> => {
	const raw = await AsyncStorage.getItem(MODULE_STORAGE_KEY);
	if (raw) {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (isValidSubjectsPayload(parsed)) {
				return parsed;
			}

			await AsyncStorage.removeItem(MODULE_STORAGE_KEY);
		} catch {
			await AsyncStorage.removeItem(MODULE_STORAGE_KEY);
		}
	}

	const seed = bundledData.subjects;
	await saveSubjectsOffline(seed);
	await markSyncDirty('modulesDirty');
	return seed;
};

export const getAllAvailableModules = async (): Promise<Array<LearningModule & { subjectId: string; subjectName: string }>> => {
	const subjects = await loadOfflineSubjects();
	return subjects.flatMap((subject) =>
		subject.modules.map((module) => ({
			...module,
			subjectId: subject.id,
			subjectName: subject.name,
		}))
	);
};

export const downloadMoreModulesOffline = async (): Promise<SubjectData[]> => {
	const subjects = await loadOfflineSubjects();
	const targetSubjectIndex = subjects.findIndex((subject) => subject.id === 'computer-science');
	if (targetSubjectIndex < 0) {
		return subjects;
	}

	const subject = subjects[targetSubjectIndex];
	const existingIds = new Set(subject.modules.map((module) => module.id));
	const newModules = downloadableModulePack.filter((module) => !existingIds.has(module.id));

	if (newModules.length === 0) {
		return subjects;
	}

	const updatedSubjects = [...subjects];
	updatedSubjects[targetSubjectIndex] = {
		...subject,
		modules: [...subject.modules, ...newModules],
	};

	await saveSubjectsOffline(updatedSubjects);
	await markSyncDirty('modulesDirty');
	return updatedSubjects;
};

export const addGeneratedModuleOffline = async (
	module: LearningModule,
	subjectId = 'computer-science'
): Promise<{ subjects: SubjectData[]; savedModuleId: string }> => {
	const subjects = await loadOfflineSubjects();
	const targetSubjectIndex = subjects.findIndex((subject) => subject.id === subjectId);
	if (targetSubjectIndex < 0) {
		throw new Error(`Subject not found for id: ${subjectId}`);
	}

	const subject = subjects[targetSubjectIndex];
	const existingIds = new Set(subject.modules.map((item) => item.id));
	let uniqueId = module.id;
	let suffix = 1;
	while (existingIds.has(uniqueId)) {
		suffix += 1;
		uniqueId = `${module.id}-${suffix}`;
	}

	const nextModule: LearningModule = {
		...module,
		id: uniqueId,
		questions: module.questions.map((question, index) => ({
			...question,
			id: question.id || `${uniqueId}-q${index + 1}`,
		})),
	};

	const updatedSubjects = [...subjects];
	updatedSubjects[targetSubjectIndex] = {
		...subject,
		modules: [nextModule, ...subject.modules],
	};

	await saveSubjectsOffline(updatedSubjects);
	await markSyncDirty('modulesDirty');
	return { subjects: updatedSubjects, savedModuleId: nextModule.id };
};

export const importSharedModuleMetadataOffline = async (
	payload: SharedModuleImportPayload,
	defaultSubjectId = 'shared-imports'
): Promise<{ subjects: SubjectData[]; savedModuleId: string }> => {
	const subjects = await loadOfflineSubjects();
	const existingIndex = subjects.findIndex((subject) => subject.id === defaultSubjectId);

	const targetSubject: SubjectData =
		existingIndex >= 0
			? subjects[existingIndex]
			: {
				id: defaultSubjectId,
				name: 'Shared Imports',
				description: 'Modules imported from offline QR sharing.',
				modules: [],
			};

	const existingIds = new Set(targetSubject.modules.map((module) => module.id));
	let uniqueId = payload.id;
	let suffix = 1;
	while (existingIds.has(uniqueId)) {
		suffix += 1;
		uniqueId = `${payload.id}-${suffix}`;
	}

	const trimmedContent = payload.content.trim();
	const summary =
		trimmedContent.length > 180
			? `${trimmedContent.slice(0, 177)}...`
			: trimmedContent;

	const importedModule: LearningModule = {
		id: uniqueId,
		title: payload.title,
		summary: `Imported via offline QR (${payload.hash.slice(0, 10)})`,
		detailedContent: trimmedContent,
		learningOutcomes: [
			summary,
			'Imported from another device via offline sharing.',
		],
		estimatedMinutes: Math.max(5, Math.ceil(trimmedContent.split(/\s+/).length / 170)),
		questions: [],
	};

	const nextSubjects = [...subjects];
	if (existingIndex >= 0) {
		nextSubjects[existingIndex] = {
			...targetSubject,
			modules: [importedModule, ...targetSubject.modules],
		};
	} else {
		nextSubjects.push({
			...targetSubject,
			modules: [importedModule],
		});
	}

	await saveSubjectsOffline(nextSubjects);
	await markSyncDirty('modulesDirty');

	return { subjects: nextSubjects, savedModuleId: importedModule.id };
};

const findModuleById = (
	subjects: SubjectData[],
	moduleId: string
): { subject: SubjectData; module: LearningModule } | null => {
	for (const subject of subjects) {
		const module = subject.modules.find((item) => item.id === moduleId);
		if (module) {
			return { subject, module };
		}
	}

	return null;
};

export const generateOfflineQuizForModule = async ({
	moduleId,
	questionCount,
}: QuizGenerationOptions): Promise<QuizSession> => {
	const subjects = await loadOfflineSubjects();
	const found = findModuleById(subjects, moduleId);

	if (!found) {
		throw new Error(`Module not found for id: ${moduleId}`);
	}

	const { subject, module } = found;
	if (module.questions.length === 0) {
		throw new Error(`No questions available for module: ${module.title}`);
	}

	const requested = questionCount === 0 ? module.questions.length : questionCount;
	const cappedQuestionCount = Math.max(1, Math.min(requested, module.questions.length));
	const selectedQuestions = shuffle(module.questions)
		.slice(0, cappedQuestionCount)
		.map((question) => normalizeQuestion(subject, module, question));

	return {
		subjectId: subject.id,
		subjectName: subject.name,
		moduleId: module.id,
		moduleTitle: module.title,
		totalQuestions: selectedQuestions.length,
		questions: selectedQuestions,
	};
};

export const saveQuizAttemptOffline = async (attempt: QuizAttempt): Promise<void> => {
	const raw = await AsyncStorage.getItem(ATTEMPTS_STORAGE_KEY);
	const existing = raw ? (JSON.parse(raw) as QuizAttempt[]) : [];
	const updated = [attempt, ...existing].slice(0, 200);

	await AsyncStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(updated));
	await markSyncDirty('attemptsDirty');
};

export const getOfflineQuizAttempts = async (): Promise<QuizAttempt[]> => {
	const raw = await AsyncStorage.getItem(ATTEMPTS_STORAGE_KEY);
	return raw ? (JSON.parse(raw) as QuizAttempt[]) : [];
};

export const getCurrentQuizSyncStatus = async (): Promise<QuizSyncStatus> => {
	const pending = await getPendingSyncState();
	if (!pending.modulesDirty && !pending.attemptsDirty) {
		return 'synced';
	}

	const networkState = await Network.getNetworkStateAsync();
	if (!networkState.isConnected) {
		return 'offline-no-network';
	}

	const user = auth.currentUser;
	if (!user) {
		return 'offline-no-user';
	}

	return 'offline-pending';
};

export const runQuizSyncNow = async (): Promise<QuizSyncStatus> => {
	const networkState = await Network.getNetworkStateAsync();
	if (!networkState.isConnected) {
		return 'offline-no-network';
	}

	const user = auth.currentUser;
	if (!user) {
		return 'offline-no-user';
	}

	const pending = await getPendingSyncState();
	if (!pending.modulesDirty && !pending.attemptsDirty) {
		return 'synced';
	}

	try {
		if (pending.modulesDirty) {
			const subjects = await loadOfflineSubjects();
			await Promise.all(
				subjects.map((subject) =>
					setDoc(
						doc(db, 'users', user.uid, 'offlineModuleSubjects', subject.id),
						{
							subjectId: subject.id,
							name: subject.name,
							description: subject.description,
							modules: subject.modules,
							updatedAt: serverTimestamp(),
						},
						{ merge: true }
					)
				)
			);
		}

		if (pending.attemptsDirty) {
			const attempts = await getOfflineQuizAttempts();
			await Promise.all(
				attempts.map((attempt) =>
					setDoc(
						doc(db, 'users', user.uid, 'quizAttempts', attempt.id),
						{
							...attempt,
							syncedAt: serverTimestamp(),
						},
						{ merge: true }
					)
				)
			);
		}

		await setPendingSyncState({ modulesDirty: false, attemptsDirty: false });
		await setDoc(
			doc(db, 'users', user.uid, 'syncState', 'offlineQuiz'),
			{
				syncedAt: serverTimestamp(),
			},
			{ merge: true }
		);

		return 'synced';
	} catch (error: unknown) {
		const code = (error as { code?: string })?.code;
		if (code === 'permission-denied' || code === 'firestore/permission-denied') {
			if (!hasLoggedPermissionWarning) {
				console.warn('DEBUG (QuizService): Firestore permission denied. Keeping quiz data offline.');
				hasLoggedPermissionWarning = true;
			}
			return 'permission-denied';
		}

		throw error;
	}
};

export const syncOfflineQuizDataToFirestore = async (): Promise<boolean> => {
	const status = await runQuizSyncNow();
	return status === 'synced';
};

// Backward-compatible synchronous exports for legacy callers.
export const getAvailableSubjects = (): Array<Pick<SubjectData, 'id' | 'name'>> => {
	return bundledData.subjects.map((subject) => ({ id: subject.id, name: subject.name }));
};

export const getAvailableModulesBySubject = (
	subjectId: string
): Array<Pick<LearningModule, 'id' | 'title'>> => {
	const subject = bundledData.subjects.find((item) => item.id === subjectId);
	if (!subject) {
		return [];
	}

	return subject.modules.map((module) => ({ id: module.id, title: module.title }));
};
