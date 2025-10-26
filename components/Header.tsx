
import React from 'react';
import { View } from '../types';
import { SunIcon, MoonIcon, TableCellsIcon, QueueListIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

const navItems = [
    { view: View.Kanban, icon: QueueListIcon, label: 'Kanban' },
    { view: View.List, icon: TableCellsIcon, label: 'Liste' },
    { view: View.Gains, icon: CurrencyDollarIcon, label: 'Gains' },
    { view: View.Budgets, icon: ChartBarIcon, label: 'Budgets' }
];


export const Header: React.FC<HeaderProps> = ({ currentView, setView, theme, setTheme }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <header className="bg-white dark:bg-slate-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                           Gestion Budgétaire
                        </h1>
                         <p className="text-xs text-slate-500 dark:text-slate-400">Suivi des commandes et projets</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => setView(item.view)}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                                        currentView === item.view
                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-white'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5 mr-2" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                        {theme === 'light' ? (
                            <MoonIcon className="h-6 w-6" />
                        ) : (
                            <SunIcon className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>
             <div className="md:hidden bg-slate-100 dark:bg-slate-900/50 p-2">
                <div className="flex justify-around items-center space-x-1">
                     {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setView(item.view)}
                            className={`flex-1 flex flex-col items-center px-2 py-2 rounded-md text-xs font-medium ${
                                currentView === item.view
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-white'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                        >
                            <item.icon className="h-5 w-5 mb-1" />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
};
