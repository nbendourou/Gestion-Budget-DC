

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { KanbanView } from './views/KanbanView';
import { ListView } from './views/ListView';
import { GainsView } from './views/GainsView';
import { BudgetsView } from './views/BudgetsView';
import { Spinner } from './components/Spinner';
import { ToastContainer } from './components/ToastContainer';
import { apiService } from './services/apiService';
import { AppData, ProjectWithDetails, View, ToastMessage } from './types';

function App() {
    const [appData, setAppData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<View>(View.Kanban);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getData();
            
            // FIX: Add a defensive check to ensure data is valid before use.
            // This provides a secondary layer of protection against crashes if the apiService
            // were to return an unexpected value (like null or undefined).
            if (!data || !data.projects) {
                throw new Error("Les données reçues du service API sont invalides.");
            }
            
            if (data.projects.length === 0) {
                throw new Error("Aucun projet trouvé. Vérifiez que votre feuille Google Sheets 'Projects' contient des données et que les noms des feuilles sont corrects (Projects, OrderDetails, GlobalBudgets).");
            }
            setAppData(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.';
            setError(errorMessage);
            addToast('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const addToast = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeToast(id), 5000);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const projectsWithDetails: ProjectWithDetails[] = useMemo(() => {
        if (!appData) return [];
        return appData.projects.map(project => ({
            ...project,
            details: appData.orderDetails.filter(detail => String(detail.poNumber) === String(project.poNumber))
        }));
    }, [appData]);

    const renderView = () => {
        if (!appData) return null;

        switch (currentView) {
            case View.Kanban:
                return <KanbanView projects={projectsWithDetails} onUpdate={fetchData} addToast={addToast} />;
            case View.List:
                // FIX: Pass the required `allBudgetCategories` prop to the ListView component.
                return <ListView projects={projectsWithDetails} onUpdate={fetchData} addToast={addToast} allBudgetCategories={appData.globalBudgets.map(gb => gb.budgetCategory)} />;
            case View.Gains:
                return <GainsView projects={projectsWithDetails} />;
            case View.Budgets:
                // FIX: Pass the required `onUpdate` and `addToast` props to the BudgetsView component.
                return <BudgetsView projects={projectsWithDetails} globalBudgets={appData.globalBudgets} onUpdate={fetchData} addToast={addToast} />;
            default:
                return <KanbanView projects={projectsWithDetails} onUpdate={fetchData} addToast={addToast} />;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
            <Header currentView={currentView} setView={setCurrentView} theme={theme} setTheme={setTheme} />
            <main className="max-w-full mx-auto p-4 sm:p-6 lg:p-8">
                {loading && (
                    <div className="flex justify-center items-center h-96">
                        <Spinner size="lg" />
                    </div>
                )}
                {error && !loading && (
                    <div className="text-center p-8 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
                        <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
                        <p>{error}</p>
                        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                            Réessayer
                        </button>
                    </div>
                )}
                {!loading && !error && appData && renderView()}
            </main>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

export default App;