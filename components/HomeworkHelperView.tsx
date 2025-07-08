
import React, { useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { SectionHeading } from '@/components/SectionHeading';
import type { HomeworkHelperState, PrepaidCodeState } from '@/types';

interface HomeworkHelperViewProps {
  state: HomeworkHelperState;
  setState: React.Dispatch<React.SetStateAction<HomeworkHelperState>>;
  onGetSolution: () => void;
  onDownloadSolution: (format: 'txt' | 'docx') => void;
  onSimplifySolution: () => void;
  prepaidCodeState: PrepaidCodeState;
}

export const HomeworkHelperView: React.FC<HomeworkHelperViewProps> = ({
  state,
  setState,
  onGetSolution,
  onDownloadSolution,
  onSimplifySolution,
  prepaidCodeState,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { file, fileContent, fileType, fileName, isProcessing, solution, error, isSimplifying } = state;
  const hasSolution = !!solution;
  const isActionLocked = isProcessing || hasSolution || prepaidCodeState.isLoading;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if(event.target.files?.length === 0) return;
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const isImage = selectedFile.type.startsWith('image/');
    const isText = selectedFile.type.startsWith('text/');

    if (!isImage && !isText) {
      setState(prev => ({...prev, error: "Пожалуйста, загрузите изображение или текстовый файл."}));
      return;
    }
    
    setState(prev => ({...prev, file: selectedFile, fileName: selectedFile.name, error: null, solution: null, isProcessing: true }));

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        setState(prev => ({...prev, fileContent: content, fileType: isImage ? 'image' : 'text', isProcessing: false }));
    };
    reader.onerror = () => {
         setState(prev => ({...prev, error: 'Ошибка при чтении файла.', isProcessing: false }));
    };

    if (isImage) {
        reader.readAsDataURL(selectedFile);
    } else {
        reader.readAsText(selectedFile);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleClearFile = () => {
    setState(prev => ({
        ...prev,
        file: null, 
        fileContent: null, 
        fileType: null, 
        fileName: null, 
        isProcessing: false, 
        solution: null, 
        error: null,
        isSimplifying: false,
    }));
  }

  const handleCopy = () => {
    if (!solution || isCopied) return;
    navigator.clipboard.writeText(solution).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  };

  return (
    <div className="main-panel space-y-6">
      <SectionHeading title="Решение ДЗ, КР, ПР" iconName="fas fa-user-graduate" />
      
      {/* Input */}
      <div className="space-y-4">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,text/plain,.txt,.md"
            className="hidden"
            id="homework-file-input"
            disabled={isActionLocked}
        />
        <div 
            onClick={() => !isActionLocked && !file && fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-lg text-center transition-colors ${
              (isActionLocked || file) ? 'border-gray-300 bg-gray-50 cursor-default' : 'border-gray-400 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
            }`}
        >
            {isProcessing && !solution ? (
                <div className="flex flex-col items-center justify-center gap-2 text-blue-600">
                    <Icon name="fas fa-spinner fa-spin" className="text-2xl" />
                    <span>Обработка...</span>
                </div>
            ) : file && fileName ? (
                <div className="flex flex-col items-center justify-center gap-3">
                    {fileType === 'image' && fileContent && (
                        <img src={fileContent} alt="preview" className="max-h-32 rounded-md border border-gray-300 shadow-sm" />
                    )}
                    {fileType === 'text' && (
                        <Icon name="far fa-file-alt" className="text-4xl text-gray-500" />
                    )}
                    <span className="font-medium text-gray-700">{fileName}</span>
                    <button 
                        onClick={handleClearFile} 
                        className="text-sm text-red-500 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                        disabled={isActionLocked}
                    >
                        <Icon name="fas fa-times" className="mr-1"/>
                        Удалить и начать заново
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Icon name="fas fa-cloud-upload-alt" className="text-4xl"/>
                    <p className="font-semibold">Нажмите или перетащите файл</p>
                    <p className="text-sm">Загрузите фото или текстовый файл с заданием</p>
                </div>
            )}
        </div>
      </div>
      
      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={onGetSolution}
          disabled={isActionLocked || !fileContent || !prepaidCodeState.isValid}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
            <Icon name="fas fa-lightbulb" className="mr-2"/>
            Получить решение
        </button>
        {(!prepaidCodeState.isValid && !prepaidCodeState.isLoading) && (
            <p className="text-center text-sm text-slate-600 mt-2">
                <Icon name="fas fa-info-circle" className="mr-1" />
                Для генерации нужен активный код. Приобретите пакет или введите код ниже.
            </p>
        )}
      </div>

       {/* Output Section */}
      {(isProcessing || error || solution || isSimplifying) && (
        <div className="pt-6 border-t border-gray-200 space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center"><Icon name="fas fa-exclamation-triangle" className="mr-2" />{error}</p>}
          
          {isProcessing && !solution && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Icon name="fas fa-spinner fa-spin" />
                  <span>Получаю решение...</span>
              </div>
          )}

          {isSimplifying && (
              <div className="flex items-center justify-center gap-2 text-purple-600">
                  <Icon name="fas fa-spinner fa-spin" />
                  <span>Упрощаю объяснение...</span>
              </div>
          )}

          {solution && !isSimplifying && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800">Готовое решение:</h3>
                <button
                    onClick={onSimplifySolution}
                    disabled={isProcessing || isSimplifying}
                    className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-1 px-3 rounded-lg shadow text-sm disabled:opacity-50"
                    title="Объяснить проще"
                >
                    <Icon name="fas fa-child"/>
                    <span>Объясни проще</span>
                </button>
              </div>

              <div className="prose prose-custom max-w-none p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: window.DOMPurify.sanitize(window.marked.parse(solution)) }} />
              </div>
              
              {/* Download Section */}
              <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
                  <h4 className="text-lg font-semibold text-gray-700 text-center">Действия с решением</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button 
                          onClick={handleCopy} 
                          className={`flex items-center justify-center gap-2 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors ${isCopied ? 'bg-teal-500' : 'bg-gray-500 hover:bg-gray-600'}`}>
                          <Icon name={isCopied ? 'fas fa-check' : 'far fa-copy'} /> {isCopied ? 'Скопировано' : 'Копировать'}
                      </button>
                      <button onClick={() => onDownloadSolution('txt')} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg shadow disabled:opacity-50">
                          <Icon name="far fa-file-alt" /> .txt
                      </button>
                      <button onClick={() => onDownloadSolution('docx')} className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg shadow disabled:opacity-50">
                          <Icon name="far fa-file-word" /> .docx
                      </button>
                  </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
