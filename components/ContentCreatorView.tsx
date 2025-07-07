import React, { useState } from 'react';
import { Icon } from '@/components/Icon';
import { SectionHeading } from '@/components/SectionHeading';
import { OptionButton } from '@/components/OptionButton';
import { TextInputGroup } from '@/components/TextInputGroup';
import type { ContentCreatorState, DocType, PrepaidCodeState } from '@/types';

interface ContentCreatorViewProps {
  state: ContentCreatorState;
  setState: React.Dispatch<React.SetStateAction<ContentCreatorState>>;
  onGenerate: () => void;
  onCheckOriginality: () => void;
  onIncreaseUniqueness: () => void;
  onDownloadTxt: () => void;
  onDownloadDocx: () => void;
  isPaymentProcessing: boolean;
  prepaidCodeState: PrepaidCodeState;
}

const docTypes: { id: DocType; name: string }[] = [
  { id: 'essay', name: 'Сочинение' },
  { id: 'report', name: 'Доклад' },
  { id: 'composition', name: 'Реферат' },
];

export const ContentCreatorView: React.FC<ContentCreatorViewProps> = ({
  state,
  setState,
  onGenerate,
  onCheckOriginality,
  onIncreaseUniqueness,
  onDownloadTxt,
  onDownloadDocx,
  isPaymentProcessing,
  prepaidCodeState,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const {
    docType,
    topic,
    age,
    isGenerating,
    generationStep,
    generatedText,
    originalityScore,
    originalityExplanation,
    error
  } = state;
  
  const getUniquenessThreshold = (currentAge: number): number => {
    if (currentAge <= 7) return 25;
    if (currentAge <= 10) return 35; // 8-10 лет
    if (currentAge <= 13) return 45; // 11-13 лет
    if (currentAge <= 15) return 55; // 14-15 лет
    if (currentAge <= 16) return 65; // 16 лет
    return 70; // 17+ лет
  };
  
  const uniquenessThreshold = getUniquenessThreshold(age);
  const isOriginalitySufficient = originalityScore !== null && originalityScore > uniquenessThreshold;
  const isActionLocked = isGenerating || isOriginalitySufficient || isPaymentProcessing || prepaidCodeState.isLoading;

  const handleDocTypeSelect = (id: string) => {
    setState(prev => ({ ...prev, docType: id as DocType, error: null, generatedText: null, originalityScore: null }));
  };
  
  const handleTopicChange = (value: string) => {
    setState(prev => ({ ...prev, topic: value, error: null, generatedText: null, originalityScore: null }));
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({...prev, age: parseInt(e.target.value, 10), generatedText: null, originalityScore: null}));
  };

  const handleCopy = () => {
    if (!generatedText || isCopied) return;
    navigator.clipboard.writeText(generatedText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  };

  const renderGenerationStatus = () => {
    if (generationStep === 'idle' || (generationStep === 'done' && !generatedText)) return null;

    if (generationStep === 'generating') {
      return <div className="flex items-center justify-center gap-2 text-blue-600"><Icon name="fas fa-spinner fa-spin" /><span>Генерация текста...</span></div>;
    }
    if (generationStep === 'checking_originality') {
        return <div className="flex items-center justify-center gap-2 text-blue-600"><Icon name="fas fa-spinner fa-spin" /><span>Проверка уникальности...</span></div>;
    }
    if (generationStep === 'improving_uniqueness') {
        return <div className="flex items-center justify-center gap-2 text-blue-600"><Icon name="fas fa-spinner fa-spin" /><span>Повышаю уникальность текста...</span></div>;
    }
    return null;
  }
  
  const getButtonText = () => {
    if (prepaidCodeState.isValid) {
        return 'Создать текст (1 использование)';
    }
    return 'Создать текст (10₽)';
  };

  return (
    <div className="main-panel space-y-6">
      <SectionHeading title="Создание Текста" iconName="fas fa-file-signature" />
      
      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-md font-medium text-gray-700 mb-2">Тип документа</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {docTypes.map(d => (
              <OptionButton
                key={d.id}
                option={d}
                isSelected={docType === d.id}
                onClick={handleDocTypeSelect}
                disabled={isActionLocked}
              />
            ))}
          </div>
        </div>
        
        <TextInputGroup
          title="Тема"
          inputId="topic"
          value={topic}
          onChange={handleTopicChange}
          placeholder="Например: Мой любимый литературный герой"
          disabled={isActionLocked}
        />
        
        <div>
            <label htmlFor="age-slider" className="block text-md font-medium text-gray-700 mb-2">
                Возраст ученика: <span className="font-bold text-blue-600">{age} лет</span>
            </label>
            <input
                id="age-slider"
                type="range"
                min="7"
                max="17"
                value={age}
                onChange={handleAgeChange}
                disabled={isActionLocked}
                className="w-full"
            />
        </div>
      </div>
      
      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={onGenerate}
          disabled={isActionLocked || !docType || !topic}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          <Icon name="fas fa-play" className="mr-2" />
          {getButtonText()}
        </button>
      </div>

      {/* Output Section */}
      {(isGenerating || error || generatedText) && (
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <div className="text-center font-semibold">{renderGenerationStatus()}</div>
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center"><Icon name="fas fa-exclamation-triangle" className="mr-2" />{error}</p>}
          
          {generatedText && !isGenerating && generationStep !== 'generating' && (
            <div className="space-y-4">
              <div className="prose prose-custom max-w-none p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: window.DOMPurify.sanitize(window.marked.parse(generatedText)) }} />
              </div>

              <div className="p-4 bg-gray-100 rounded-lg space-y-3">
                {originalityScore !== null ? (
                    <div className="text-center space-y-3">
                        <p className="text-lg font-bold">Уникальность: <span className={originalityScore > uniquenessThreshold ? 'text-green-600' : 'text-red-500'}>{originalityScore}%</span>
                          <span className="text-sm font-normal text-gray-500 ml-2">(необх. {uniquenessThreshold}%)</span>
                        </p>
                        <p className="text-sm text-gray-600">{originalityExplanation}</p>
                        
                        {isOriginalitySufficient ? (
                           <div className="text-sm p-2 bg-green-100 text-green-800 rounded-md">
                                <Icon name="fas fa-check-circle" className="mr-2"/>
                                Достаточная уникальность для этого возраста.
                           </div>
                        ) : (
                           <button
                                onClick={onIncreaseUniqueness}
                                disabled={isGenerating}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg shadow disabled:opacity-50"
                           >
                                <Icon name="fas fa-wand-magic-sparkles" className="mr-2"/>
                                Повысить уникальность
                           </button>
                        )}
                        
                        <div className="pt-3 border-t border-gray-200">
                            <p className="text-md font-semibold text-gray-700 mb-2 text-center">Действия с результатом</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center justify-center gap-2 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors ${isCopied ? 'bg-teal-500' : 'bg-gray-500 hover:bg-gray-600'}`}
                                >
                                    <Icon name={isCopied ? "fas fa-check" : "far fa-copy"}/>
                                    {isCopied ? 'Скопировано' : 'Копировать'}
                                </button>
                                <button
                                    onClick={onDownloadTxt}
                                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg shadow"
                                >
                                    <Icon name="far fa-file-alt"/>
                                    .txt
                                </button>
                                <button
                                    onClick={onDownloadDocx}
                                    className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg shadow"
                                >
                                    <Icon name="far fa-file-word"/>
                                    .docx
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onCheckOriginality}
                        disabled={isGenerating}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg shadow disabled:opacity-50"
                    >
                        <Icon name="fas fa-search-dollar" className="mr-2"/>
                        Проверить на уникальность
                    </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
