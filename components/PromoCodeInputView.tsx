
import React, { useState } from 'react';
import { Icon } from '@/components/Icon';
import { SectionHeading } from '@/components/SectionHeading';
import type { PrepaidCodeState } from '@/types';

interface PromoCodeInputViewProps {
  prepaidCodeState: PrepaidCodeState;
  userEnteredCode: string;
  setUserEnteredCode: (code: string) => void;
  onApplyCode: () => void;
  onClearCode: () => void;
}

export const PromoCodeInputView: React.FC<PromoCodeInputViewProps> = ({
  prepaidCodeState,
  userEnteredCode,
  setUserEnteredCode,
  onApplyCode,
  onClearCode,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = () => {
    if (!prepaidCodeState.code) return;
    navigator.clipboard.writeText(prepaidCodeState.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  return (
    <div className="main-panel">
      <SectionHeading title="Активация кода" iconName="fas fa-key" />
        <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl shadow-inner border border-gray-200">
          <label htmlFor="prepaid-code-input" className="block text-md font-medium text-gray-700 mb-2">
            Введите ваш промо-код
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="prepaid-code-input"
              type="text"
              value={userEnteredCode}
              onChange={(e) => setUserEnteredCode(e.target.value.toUpperCase())}
              placeholder="PROMO-CODE"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
              disabled={prepaidCodeState.isValid || prepaidCodeState.isLoading}
            />
            {prepaidCodeState.isValid ? (
              <div className="flex gap-2 flex-shrink-0">
                  <button
                      onClick={handleCopyCode}
                      title="Скопировать код"
                      className={`px-4 py-2 text-white text-sm font-semibold rounded-md transition-colors ${isCopied ? 'bg-teal-500' : 'bg-teal-600 hover:bg-teal-700'}`}
                  >
                      <Icon name={isCopied ? "fas fa-check" : "far fa-copy"} />
                  </button>
                  <button onClick={onClearCode} className="px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-md hover:bg-gray-600 transition-colors">
                      Сменить
                  </button>
              </div>
            ) : (
              <button
                onClick={onApplyCode}
                disabled={!userEnteredCode || prepaidCodeState.isLoading}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 disabled:opacity-50 sm:w-auto transition-colors flex-shrink-0"
              >
                {prepaidCodeState.isLoading ? <Icon name="fas fa-spinner fa-spin" /> : 'Применить'}
              </button>
            )}
          </div>
          {prepaidCodeState.error && (
            <p className="text-red-600 text-sm mt-2">{prepaidCodeState.error}</p>
          )}
          {prepaidCodeState.isValid && prepaidCodeState.remainingUses !== null && (
            <p className="text-green-700 font-semibold text-sm mt-3 bg-green-100 p-2 rounded-md">
              Код '{prepaidCodeState.code}' принят. Осталось генераций: {prepaidCodeState.remainingUses}
            </p>
          )}
        </div>
    </div>
  );
};
