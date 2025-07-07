
import React from 'react';
import { Icon } from '@/components/Icon';
import type { User } from '@/types';

interface HeaderProps {
  isAuthenticated: boolean;
  handleLogout: () => void;
  currentUser: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  handleLogout,
  currentUser,
}) => {
  const getHeaderDescription = () => {
    if (!currentUser) return "Платформа для написания книг с помощью AI, разработанная BogateyDI.";
    return `Создавайте книги с помощью AI: от сценария до готовых глав, выбирая жанр, стиль и объем. Добро пожаловать, ${currentUser.username}!`;
  };
  
  const corePanelClass = "vik-ai-core-panel text-center py-8 px-4 sm:px-6 mb-8 rounded-xl shadow-2xl relative overflow-hidden bg-slate-800/60 border border-slate-700/70 backdrop-blur-sm";


  return (
    <header className="bg-gradient-to-br from-slate-900 via-yellow-900 to-amber-900 text-white pt-8 pb-0 px-4 mb-12 shadow-2xl relative overflow-hidden"> {/* Updated gradient */}
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className={`${corePanelClass}`}>
          <div className="relative z-10">
            {isAuthenticated && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                <button
                  onClick={handleLogout}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium py-1.5 px-3 rounded-md shadow-md transition-colors duration-150 flex items-center"
                  aria-label="Выйти из системы"
                  title="Выйти из системы"
                >
                  <Icon name="fas fa-sign-out-alt" className="mr-1.5 text-sm" />
                  <span className="hidden sm:inline">Выйти</span>
                  <span className="sm:hidden">Выход</span>
                </button>
              </div>
            )}
            <div className='inline-block p-3 sm:p-4 bg-slate-700/60 rounded-full shadow-xl mb-6 pulse-icon-container'>
              <Icon name="fas fa-book-reader" className="text-amber-300 text-4xl sm:text-5xl" /> {/* Updated color */}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 mb-2 sm:mb-3"> {/* Updated gradient */}
              Book AI {currentUser && <span className="text-lg text-slate-400 font-normal">({currentUser.username})</span>}
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-slate-200 mb-6">
              Ваш ИИ-ассистент для написания книг
            </h2>
            <p className="text-md sm:text-lg max-w-3xl mx-auto text-slate-300 mb-8 leading-relaxed px-2">
              {getHeaderDescription()}
            </p>
            <div className="flex justify-center">
              <div className="bg-slate-700/70 border border-slate-600 rounded-lg px-5 py-3 inline-flex items-center shadow-lg">
                <Icon name="fas fa-feather-alt" className="text-amber-400 text-lg sm:text-xl mr-3" /> {/* Updated color */}
                <p className="text-slate-300 text-xs sm:text-sm">AI-платформа для создания литературных произведений</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};