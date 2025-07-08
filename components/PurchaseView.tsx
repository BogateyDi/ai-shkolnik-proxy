
import React from 'react';
import { Icon } from '@/components/Icon';
import { SectionHeading } from '@/components/SectionHeading';
import type { PurchaseState, PackageInfo } from '@/types';

interface PurchaseViewProps {
  purchaseState: PurchaseState;
  onPurchasePackage: (pack: PackageInfo) => void;
  packages: PackageInfo[];
}

export const PurchaseView: React.FC<PurchaseViewProps> = ({
  purchaseState,
  onPurchasePackage,
  packages,
}) => {
  return (
    <div className="main-panel">
      <SectionHeading title="Покупка генераций" iconName="fas fa-shopping-basket" />
      <div className="space-y-8">
        {/* Purchase Packages Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-700">Наборы</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {packages.map(pack => (
              <div key={pack.id} className="h-full bg-gray-50 rounded-2xl shadow-md p-6 flex flex-col border border-gray-200 hover:shadow-lg transition-shadow text-center">
                <div className="flex-grow w-full">
                  <h4 className="text-lg font-bold text-gray-800">{pack.name}</h4>
                  <p className="text-gray-500 mb-4" style={{ minHeight: '1.25rem' }}>
                      {pack.discount > 0 ? `Экономия ${pack.discount}%` : ''}
                  </p>
                  <p className="text-3xl font-extrabold text-gray-900 mb-6">{pack.price}₽</p>
                </div>
                <button
                  onClick={() => onPurchasePackage(pack)}
                  disabled={purchaseState.isPurchasing}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50"
                >
                  {purchaseState.isPurchasing ? <Icon name="fas fa-spinner fa-spin" /> : 'Купить'}
                </button>
              </div>
            ))}
          </div>
          {purchaseState.status === 'failed' && purchaseState.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm text-center">
                <Icon name="fas fa-exclamation-triangle" className="mr-2" />
                {purchaseState.error}
            </div>
          )}
          {(purchaseState.status === 'waiting' || purchaseState.status === 'claiming' || purchaseState.status === 'creating') && 
            <p className="text-center text-blue-600 mt-2 text-sm flex items-center justify-center gap-2">
                <Icon name="fas fa-spinner fa-spin" /> 
                {purchaseState.status === 'claiming' ? 'Подтверждаем покупку...' : 'Ожидаем завершения покупки...'}
            </p>
          }
        </div>
      </div>
      <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 flex items-start gap-3">
        <Icon name="fas fa-info-circle" className="mt-0.5 text-gray-500 flex-shrink-0" />
        <div>
          <p className="font-bold">Важная рекомендация:</p>
          <p className="mt-1">
            После покупки набора обязательно сохраните сгенерированный код. Непотраченные генерации сможете использовать в другой раз или поделиться кодом с друзьями. <strong>Срок действия кода — 30 дней с момента покупки.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
