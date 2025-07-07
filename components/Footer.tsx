import React from 'react';
import { Icon } from './Icon';

export const Footer: React.FC = () => {
  return (
    <footer 
        className={`bg-slate-950 text-slate-300 py-12 px-4 mt-20 relative overflow-hidden text-center`}
    > 
      <div className="container mx-auto max-w-7xl relative z-10"> 
        
        <div>
            <h3 className="text-2xl font-bold mb-3 text-amber-400">Book AI</h3> {/* Updated color */}
            <p className="text-slate-400 mt-1 text-sm leading-relaxed max-w-lg mx-auto">
                Платформа для творчества и написания книг с использованием искусственного интеллекта.
            </p>
        </div>

        <hr className="border-slate-700/50 my-8" />
        
        <div>
          <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Book AI | Все права защищены</p>
          <p className="text-md mt-4 font-semibold text-slate-300">
            Разработано <a 
                href="https://t.me/BogateyDI" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-400 hover:text-amber-300 transition-colors duration-300 group underline" /* Updated color */
            >
                BogateyDI
                <Icon name="fas fa-external-link-alt" className="ml-1.5 text-xs opacity-70 group-hover:opacity-100" />
            </a>
          </p>
          <p className="text-xs mt-2 text-slate-500">
            Свяжитесь для сотрудничества или разработки AI-решений.
          </p>
        </div>
      </div>
    </footer>
  );
};