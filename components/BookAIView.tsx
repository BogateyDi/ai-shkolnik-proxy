import React from 'react';
import { Icon } from '@/components/Icon';
import { SectionHeading } from '@/components/SectionHeading';
import { OptionButton } from '@/components/OptionButton';
import { TextInputGroup } from '@/components/TextInputGroup';
import type { ContentCreatorState, DocType } from '@/types';

interface ContentCreatorViewProps {
  state: ContentCreatorState;
  setState: React.Dispatch<React.SetStateAction<ContentCreatorState>>;
  onGenerate: () => void;
  onCheckOriginality: () => void;
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
}) => {
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
  
  const handleDocTypeSelect = (id: string) => {
    setState(prev => ({ ...prev, docType: id as DocType, error: null }));
  };
  
  const handleTopicChange = (value: string) => {
    setState(prev => ({ ...prev, topic: value, error: null }));
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({...prev, age: parseInt(e.target.value, 10)}));
  };

  const renderGenerationStatus = () => {
    if (generationStep === 'idle' || (generationStep === 'done' && !generatedText)) return null;

    if (generationStep === 'generating') {
      return <div className="flex items-center gap-2 text-blue-600"><Icon name="fas fa-spinner fa-spin" /><span>Генерация текста...</span></div>;
    }
    if (generationStep === 'checking_originality') {
        return <div className="flex items-center gap-2 text-blue-600"><Icon name="fas fa-spinner fa-spin" /><span>Проверка уникальности...</span></div>;
    }
    return null;
  }

  return (
    <div className="main-panel space-y-6">
      <SectionHeading title="Создание Текста" iconName="fas fa-magic-sparkles" />
      
      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-md font-medium text-gray-700 mb-2">Тип документа</label>
          <div className="grid grid-cols-3 gap-2">
            {docTypes.map(d => (
              <OptionButton
                key={d.id}
                option={d}
                isSelected={docType === d.id}
                onClick={handleDocTypeSelect}
                disabled={isGenerating}
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
          disabled={isGenerating}
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
                disabled={isGenerating}
                className="w-full"
            />
        </div>
      </div>
      
      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !docType || !topic}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          <Icon name="fas fa-play" className="mr-2" />
          Создать текст
        </button>
      </div>

      {/* Output Section */}
      {(isGenerating || error || generatedText) && (
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <div className="text-center font-semibold">{renderGenerationStatus()}</div>
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center"><Icon name="fas fa-exclamation-triangle" className="mr-2" />{error}</p>}
          
          {generatedText && (
            <div className="space-y-4">
              <div className="prose prose-custom max-w-none p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: window.DOMPurify.sanitize(window.marked.parse(generatedText)) }} />
              </div>

              <div className="p-4 bg-gray-100 rounded-lg space-y-3">
                {originalityScore !== null ? (
                    <div className="text-center">
                        <p className="text-lg font-bold">Уникальность: <span className="text-green-600">{originalityScore}%</span></p>
                        <p className="text-sm text-gray-600">{originalityExplanation}</p>
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