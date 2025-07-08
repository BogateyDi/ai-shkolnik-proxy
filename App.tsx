
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Packer, Paragraph } from 'docx';

import { Icon } from '@/components/Icon';
import { ContentCreatorView } from '@/components/ContentCreatorView';
import { HomeworkHelperView } from '@/components/HomeworkHelperView';
import { CodeManagementView } from '@/components/CodeManagementView';
import type { ContentCreatorState, HomeworkHelperState, PrepaidCodeState, PurchaseState, PackageInfo } from '@/types';

const PROXY_URL = ''; // Now served from the same origin

declare global {
  interface Window {
    marked: any;
    DOMPurify: any;
  }
}

const saveAsUtil = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- Payment Related Types and States ---
type PaymentStatus = 'idle' | 'creating' | 'redirecting' | 'waiting' | 'success' | 'failed' | 'canceled';
interface PaymentState {
  isProcessing: boolean;
  status: PaymentStatus;
  error: string | null;
  pendingAction: (() => Promise<void>) | null;
}

// --- Package Info ---
export const purchasePackages: PackageInfo[] = [
    { id: 'pack10', name: '10 генераций', generations: 10, price: 80, discount: 20, icon: 'fas fa-star' },
    { id: 'pack100', name: '100 генераций', generations: 100, price: 500, discount: 50, icon: 'fas fa-crown' },
];


const App = () => {
  const initialContentCreatorState: ContentCreatorState = { docType: null, topic: '', age: 12, isGenerating: false, generationStep: 'idle', generatedText: null, originalityScore: null, originalityExplanation: null, error: null };
  const initialHomeworkHelperState: HomeworkHelperState = { file: null, fileContent: null, fileType: null, fileName: null, isProcessing: false, solution: null, error: null, isSimplifying: false };
  const initialPaymentState: PaymentState = { isProcessing: false, status: 'idle', error: null, pendingAction: null };
  const initialPrepaidCodeState: PrepaidCodeState = { code: '', isValid: null, remainingUses: null, error: null, isLoading: false };
  const initialPurchaseState: PurchaseState = { isPurchasing: false, status: 'idle', error: null, purchasedCode: null };

  const [contentCreatorState, setContentCreatorState] = useState<ContentCreatorState>(initialContentCreatorState);
  const [homeworkHelperState, setHomeworkHelperState] = useState<HomeworkHelperState>(initialHomeworkHelperState);
  const [paymentState, setPaymentState] = useState<PaymentState>(initialPaymentState);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>(initialPurchaseState);
  const [prepaidCodeState, setPrepaidCodeState] = useState<PrepaidCodeState>(initialPrepaidCodeState);
  const [userEnteredCode, setUserEnteredCode] = useState('');
  
  const paymentPollRef = useRef<{ intervalId: number | null, timeoutId: number | null }>({ intervalId: null, timeoutId: null });
  
  useEffect(() => {
    return () => {
      if (paymentPollRef.current.intervalId) clearInterval(paymentPollRef.current.intervalId);
      if (paymentPollRef.current.timeoutId) clearTimeout(paymentPollRef.current.timeoutId);
    };
  }, []);

  const getGenericApiErrorMessage = (error: unknown, baseMessage: string): string => {
    if (error instanceof Error) return error.message;
    return baseMessage;
  };
  
  const callApiViaProxy = async (payload: { model: string, contents: any, config?: any, prepaidCode?: string }) => {
    const response = await fetch(`${PROXY_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
       const err = new Error(data.error || `Ошибка сервера: ${response.statusText}`);
       (err as any).isCodeError = data.isCodeError;
       throw err;
    }
    return data;
  };

  const clearPaymentPolling = () => {
      if (paymentPollRef.current.intervalId) clearInterval(paymentPollRef.current.intervalId);
      if (paymentPollRef.current.timeoutId) clearTimeout(paymentPollRef.current.timeoutId);
      paymentPollRef.current = { intervalId: null, timeoutId: null };
  };
  
  const pollPaymentStatus = useCallback(async (paymentId: string, onConfirm: (metadata?: any) => Promise<void>, onFail: () => void) => {
    clearPaymentPolling();

    const intervalId = setInterval(async () => {
        try {
            const response = await fetch(`${PROXY_URL}/api/check-payment/${paymentId}`);
            if (!response.ok) throw new Error("Ошибка сервера при проверке платежа.");
            const data = await response.json();

            if (data.status === 'succeeded') {
                clearPaymentPolling();
                await onConfirm(data.metadata);
            } else if (data.status === 'canceled' || data.status === 'failed') {
                clearPaymentPolling();
                onFail();
            }
        } catch (error) {
            clearPaymentPolling();
            onFail();
        }
    }, 3000);

    const timeoutId = setTimeout(() => {
        clearPaymentPolling();
        if ((paymentState.status === 'waiting' && !paymentState.isProcessing) || (purchaseState.status === 'waiting' && !purchaseState.isPurchasing)) {
             onFail();
        }
    }, 5 * 60 * 1000);

    paymentPollRef.current = { intervalId: intervalId as any, timeoutId: timeoutId as any };
  }, [paymentState, purchaseState]);

  const initiatePayment = useCallback(async (description: string, onConfirm: () => Promise<void>) => {
      setPaymentState({ isProcessing: true, status: 'creating', error: null, pendingAction: onConfirm });
      try {
          const response = await fetch(`${PROXY_URL}/api/create-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description, amount: 10, returnUrl: window.location.href }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Не удалось создать платеж.');

          setPaymentState(prev => ({ ...prev, status: 'redirecting' }));
          
          window.open(data.confirmationUrl, '_blank', 'noopener,noreferrer,width=800,height=600');
          setPaymentState(prev => ({ ...prev, status: 'waiting' }));

          await pollPaymentStatus(
              data.paymentId, 
              async () => {
                setPaymentState({ ...initialPaymentState, status: 'success' });
                await onConfirm();
                setTimeout(() => setPaymentState(prev => prev.status === 'success' ? { ...prev, status: 'idle' } : prev), 1000);
              },
              () => setPaymentState({ isProcessing: false, status: 'failed', error: 'Платеж был отменен или не удался.', pendingAction: null })
          );

      } catch (error) {
          setPaymentState({ isProcessing: false, status: 'failed', error: getGenericApiErrorMessage(error, 'Ошибка инициализации платежа.'), pendingAction: null });
      }
  }, [pollPaymentStatus]);

  const docTypeNames = { essay: 'сочинение', report: 'доклад', composition: 'реферат' };

  const handleGenerateText = useCallback(async () => {
    const { docType, topic, age } = contentCreatorState;
    if (!docType || !topic) return;

    setContentCreatorState(prev => ({ ...prev, isGenerating: true, generationStep: 'generating', error: null, generatedText: null, originalityScore: null }));
    
    const docTypeName = docTypeNames[docType];
    const wordCount = Math.round(100 + ((age - 7) / 10) * 650);

    const prompt = `Напиши ${docTypeName} на тему "${topic}" для ученика ${age} лет. Объем ~${wordCount} слов.`;

    try {
      const payload = { model: 'gemini-2.5-flash-preview-04-17', contents: prompt, ...(prepaidCodeState.isValid && { prepaidCode: prepaidCodeState.code }) };
      const response = await callApiViaProxy(payload);
      setContentCreatorState(prev => ({ ...prev, generatedText: response.text, isGenerating: false, generationStep: 'done' }));
      
      if (response.remaining !== undefined) {
         setPrepaidCodeState(prev => ({...prev, remainingUses: response.remaining, isValid: response.remaining > 0}));
         if (response.remaining <= 0) setUserEnteredCode('');
      }

    } catch (error) {
      const typedError = error as Error & { isCodeError?: boolean };
      if (typedError.isCodeError) {
        setPrepaidCodeState({...initialPrepaidCodeState, error: typedError.message});
        setUserEnteredCode('');
      }
      setContentCreatorState(prev => ({ ...prev, error: getGenericApiErrorMessage(error, "Ошибка."), isGenerating: false, generationStep: 'error' }));
    }
  }, [contentCreatorState, prepaidCodeState]);

  const handleRequestGeneration = useCallback(() => {
    if (prepaidCodeState.isValid && prepaidCodeState.remainingUses && prepaidCodeState.remainingUses > 0) {
      handleGenerateText();
    } else {
      initiatePayment('Генерация текста (АЙ - Школьник)', handleGenerateText);
    }
  }, [handleGenerateText, initiatePayment, prepaidCodeState]);

  const handleCheckOriginality = useCallback(async () => {
    if (!contentCreatorState.generatedText) return;
    setContentCreatorState(prev => ({ ...prev, isGenerating: true, generationStep: 'checking_originality', error: null }));
    const prompt = `Оцени уникальность текста по шкале 0-100% и дай краткое пояснение. Ответ в JSON: {"score": number, "explanation": string}. Текст: ${contentCreatorState.generatedText}`;
    try {
      const response = await callApiViaProxy({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt, config: { responseMimeType: 'application/json' } });
      let jsonStr = response.text.trim().match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s)?.[2]?.trim() || response.text.trim();
      const result = JSON.parse(jsonStr);
      setContentCreatorState(prev => ({ ...prev, originalityScore: result.score, originalityExplanation: result.explanation, isGenerating: false, generationStep: 'done' }));
    } catch (error) {
      setContentCreatorState(prev => ({ ...prev, error: getGenericApiErrorMessage(error, "Ошибка."), isGenerating: false, generationStep: 'error' }));
    }
  }, [contentCreatorState.generatedText]);

  const handleIncreaseUniqueness = useCallback(async () => {
    const { generatedText, docType, topic, age } = contentCreatorState;
    if (!generatedText || !docType) return;
    setContentCreatorState(prev => ({ ...prev, isGenerating: true, generationStep: 'improving_uniqueness', error: null }));
    const prompt = `Перепиши текст, чтобы повысить уникальность >70%, сохранив смысл и стиль для ${age} лет. Контекст: ${docTypeNames[docType]} на тему "${topic}". Текст:\n${generatedText}`;
    try {
      const response = await callApiViaProxy({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      setContentCreatorState(prev => ({ ...prev, generatedText: response.text, isGenerating: false, generationStep: 'done', originalityScore: null, originalityExplanation: null }));
    } catch (error) {
      setContentCreatorState(prev => ({ ...prev, error: getGenericApiErrorMessage(error, "Ошибка."), isGenerating: false, generationStep: 'error' }));
    }
  }, [contentCreatorState]);

  const handleGetSolution = useCallback(async () => {
    const { fileContent, fileType } = homeworkHelperState;
    if (!fileContent) return;
    setHomeworkHelperState(prev => ({ ...prev, isProcessing: true, error: null, solution: null }));
    const prompt = `Предоставь пошаговое решение для домашнего задания:`;
    try {
        let contents: any = fileType === 'image' 
            ? { parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: fileContent.split(',')[1] } }] }
            : `${prompt}\n\n${fileContent}`;
        
        const payload = { model: 'gemini-2.5-flash-preview-04-17', contents, ...(prepaidCodeState.isValid && { prepaidCode: prepaidCodeState.code }) };
        const response = await callApiViaProxy(payload);
        setHomeworkHelperState(prev => ({...prev, solution: response.text, isProcessing: false}));
        
        if (response.remaining !== undefined) {
           setPrepaidCodeState(prev => ({...prev, remainingUses: response.remaining, isValid: response.remaining > 0}));
           if (response.remaining <= 0) setUserEnteredCode('');
        }
    } catch(error) {
        const typedError = error as Error & { isCodeError?: boolean };
        if (typedError.isCodeError) {
          setPrepaidCodeState({...initialPrepaidCodeState, error: typedError.message});
          setUserEnteredCode('');
        }
        setHomeworkHelperState(prev => ({...prev, error: getGenericApiErrorMessage(error, "Ошибка."), isProcessing: false}));
    }
  }, [homeworkHelperState.fileContent, homeworkHelperState.fileType, prepaidCodeState]);
  
  const handleRequestSolution = useCallback(() => {
    if (prepaidCodeState.isValid && prepaidCodeState.remainingUses && prepaidCodeState.remainingUses > 0) {
      handleGetSolution();
    } else {
      initiatePayment('Решение ДЗ (АЙ - Школьник)', handleGetSolution);
    }
  }, [handleGetSolution, initiatePayment, prepaidCodeState]);

  const handleSimplifySolution = useCallback(async () => {
    const { solution } = homeworkHelperState;
    if (!solution) return;
    setHomeworkHelperState(prev => ({ ...prev, isSimplifying: true, error: null }));
    const prompt = `Перескажи этот текст максимально просто, как для младшего школьника: ${solution}`;
    try {
        const response = await callApiViaProxy({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
        setHomeworkHelperState(prev => ({...prev, solution: response.text, isSimplifying: false}));
    } catch(error) {
        setHomeworkHelperState(prev => ({...prev, error: getGenericApiErrorMessage(error, "Ошибка."), isSimplifying: false}));
    }
  }, [homeworkHelperState.solution]);
  
  // --- Download handlers ---
  const handleDownloadTxt = useCallback(async (content: string, baseName: string) => await saveAsUtil(new Blob([content], { type: 'text/plain;charset=utf-8' }), `${baseName}.txt`), []);
  const handleDownloadDocx = useCallback(async (content: string, baseName: string, title: string) => {
    const doc = new Document({ creator: "АЙ - Школьник", title, sections: [{ children: content.split('\n').map(p => new Paragraph({ text: p })) }] });
    await saveAsUtil(await Packer.toBlob(doc), `${baseName}.docx`);
  }, []);
  const handleDownloadContent = useCallback((format: 'txt' | 'docx') => {
      const { generatedText, topic } = contentCreatorState;
      if (!generatedText) return;
      const baseName = topic.substring(0, 20).replace(/[^a-z0-9а-яё\s]/gi, '_') || 'документ';
      if (format === 'txt') handleDownloadTxt(generatedText, baseName); else handleDownloadDocx(generatedText, baseName, topic);
  }, [contentCreatorState, handleDownloadTxt, handleDownloadDocx]);
  const handleDownloadSolution = useCallback((format: 'txt' | 'docx') => {
    const { solution, fileName } = homeworkHelperState;
    if (!solution) return;
    const baseName = (fileName || 'решение').split('.')[0];
    if(format === 'txt') handleDownloadTxt(solution, baseName); else handleDownloadDocx(solution, baseName, `Решение для ${fileName}`);
  }, [homeworkHelperState, handleDownloadTxt, handleDownloadDocx]);

  // --- Code and Purchase Handlers ---
  const handleApplyCode = async () => { 
      if (!userEnteredCode) return;
      setPrepaidCodeState({ ...initialPrepaidCodeState, isLoading: true });
      try {
        const response = await fetch(`${PROXY_URL}/api/check-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: userEnteredCode }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPrepaidCodeState({ code: userEnteredCode, isValid: true, remainingUses: data.remaining, error: null, isLoading: false });
      } catch(error) {
        setPrepaidCodeState({ ...initialPrepaidCodeState, error: getGenericApiErrorMessage(error, 'Код не найден.') });
      }
  };
  const handleClearCode = () => { setUserEnteredCode(''); setPrepaidCodeState(initialPrepaidCodeState); };

  const claimPurchasedCode = async (paymentId: string, packageId: string) => {
      setPurchaseState(prev => ({...prev, isPurchasing: true, status: 'claiming'}));
      try {
        const response = await fetch(`${PROXY_URL}/api/claim-package`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, packageId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPurchaseState(prev => ({...prev, isPurchasing: false, status: 'success', purchasedCode: data.purchasedCode}));
        
        // Auto-apply the new code
        setUserEnteredCode(data.purchasedCode);
        setPrepaidCodeState({ ...initialPrepaidCodeState, isLoading: true });
        const checkResponse = await fetch(`${PROXY_URL}/api/check-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: data.purchasedCode }) });
        const checkData = await checkResponse.json();
        if(checkResponse.ok) {
            setPrepaidCodeState({ code: data.purchasedCode, isValid: true, remainingUses: checkData.remaining, error: null, isLoading: false });
        }
        
      } catch (error) {
        setPurchaseState(prev => ({...prev, isPurchasing: false, status: 'failed', error: getGenericApiErrorMessage(error, 'Не удалось получить код.')}));
      }
  };

  const handlePurchasePackage = async (pack: PackageInfo) => {
      setPurchaseState({...initialPurchaseState, isPurchasing: true, status: 'creating'});
      try {
          const response = await fetch(`${PROXY_URL}/api/create-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  description: `Пакет "${pack.name}" для АЙ-Школьник`,
                  amount: pack.price,
                  returnUrl: window.location.href,
                  packageId: pack.id
              }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Не удалось создать платеж.');

          setPurchaseState(prev => ({ ...prev, status: 'redirecting' }));
          window.open(data.confirmationUrl, '_blank', 'noopener,noreferrer');
          setPurchaseState(prev => ({ ...prev, status: 'waiting' }));
          
          await pollPaymentStatus(
              data.paymentId,
              (metadata) => claimPurchasedCode(data.paymentId, metadata.packageId),
              () => setPurchaseState({...initialPurchaseState, status: 'failed', error: 'Покупка отменена или не удалась.'})
          );
      } catch(error) {
          setPurchaseState({...initialPurchaseState, status: 'failed', error: getGenericApiErrorMessage(error, 'Ошибка при покупке.')});
      }
  };

  // --- UI Components ---
  const PaymentModal = () => {
    if (paymentState.status === 'idle' || paymentState.status === 'success') return null;
    
    const isError = paymentState.status === 'failed' || paymentState.status === 'canceled';
    
    const statuses = { 
        creating: 'Создаем безопасную ссылку на оплату...', 
        redirecting: 'Перенаправляем в платежную систему...', 
        waiting: 'Ожидаем подтверждения платежа. Не закрывайте эту страницу.', 
        failed: paymentState.error || 'Произошла ошибка. Попробуйте снова или обратитесь в поддержку.', 
        canceled: 'Платеж был отменен.'
    };
    
    const handleClose = () => {
        clearPaymentPolling();
        setPaymentState(initialPaymentState);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white main-panel text-center p-8 max-w-md w-full animate-fade-in-up">
                {isError ? (
                    <Icon name="fas fa-times-circle" className="text-5xl mb-4 text-red-500" />
                ) : (
                    <Icon name="fas fa-spinner fa-spin" className="text-5xl mb-4 text-blue-500" />
                )}
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {isError ? 'Ошибка' : 'Обработка платежа'}
                </h3>

                <p className="text-md mb-6 text-gray-600">
                    {statuses[paymentState.status] ?? 'Пожалуйста, подождите...'}
                </p>

                {isError && (
                    <button onClick={handleClose} className="w-full bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
                        Закрыть
                    </button>
                )}
            </div>
            <style>{`
              @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in-up {
                animation: fade-in-up 0.3s ease-out forwards;
              }
            `}</style>
        </div>
    );
  };
  
  const PurchasedCodeModal = () => {
    if (purchaseState.status !== 'success' || !purchaseState.purchasedCode) return null;
    const [isCopied, setIsCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(purchaseState.purchasedCode ?? '');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white main-panel text-center p-8 max-w-md w-full">
                <Icon name="fas fa-check-circle" className="text-5xl text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Покупка завершена!</h3>
                <p className="text-gray-600 mb-4">Вот ваш уникальный код. Он уже автоматически применен.</p>
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <span className="font-mono text-xl font-bold text-gray-700">{purchaseState.purchasedCode}</span>
                    <button onClick={handleCopy} className="text-gray-500 hover:text-blue-500 transition-colors">
                        <Icon name={isCopied ? "fas fa-check" : "far fa-copy"} className="text-xl" />
                    </button>
                </div>
                <button onClick={() => setPurchaseState(initialPurchaseState)} className="w-full bg-blue-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-blue-600 transition-colors">
                    Отлично!
                </button>
            </div>
        </div>
    );
  };


  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <PaymentModal />
      <PurchasedCodeModal />
      <header className="w-full max-w-7xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 flex items-center justify-center gap-4">
          <span className="text-white bg-gray-800 rounded-lg p-2 shadow-md"><Icon name="fas fa-robot" /></span>
          АЙ - Школьник
        </h1>
        <p className="mt-2 text-gray-600">Ваш персональный AI-помощник в учебе</p>
      </header>
      
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ContentCreatorView
          state={contentCreatorState}
          setState={setContentCreatorState}
          onGenerate={handleRequestGeneration}
          onCheckOriginality={handleCheckOriginality}
          onIncreaseUniqueness={handleIncreaseUniqueness}
          onDownloadTxt={() => handleDownloadContent('txt')}
          onDownloadDocx={() => handleDownloadContent('docx')}
          isPaymentProcessing={paymentState.isProcessing}
          prepaidCodeState={prepaidCodeState}
        />
        <HomeworkHelperView
          state={homeworkHelperState}
          setState={setHomeworkHelperState}
          onGetSolution={handleRequestSolution}
          onDownloadSolution={handleDownloadSolution}
          onSimplifySolution={handleSimplifySolution}
          isPaymentProcessing={paymentState.isProcessing}
          prepaidCodeState={prepaidCodeState}
        />
      </main>
      
      <div className="w-full max-w-7xl mt-12">
        <CodeManagementView 
            prepaidCodeState={prepaidCodeState}
            purchaseState={purchaseState}
            userEnteredCode={userEnteredCode}
            setUserEnteredCode={setUserEnteredCode}
            onApplyCode={handleApplyCode}
            onClearCode={handleClearCode}
            onPurchasePackage={handlePurchasePackage}
            packages={purchasePackages}
        />
      </div>

      <footer className="w-full max-w-7xl mt-12 pt-8 text-center">
        <div className="text-gray-500 text-sm space-y-4">
          <div className="flex justify-center items-center gap-x-6 gap-y-2 flex-wrap">
            <span>&copy; {new Date().getFullYear()} АЙ - Школьник</span>
            <a href="https://ai-schoolboy.ru" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline transition-colors">Сайт проекта: ai-schoolboy.ru</a>
            <a href="https://t.me/Olishna_gu" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline transition-colors">Партнерство: @Olishna_gu</a>
          </div>
          <div className="text-xs text-gray-400 space-y-2 pt-4 border-t border-gray-200 max-w-3xl mx-auto">
            <p>ИНН 246310275198</p>
            <p className="font-semibold text-gray-500">ВАЖНОЕ УВЕДОМЛЕНИЕ:</p>
            <p>Данный сервис является вспомогательным инструментом и не заменяет самостоятельное обучение. Генерируемые AI материалы могут содержать неточности. Пользователь несет полную ответственность за использование информации, включая проверку на плагиат и соответствие академическим требованиям.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
