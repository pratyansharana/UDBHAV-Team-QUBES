import { GoogleGenerativeAI } from '@google/generative-ai';
import { LearningModule, ModuleQuestion } from './Quiz';

const GEMINI_MODEL = 'gemini-1.5-flash';

const parseJsonFromText = (rawText: string): unknown => {
	const trimmed = rawText.trim();
	if (!trimmed) {
		throw new Error('Gemini returned an empty response.');
	}

	const cleaned = trimmed
		.replace(/^```json\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/```$/i, '')
		.trim();

	return JSON.parse(cleaned);
};

const slugify = (text: string): string =>
	text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);

const isValidQuestion = (item: unknown): item is ModuleQuestion => {
	if (!item || typeof item !== 'object') {
		return false;
	}

	const q = item as ModuleQuestion;
	return (
		typeof q.id === 'string' &&
		typeof q.question === 'string' &&
		Array.isArray(q.options) &&
		q.options.length === 4 &&
		q.options.every((option) => typeof option === 'string') &&
		typeof q.answerIndex === 'number' &&
		q.answerIndex >= 0 &&
		q.answerIndex < 4 &&
		(q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') &&
		typeof q.explanation === 'string'
	);
};

const normalizeGeneratedModule = (payload: unknown, topic: string): LearningModule => {
	if (!payload || typeof payload !== 'object') {
		throw new Error('Generated module format is invalid.');
	}

	const raw = payload as Partial<LearningModule>;
	const safeTitle = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : `Module: ${topic}`;
	const safeId = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : slugify(safeTitle);

	const questions = Array.isArray(raw.questions) ? raw.questions.filter(isValidQuestion) : [];
	if (questions.length < 20) {
		throw new Error('Gemini did not generate 20 valid questions. Please try a more specific topic.');
	}

	const normalizedQuestions = questions.slice(0, 20).map((question, index) => ({
		...question,
		id: question.id?.trim() ? question.id : `${safeId}-q${index + 1}`,
	}));

	return {
		id: safeId,
		title: safeTitle,
		summary:
			typeof raw.summary === 'string' && raw.summary.trim()
				? raw.summary.trim()
				: `A focused module on ${topic}.`,
		detailedContent:
			typeof raw.detailedContent === 'string' && raw.detailedContent.trim()
				? raw.detailedContent.trim()
				: `This module covers ${topic} with conceptual clarity and practice-oriented questions.`,
		learningOutcomes:
			Array.isArray(raw.learningOutcomes) && raw.learningOutcomes.length > 0
				? raw.learningOutcomes.filter((outcome): outcome is string => typeof outcome === 'string').slice(0, 6)
				: [`Understand fundamentals of ${topic}`, `Solve applied questions on ${topic}`],
		estimatedMinutes:
			typeof raw.estimatedMinutes === 'number' && raw.estimatedMinutes > 0
				? Math.round(raw.estimatedMinutes)
				: 90,
		questions: normalizedQuestions,
	};
};

export const generateLearningModuleWithGemini = async (topic: string): Promise<LearningModule> => {
	const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to your Expo environment and rebuild.');
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

	const prompt = `You are an expert curriculum designer. Create one learning module in strict JSON only.

Requirements:
- Topic: "${topic}"
- Output must be a single JSON object only. No markdown.
- Keys required:
	- id: kebab-case string
	- title: string
	- summary: concise 1 sentence
	- detailedContent: detailed teaching content, at least 120 words
	- learningOutcomes: array of 4 to 6 strings
	- estimatedMinutes: number
	- questions: exactly 20 items
- Each question object must include:
	- id: string
	- question: string
	- options: array of exactly 4 strings
	- answerIndex: integer 0..3
	- difficulty: one of easy|medium|hard
	- explanation: string

Ensure questions are clear, non-duplicate, and progressively difficult.`;

	const result = await model.generateContent(prompt);
	const responseText = result.response.text();
	const parsed = parseJsonFromText(responseText);
	return normalizeGeneratedModule(parsed, topic);
};
