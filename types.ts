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
    tooltipText?: string;
}

// User type
export interface User {
    id: string;
    username: string;
}

// --- "Book AI" / "Scientific Work" Module Types ---

export interface BookAISubItem extends OptionData {}

export interface BookAICategory {
    id: string;
    name: string;
    tooltipText?: string;
    subItems: BookAISubItem[];
}

export interface BookAIAudience extends OptionData {
    description: string;
}

export interface BookAIVolume extends OptionData {
    description: string;
    estimatedParts: number;
    targetWordCountPerPart: number;
}

export interface ScientificDocType extends OptionData {}
export interface ScientificMethodology extends OptionData {}


// --- "Medical AI" Module Types ---

export type MedicalViewMode = 'xray' | 'diagnosis' | 'verification' | 'lab';
export type AnalysisStage = 'idle' | 'preparing' | 'analyzing' | 'concluding';

export interface BaseFile {
    id: string;
    name: string;
    type: 'image' | 'text';
    content: string;
}
export interface VerificationFile extends BaseFile {}
export interface LabFile extends BaseFile {}

export interface MedicalState {
    activeMode: MedicalViewMode;
    analysisStage: AnalysisStage;

    isProcessingXray: boolean;
    isProcessingDiagnosis: boolean;
    isProcessingVerificationFile: boolean;
    isProcessingLabFile: boolean;

    isAnalyzingXray: boolean;
    isAnalyzingDiagnosis: boolean;
    isAnalyzingVerification: boolean;
    isAnalyzingLab: boolean;
    isExtractingLabData: boolean;

    xrayError: string | null;
    diagnosisError: string | null;
    verificationError: string | null;
    labError: string | null;

    xrayAnalysis: string | null;
    diagnosisAnalysis: string | null;
    verificationAnalysis: string | null;
    labAnalysis: string | null;
    
    xrayImageBase64: string | null;
    xrayImageName: string | null;
    
    diagnosisFileContent: string | null;
    diagnosisFileName: string | null;
    diagnosisFileType: 'image' | 'text' | null;
    
    verificationFiles: VerificationFile[];
    
    labFiles: LabFile[];
    labPatientName: string;
    labPatientGender: string;
    labPatientAge: string;
    labAnalystName: string;
}
