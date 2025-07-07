import React, { useRef } from 'react';
import { Icon } from '@/components/Icon';
import { SectionHeading } from '@/components/SectionHeading';
import type { HomeworkHelperState } from '@/types';

interface HomeworkHelperViewProps {
  state: HomeworkHelperState;
  setState: React.Dispatch<React.SetStateAction<HomeworkHelperState>>;
  onGetSolution: () => void;
}

export const HomeworkHelperView: React.FC<HomeworkHelperViewProps> = ({
  state,
  setState,
  onGetSolution,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { file, fileContent, fileType, fileName, isProcessing, solution, error } = state;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setState({
        file: null, 
        fileContent: null, 
        fileType: null, 
        fileName: null, 
        isProcessing: false, 
        solution: null, 
        error: null,
        isSimplifying: false,
    });
  }

  return (
    <div className="main-panel space-y-6">
      <SectionHeading title="Помощник по ДЗ" iconName="fas fa-user-graduate" />
      
      {/* Input */}
      <div className="space-y-4">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,text/plain,.txt,.md"
            className="hidden"
            id="homework-file-input"
            disabled={isProcessing}
        />
        <div 
            onClick={() => !file && fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${file ? 'border-gray-300' : 'border-gray-400 hover:border-blue-500 hover:bg-blue-50'}`}
        >
            {isProcessing ? (
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
                    <button onClick={handleClearFile} className="text-sm text-red-500 hover:underline">
                        <Icon name="fas fa-times" className="mr-1"/>
                        Удалить файл
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
          disabled={isProcessing || !fileContent}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
            <Icon name="fas fa-lightbulb" className="mr-2"/>
            Получить решение
        </button>
      </div>

       {/* Output Section */}
      {(isProcessing || error || solution) && (
        <div className="pt-6 border-t border-gray-200 space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center"><Icon name="fas fa-exclamation-triangle" className="mr-2" />{error}</p>}
          
          {solution && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Готовое решение:</h3>
              <div className="prose prose-custom max-w-none p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: window.DOMPurify.sanitize(window.marked.parse(solution)) }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};