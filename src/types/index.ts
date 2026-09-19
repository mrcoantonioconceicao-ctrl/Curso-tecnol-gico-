export interface TestQuestion {
  id: string;
  number: number;
  title: string;
  scenario: string;
  problemStatement: string;
  codeSnippet?: string;
  expectedInvariant: string;
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  detailedInvariantSolution: string;
}

export interface ModuleData {
  id: string;
  code: string; // e.g. "M1"
  title: string;
  block: string;
  summary: string;
  analyticalMatrix: {
    domain: string;
    deterministicBound: string;
    latencyVsConsistency: string;
    securityInvariant: string;
  }[];
  theorySections: {
    title: string;
    subtitle?: string;
    content: string;
    latexFormula?: string;
    diagramAscii?: string;
  }[];
  referenceImplementation: {
    filename: string;
    language: string;
    code: string;
    description: string;
  };
  invariants: string[];
  testSuite: TestQuestion[];
}

export interface QuizAttempt {
  questionId: string;
  selectedOptionId?: string;
  userTextAnswer?: string;
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
}
