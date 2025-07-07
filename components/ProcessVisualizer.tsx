
import React from 'react';
import { Icon } from '@/components/Icon';

export interface Stage {
  id: string;
  text: string;
  icon: string;
}

interface ProcessVisualizerProps {
  stages: Stage[];
  currentStageId: string;
  title: string;
  isCompleted: boolean;
  error?: string | null;
}

export const ProcessVisualizer: React.FC<ProcessVisualizerProps> = ({
  stages,
  currentStageId,
  title,
  isCompleted,
  error,
}) => {
  const currentStageIndex = stages.findIndex(s => s.id === currentStageId);

  return (
    <div className="mt-8 p-6 bg-slate-800 rounded-lg border border-slate-700 animate-fade-in">
      <h4 className="text-lg font-semibold text-amber-400 mb-4 text-center">{title}</h4>
      
      {error && !isCompleted ? (
         <div className="flex items-center p-3 rounded-md bg-red-900/50 text-red-400">
            <Icon name="fas fa-exclamation-circle" className="h-8 w-8 mr-4" />
            <div>
              <p className="font-bold">Произошла ошибка</p>
              <p className="text-sm">{error}</p>
            </div>
        </div>
      ) : isCompleted ? (
         <div className="flex items-center p-3 rounded-md bg-green-900/50 text-green-400">
            <Icon name="fas fa-check-circle" className="h-8 w-8 mr-4" />
            <span className="font-bold">Процесс успешно завершен!</span>
        </div>
      ) : (
        <div className="space-y-4">
            {stages.map((stage, index) => {
            const isStageCompleted = index < currentStageIndex;
            const isStageCurrent = index === currentStageIndex;
            
            return (
                <div key={stage.id} className={`flex items-center p-3 rounded-md transition-all duration-300 ${
                isStageCurrent ? 'bg-amber-500/10' : ''
                }`}>
                <div className={`flex items-center justify-center h-8 w-8 rounded-full mr-4 transition-colors duration-300 shrink-0 ${
                    isStageCompleted ? 'bg-green-500 text-white' : 
                    isStageCurrent ? 'bg-amber-500 text-slate-900' : 
                    'bg-slate-700 text-slate-500'
                }`}>
                    {isStageCompleted ? <Icon name="fas fa-check" /> : <Icon name={isStageCurrent ? `${stage.icon} fa-spin` : stage.icon} />}
                </div>
                <span className={`font-medium transition-colors duration-300 ${
                    isStageCompleted ? 'text-green-400' : 
                    isStageCurrent ? 'text-amber-300' : 
                    'text-slate-500'
                }`}>{stage.text}</span>
                </div>
            );
            })}
        </div>
      )}
    </div>
  );
};