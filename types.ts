// State for Module 1: Content Creation
export type DocType = 'essay' | 'report' | 'composition';

export type GenerationStep = 'idle' | 'generating' | 'checking_originality' | 'improving_uniqueness' | 'done' | 'error';

export interface ContentCreatorState {
  docType: DocType | null;
  topic: string;
  age: number; // e.g., 7-17
  isGenerating: boolean;
  generationStep: GenerationStep;
  generatedText: string | null;
  originalityScore: number | null;
  originalityExplanation: string | null;
  error: string | null;
}

// State for Module 2: Homework Helper
export interface HomeworkHelperState {
  file: File | null;
  fileContent: string | null; // base64 for images, text for text files
  fileType: 'image' | 'text' | null;
  fileName: string | null;
  isProcessing: boolean;
  solution: string | null;
  error: string | null;
  isSimplifying: boolean;
}

// State for Prepaid Codes
export interface PrepaidCodeState {
  code: string;
  isValid: boolean | null;
  remainingUses: number | null;
  error: string | null;
  isLoading: boolean;
}

// For purchasing packages
export interface PurchaseState {
  isPurchasing: boolean;
  status: 'idle' | 'creating' | 'redirecting' | 'waiting' | 'claiming' | 'success' | 'failed';
  error: string | null;
  purchasedCode: string | null;
}

export interface PackageInfo {
  id: string;
  generations: number;
  price: number;
  discount: number;
  name: string;
  icon: string;
}

// Generic OptionData for buttons
export interface OptionData {
    id: string;
    name: string;
    subtext?: string;
}
