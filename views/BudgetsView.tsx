import React, { useMemo, useState, useEffect } from 'react';
import { ProjectWithDetails, GlobalBudget, Project, PVData, PVItem, OrderDetail } from '../types';
import { formatToMAD, formatToMDH } from '../utils/formatters';
import { apiService } from '../services/apiService';
import { Modal } from '../components/Modal';
import { PencilIcon, TrashIcon, PlusIcon, InboxIcon, ClockIcon, CalendarDaysIcon, PrinterIcon, ArrowUturnLeftIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { KANBAN_STATUSES } from '../constants';
import { Spinner } from '../components/Spinner';

// --- COMPOSANT DE PRÉVISUALISATION DU PV ---
const PVDocument: React.FC<{ pvData: PVData, onBack: () => void }> = ({ pvData, onBack }) => {

    const docTitle = `PV Interne (${pvData.project.fournisseur}) PO N° (${pvData.project.poNumber})`;

    const handlePrint = () => {
        const printContent = document.getElementById('printable-area');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'height=800,width=800');
        if (!printWindow) {
            alert('Veuillez autoriser les fenêtres pop-up pour pouvoir imprimer le document.');
            return;
        }

        const isDarkMode = document.documentElement.classList.contains('dark');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="fr" class="${isDarkMode ? 'dark' : ''}">
                <head>
                    <meta charset="UTF-8" />
                    <title>${docTitle}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <script>
                      tailwind.config = {
                        darkMode: 'class',
                        theme: {
                          extend: {
                            fontFamily: {
                              sans: ['Inter', 'sans-serif'],
                            },
                          },
                        },
                      }
                    </script>
                    <style>
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        @media print {
                            body, html {
                               -webkit-print-color-adjust: exact;
                               print-color-adjust: exact;
                               background-color: #fff !important;
                            }
                            .dark {
                                background-color: #fff !important;
                                color: #000 !important;
                            }
                            .dark .bg-slate-800 { background-color: #fff !important; }
                            .dark .text-white { color: #000 !important; }
                            .page-content {
                                padding: 1.5cm 2cm 2cm 2cm !important;
                                box-shadow: none !important;
                                margin-bottom: 0 !important;
                                max-width: none !important;
                            }
                        }
                    </style>
                </head>
                <body class="bg-white">
                    ${printContent.innerHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        
        // A short delay is crucial to ensure all styles from the CDN are loaded and applied by the browser.
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 1000);
    };
    
    const ITEMS_PER_PAGE = 25;

    const signatureDate = new Date(pvData.pvDate).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    useEffect(() => {
        const originalTitle = document.title;
        document.title = docTitle;

        return () => {
            document.title = originalTitle;
        };
    }, [docTitle]);

    const itemChunks: PVItem[][] = [];
    if (pvData.items.length === 0) {
        itemChunks.push([]); // Assure qu'au moins une page est rendue même sans articles
    } else {
        for (let i = 0; i < pvData.items.length; i += ITEMS_PER_PAGE) {
            itemChunks.push(pvData.items.slice(i, i + ITEMS_PER_PAGE));
        }
    }
    const totalPages = itemChunks.length;

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen p-4 sm:p-8">
            <div id="printable-area">
                {itemChunks.map((chunk, pageIndex) => (
                    <div 
                        key={pageIndex} 
                        className="page-content max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-lg p-8 sm:p-12 mb-8 flex flex-col" 
                        style={{ pageBreakAfter: pageIndex < totalPages - 1 ? 'always' : 'auto', minHeight: '29.7cm' }}
                    >
                        <header className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg" alt="Orange Logo" className="w-24"/>
                                {pageIndex === 0 && (
                                    <div className="mt-8">
                                        <h1 className="text-3xl font-bold">Procès-Verbal de Réception</h1>
                                        <h2 className="text-3xl font-bold">En Interne</h2>
                                    </div>
                                )}
                            </div>
                            <div className="text-right text-sm">
                                <p className="font-bold">Direction des opérations</p>
                                <p>Direction Centrale</p>
                                <p>Technique</p>
                            </div>
                        </header>

                        {pageIndex === 0 ? (
                            <>
                                <hr className="border-black my-4" />
                                
                                <div className="grid grid-cols-2 gap-x-8 text-sm mb-4">
                                    {/* Left Column */}
                                    <div className="space-y-1">
                                        <p><span className="font-bold">Fournisseur :</span> {pvData.project.fournisseur}</p>
                                        <p><span className="font-bold">Objet :</span> {pvData.project.projectName}</p>
                                        <p><span className="font-bold">Référence PV</span></p>
                                        <p><span className="font-bold">Date PV :</span> {new Date(pvData.pvDate).toLocaleDateString('fr-FR')}</p>
                                        <p><span className="font-bold">Réf. Contrat</span> {pvData.refContrat || ''}</p>
                                    </div>
                                    {/* Right Column */}
                                    <div className="space-y-1">
                                        <p><span className="font-bold">Facture</span></p>
                                        <p><span className="font-bold">Réf. Contrat Cadre SAP</span> {pvData.refContratSAP || ''}</p>
                                        <p><span className="font-bold">Bon de commande :</span> {pvData.project.poNumber}</p>
                                        <p><span className="font-bold">Période Du</span> {pvData.periodeDu || ''}</p>
                                        <p><span className="font-bold">Au</span> {pvData.periodeAu || ''}</p>
                                    </div>
                                </div>

                                <hr className="border-black my-8" />
                                
                                <p className="text-sm mb-6">Les services/équipements relatives aux contrat/BC/Facture/Période cités ci-dessus ont été bien réalisés selon les termes du bon de commande et/ou dispositions contractuelles convenus entre Meditel et {pvData.project.fournisseur}.</p>
                                <p className="text-sm mb-6">Ce PV a été dressé aux fins de preuve et de confirmation de la bonne réalisation des dites prestations sous réserves des remarques ci-dessous</p>
                                <div className="mb-6">
                                    <h3 className="font-bold underline">Réserves Mineures</h3>
                                    <p className="pt-2 text-sm">{pvData.reserves || '....................'}</p>
                                    <p className="pt-2 text-sm">....................</p>
                                </div>
                                 <div className="mb-6">
                                    <h3 className="font-bold underline">Réserves Majeures</h3>
                                    <p className="pt-2 text-sm">....................</p>
                                    <p className="pt-2 text-sm">....................</p>
                                </div>
                                <div className="mb-8">
                                    <h3 className="font-bold underline">Dispositions Contractuelles Sujettes de Validation</h3>
                                </div>
                            </>
                        ) : (
                             <div className="text-right text-sm mb-4">
                                <p className="font-bold">Suite du Procès-Verbal - Page {pageIndex + 1}/{totalPages}</p>
                                <p>Bon de Commande: {pvData.project.poNumber}</p>
                            </div>
                        )}

                        {chunk.length > 0 && (
                             <table className="w-full text-sm mt-2 border-collapse border border-black">
                                <thead>
                                    <tr className="bg-gray-200 dark:bg-slate-700">
                                        <th className="border border-black p-2 text-left font-bold">POS</th>
                                        <th className="border border-black p-2 text-left font-bold">Désignation</th>
                                        <th className="border border-black p-2 text-center font-bold">Quantité livrée / % de réalisation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chunk.map(item => (
                                        <tr key={item.lineId}>
                                            <td className="border border-black p-2">{item.lineId}</td>
                                            <td className="border border-black p-2">{item.description}</td>
                                            <td className="border border-black p-2 text-center">{item.quantityToReceive}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        
                        {pageIndex === totalPages - 1 && (
                             <div className="mt-8">
                                <div className="flex items-center justify-start mb-12 text-sm">
                                    <p className="font-bold mr-4">Est-ce que ce document constitue un « Bon à Payer » ?</p>
                                    <div className="flex items-center mr-4">
                                        Oui <span className={`inline-block w-5 h-5 border border-black ml-2 text-center font-bold flex items-center justify-center`}>{pvData.isBonAPayer ? 'X' : <>&nbsp;</>}</span>
                                    </div>
                                    <div className="flex items-center">
                                        Non <span className={`inline-block w-5 h-5 border border-black ml-2 text-center font-bold flex items-center justify-center`}>{!pvData.isBonAPayer ? 'X' : <>&nbsp;</>}</span>
                                    </div>
                                </div>
                                 <table className="w-full text-sm border-collapse border border-black mb-4">
                                    <thead>
                                        <tr>
                                            <th className="border border-black p-2 w-1/3"></th>
                                            <th className="border border-black p-2 font-bold bg-gray-300 dark:bg-slate-600">Meditel</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-2"><span className="font-bold">Nom du signataire</span></td>
                                            <td className="border border-black p-2">{pvData.signatoryName}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2"><span className="font-bold">Qualité du signataire</span></td>
                                            <td className="border border-black p-2">{pvData.signatoryRole}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2"><span className="font-bold">Date</span></td>
                                            <td className="border border-black p-2">{signatureDate}</td>
                                        </tr>
                                        <tr style={{height: "100px"}}>
                                            <td className="border border-black p-2"><span className="font-bold">Cachet et signature</span></td>
                                            <td className="border border-black p-2 relative align-bottom">
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        <div className="mt-auto pt-4" />
                    </div>
                ))}
            </div>

             <div className="max-w-4xl mx-auto mt-4 flex justify-end space-x-4 print:hidden">
                <button onClick={onBack} className="flex items-center px-4 py-2 bg-slate-500 text-white rounded-md hover:bg-slate-600">
                    <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                    Retour
                </button>
                <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Imprimer / Sauvegarder PDF
                </button>
            </div>
        </div>
    );
};


// --- MODALE DE GÉNÉRATION DE PV ---
const PVGenerationModal: React.FC<{
    project: ProjectWithDetails,
    isOpen: boolean,
    onClose: () => void,
    onGenerate: (data: PVData) => void,
}> = ({ project, isOpen, onClose, onGenerate }) => {
    const [itemsToReceive, setItemsToReceive] = useState<{[key: string]: { selected: boolean, item: PVItem }}>({});
    const [reserves, setReserves] = useState('RAS');
    const [isBonAPayer, setIsBonAPayer] = useState(false);
    const [signatoryName, setSignatoryName] = useState('Nassim Bendourou');
    const [signatoryRole, setSignatoryRole] = useState('SM Data Center');
    const [pvDate, setPvDate] = useState(new Date().toISOString().split('T')[0]);
    const [refContrat, setRefContrat] = useState('');
    const [refContratSAP, setRefContratSAP] = useState('');
    const [periodeDu, setPeriodeDu] = useState('');
    const [periodeAu, setPeriodeAu] = useState('');
    
    useEffect(() => {
        if (project) {
            const initialItems = project.details.reduce((acc, detail) => {
                const remainingQty = detail.quantity - (detail.quantityReceived || 0);
                if (remainingQty > 0) {
                     acc[detail.lineId] = {
                        selected: true,
                        item: {
                            lineId: detail.lineId,
                            description: detail.description,
                            quantityToReceive: remainingQty,
                        }
                    };
                }
                return acc;
            }, {} as {[key: string]: { selected: boolean, item: PVItem }});
            setItemsToReceive(initialItems);
        }
    }, [project]);

    const handleGenerateClick = () => {
        const selectedItems = Object.values(itemsToReceive)
            // FIX: Explicitly type the parameter 'i' to resolve incorrect type inference to 'unknown'.
            .filter((i: { selected: boolean, item: PVItem }) => i.selected && i.item.quantityToReceive > 0)
            // FIX: Explicitly type the parameter 'i' to resolve incorrect type inference to 'unknown'.
            .map((i: { selected: boolean, item: PVItem }) => i.item);
        
        if (selectedItems.length === 0) {
            alert("Veuillez sélectionner au moins un article à réceptionner.");
            return;
        }

        onGenerate({
            project,
            items: selectedItems,
            pvDate,
            reserves,
            isBonAPayer,
            signatoryName,
            signatoryRole,
            refContrat,
            refContratSAP,
            periodeDu,
            periodeAu,
        });
    };

    const handleItemSelection = (lineId: string, isSelected: boolean) => {
        setItemsToReceive(prev => ({
            ...prev,
            [lineId]: { ...prev[lineId], selected: isSelected }
        }));
    };
    
    const handleQuantityChange = (lineId: string, qty: number) => {
         setItemsToReceive(prev => ({
            ...prev,
            [lineId]: { ...prev[lineId], item: {...prev[lineId].item, quantityToReceive: qty} }
        }));
    };
    
    if (!project) return null;
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`PV de Réception Interne - BC: ${project.poNumber}`} size="5xl">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-4">
                         <div><label className="font-bold block">Date du PV</label><input type="date" value={pvDate} onChange={e => setPvDate(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" /></div>
                         <div><label className="font-bold block">Réf. Contrat</label><input type="text" value={refContrat} onChange={e => setRefContrat(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" /></div>
                         <div><label className="font-bold block">Réf. Contrat Cadre SAP</label><input type="text" value={refContratSAP} onChange={e => setRefContratSAP(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" /></div>
                         <div className="flex gap-2">
                            <div className="flex-1"><label className="font-bold block">Période Du</label><input type="date" value={periodeDu} onChange={e => setPeriodeDu(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" /></div>
                            <div className="flex-1"><label className="font-bold block">Au</label><input type="date" value={periodeAu} onChange={e => setPeriodeAu(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" /></div>
                         </div>
                    </div>
                    <div className="space-y-4">
                        <div><label className="font-bold block">Nom du Signataire</label><input type="text" value={signatoryName} onChange={e => setSignatoryName(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" /></div>
                        <div><label className="font-bold block">Qualité du Signataire</label><input type="text" value={signatoryRole} onChange={e => setSignatoryRole(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" /></div>
                        <div><label className="font-bold block">Réserves</label><textarea value={reserves} onChange={e => setReserves(e.target.value)} rows={3} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600"></textarea></div>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold mb-2">Articles à inclure dans le PV</h4>
                    <div className="max-h-60 overflow-y-auto border rounded-md dark:border-slate-600">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                             <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0"><tr>
                                <th className="p-2 w-10"></th>
                                <th className="p-2 text-left">Description</th>
                                <th className="p-2 text-right">Qté Cde</th>
                                <th className="p-2 text-right">Qté Reçue</th>
                                <th className="p-2 text-right w-32">Qté à Réceptionner</th>
                            </tr></thead>
                            <tbody>
                                {project.details.map(d => {
                                    const remaining = d.quantity - (d.quantityReceived || 0);
                                    if (remaining <= 0) return null;
                                    return (
                                        <tr key={d.lineId}>
                                            <td className="p-2 text-center"><input type="checkbox" checked={itemsToReceive[d.lineId]?.selected || false} onChange={e => handleItemSelection(d.lineId, e.target.checked)} /></td>
                                            <td className="p-2">{d.description}</td>
                                            <td className="p-2 text-right">{d.quantity}</td>
                                            <td className="p-2 text-right">{d.quantityReceived || 0}</td>
                                            <td className="p-2 text-right"><input type="number" min="0" max={remaining} value={itemsToReceive[d.lineId]?.item.quantityToReceive || 0} onChange={e => handleQuantityChange(d.lineId, Number(e.target.value))} className="w-full text-right p-1 rounded bg-slate-100 dark:bg-slate-700" /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="mt-6 flex justify-between items-center">
                    <div className="flex items-center">
                        <input type="checkbox" id="bonAPayer" checked={isBonAPayer} onChange={e => setIsBonAPayer(e.target.checked)} className="h-4 w-4" />
                        <label htmlFor="bonAPayer" className="ml-2">Constitue un "Bon à Payer"</label>
                    </div>
                    <button onClick={handleGenerateClick} className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center">
                        Prévisualiser et Imprimer le PV
                    </button>
                </div>
            </div>
        </Modal>
    );
};


interface BudgetsViewProps {
    projects: ProjectWithDetails[];
    globalBudgets: GlobalBudget[];
    onUpdate: () => void;
    addToast: (type: 'success' | 'error', message: string) => void;
}

const StatCard: React.FC<{ title: string; value: string; description: string; }> = ({ title, value, description }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
);

export const BudgetsView: React.FC<BudgetsViewProps> = ({ projects, globalBudgets, onUpdate, addToast }) => {
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
    const [isEngagedDetailModalOpen, setIsEngagedDetailModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<{
        name: string;
        allocated: number;
        consumed: number;
        engaged: number;
        rowIndex: number;
        remaining: number;
        consumptionPercentage: number;
    } | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<{ name: string; projects: ProjectWithDetails[] } | null>(null);
    const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<{ name: string; projects: Project[]; total: number; } | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newAllocatedBudget, setNewAllocatedBudget] = useState(0);

    // --- State for PV Generation ---
    const [isPVModalOpen, setIsPVModalOpen] = useState(false);
    const [projectForPV, setProjectForPV] = useState<ProjectWithDetails | null>(null);
    const [pvDataForPrint, setPvDataForPrint] = useState<PVData | null>(null);

    const budgetData = useMemo(() => {
        const engagedStatuses = new Set(KANBAN_STATUSES.slice(3)); // "Processus Achats" and onwards
        const categories = new Map<string, { allocated: number; consumed: number; engaged: number; rowIndex: number }>();

        globalBudgets.forEach(gb => {
            categories.set(gb.budgetCategory, {
                allocated: Number(gb.allocatedBudget || 0) * 1_000_000,
                consumed: 0,
                engaged: 0,
                rowIndex: gb.rowIndex,
            });
        });

        projects.forEach(p => {
            if (p.budgetCategory) {
                const category = categories.get(p.budgetCategory);
                if (category) {
                    if (p.fournisseur?.toLowerCase().includes('srm') && p.statut === "Projet Clôturé") {
                        category.consumed += Number(p.allocatedBudget || 0);
                    } else {
                        category.consumed += Number(p.totalOrdered || 0);
                    }
                    
                    if (p.numDA && p.statut && engagedStatuses.has(p.statut)) {
                        category.engaged += Number(p.allocatedBudget || 0);
                    }
                }
            }
        });

        const totalGlobalBudget = Array.from(categories.values()).reduce((sum, cat) => sum + cat.allocated, 0);
        const totalConsumed = Array.from(categories.values()).reduce((sum, cat) => sum + cat.consumed, 0);
        const totalEngaged = Array.from(categories.values()).reduce((sum, cat) => sum + cat.engaged, 0);

        return {
            categoryDetails: Array.from(categories.entries()).map(([name, data]) => ({
                name,
                ...data,
                remaining: data.allocated - data.engaged,
                consumptionPercentage: data.allocated > 0 ? (data.consumed / data.allocated) * 100 : 0,
            })).sort((a, b) => b.allocated - a.allocated),
            totalGlobalBudget,
            totalConsumed,
            totalEngaged,
            totalRemaining: totalGlobalBudget - totalEngaged,
        };
    }, [projects, globalBudgets]);
    
    const projectsAwaitingPO = useMemo(() => {
        return projects.filter(p => 
            !p.poNumber && 
            p.allocatedBudget > 0 && 
            !p.fournisseur?.toLowerCase().includes('srm')
        );
    }, [projects]);
    
    const projectsAwaitingForecasts = useMemo(() => {
        return projects
            .filter(p => p.poNumber && p.details.length > 0)
            .filter(p => {
                const totalForecastedQty = p.details.reduce((sum, detail) => {
                    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                    const itemSum = months.reduce((monthSum, month) => monthSum + Number((detail as any)[month] || 0), 0);
                    return sum + itemSum;
                }, 0);
                return totalForecastedQty === 0;
            });
    }, [projects]);

    const monthlyForecasts = useMemo(() => {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const totals: { [key: string]: number } = {};
        months.forEach(m => totals[m] = 0);

        projects.forEach(p => {
            p.details.forEach(d => {
                months.forEach(m => {
                    const qty = Number((d as any)[m] || 0);
                    const price = Number(d.unitPrice || 0);
                    totals[m] += qty * price;
                });
            });
        });
        return totals;
    }, [projects]);
    
    const monthNames: { [key: string]: string } = {
      jan: "Janvier", feb: "Février", mar: "Mars", apr: "Avril", may: "Mai", jun: "Juin",
      jul: "Juillet", aug: "Août", sep: "Septembre", oct: "Octobre", nov: "Novembre", dec: "Décembre"
    };

    const handleMonthClick = (monthKey: string) => {
        const projectsInMonth = projects.filter(p =>
            p.details.some(d => Number((d as any)[monthKey] || 0) > 0)
        );
        setSelectedMonth({ name: monthNames[monthKey], projects: projectsInMonth });
        setIsForecastModalOpen(true);
    };
    
    const openPVModal = (project: ProjectWithDetails) => {
        setProjectForPV(project);
        setIsPVModalOpen(true);
        setIsForecastModalOpen(false); // Close the other modal
    };

    const handleGeneratePV = (data: PVData) => {
        setPvDataForPrint(data);
        setIsPVModalOpen(false);
    };

    const openAddModal = () => {
        setSelectedBudget(null);
        setNewCategoryName('');
        setNewAllocatedBudget(0);
        setIsBudgetModalOpen(true);
    };

    const openEditModal = (budget: { name: string; allocated: number; consumed: number; engaged: number; rowIndex: number; remaining: number; consumptionPercentage: number; }) => {
        setSelectedBudget(budget);
        setNewCategoryName(budget.name);
        setNewAllocatedBudget(budget.allocated / 1_000_000);
        setIsBudgetModalOpen(true);
    };

    const openDeleteModal = (budget: { name: string; allocated: number; consumed: number; engaged: number; rowIndex: number; remaining: number; consumptionPercentage: number; }) => {
        setSelectedBudget(budget);
        // FIX: Cannot find name 'setIsDeleteModal'. Did you mean 'setIsDeleteModalOpen'?
        setIsDeleteModalOpen(true);
    };
    
    const handleEngagedClick = (categoryName: string) => {
        const engagedStatuses = new Set(KANBAN_STATUSES.slice(3));
        const engagedProjects = projects.filter(p => 
            p.budgetCategory === categoryName &&
            p.numDA && 
            p.statut && 
            engagedStatuses.has(p.statut)
        );
        const totalEngaged = engagedProjects.reduce((sum, p) => sum + Number(p.allocatedBudget || 0), 0);
        
        setSelectedCategoryDetails({
            name: categoryName,
            projects: engagedProjects,
            total: totalEngaged,
        });
        setIsEngagedDetailModalOpen(true);
    };


    const closeModal = () => {
        setIsBudgetModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsEngagedDetailModalOpen(false);
        setSelectedBudget(null);
    };

    const handleSave = async () => {
        if (!newCategoryName || newAllocatedBudget <= 0) {
            addToast('error', 'Veuillez remplir tous les champs.');
            return;
        }
        setIsSaving(true);
        try {
            if (selectedBudget) {
                await apiService.updateBudgetCategory({
                    budgetCategory: newCategoryName,
                    allocatedBudget: newAllocatedBudget,
                    rowIndex: selectedBudget.rowIndex,
                });
                addToast('success', 'Catégorie mise à jour.');
            } else {
                await apiService.createBudgetCategory({
                    budgetCategory: newCategoryName,
                    allocatedBudget: newAllocatedBudget,
                });
                addToast('success', 'Catégorie ajoutée.');
            }
            onUpdate();
            closeModal();
        } catch (err) {
            addToast('error', `Échec de la sauvegarde: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBudget) return;
        setIsSaving(true);
        try {
            // FIX: The `rowIndex` type was being inferred incorrectly, causing a type error.
            // Using Number() ensures compatibility with the API service and is safer than a type cast.
            await apiService.deleteBudgetCategory(Number(selectedBudget.rowIndex));
            addToast('success', 'Catégorie supprimée.');
            onUpdate();
            closeModal();
        } catch (err) {
            addToast('error', `Échec de la suppression: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    // If printing a PV, render only that component
    if (pvDataForPrint) {
        return <PVDocument pvData={pvDataForPrint} onBack={() => setPvDataForPrint(null)} />;
    }
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Budget Global Total" value={formatToMDH(budgetData.totalGlobalBudget)} description="Budget total sur toutes les catégories" />
                <StatCard title="Total Commandé" value={formatToMDH(budgetData.totalConsumed)} description="Montant total des commandes émises" />
                <StatCard title="Budget Restant" value={formatToMDH(budgetData.totalRemaining)} description="Budget alloué moins budget engagé" />
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg">
                <div className="flex justify-between items-center p-4">
                    <h2 className="text-xl font-semibold">Répartition par Catégorie</h2>
                    <button onClick={openAddModal} className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Ajouter une Catégorie
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Budget Alloué</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Budget Engagé</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Commandé</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Restant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Consommation</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {budgetData.categoryDetails.map(cat => (
                                <tr key={cat.name}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{cat.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatToMDH(cat.allocated)}</td>
                                    <td 
                                        className="px-6 py-4 whitespace-nowrap text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        onClick={() => handleEngagedClick(cat.name)}
                                    >
                                        {formatToMDH(cat.engaged)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatToMDH(cat.consumed)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">{formatToMDH(cat.remaining)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${Math.min(cat.consumptionPercentage, 100)}%` }}></div>
                                            </div>
                                            <span className="text-xs ml-2">{cat.consumptionPercentage.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button onClick={() => openEditModal(cat)} className="text-yellow-500 hover:text-yellow-700 mr-2"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => openDeleteModal(cat)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
                    <h3 className="font-semibold flex items-center mb-4"><ClockIcon className="h-6 w-6 mr-2 text-yellow-500" />Projets en Attente de Commande</h3>
                    {projectsAwaitingPO.length > 0 ? (
                        <ul className="divide-y dark:divide-slate-700 max-h-60 overflow-y-auto">
                            {projectsAwaitingPO.map(p => <li key={p.rowIndex} className="py-2 flex justify-between items-center text-sm"><span>{p.projectName}</span><span className="font-mono text-xs">{formatToMAD(p.allocatedBudget)}</span></li>)}
                        </ul>
                    ) : <p className="text-sm text-slate-500">Aucun projet en attente.</p>}
                </div>
                 <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
                    <h3 className="font-semibold flex items-center mb-4"><InboxIcon className="h-6 w-6 mr-2 text-blue-500" />Commandes en Attente de Prévisions</h3>
                    {projectsAwaitingForecasts.length > 0 ? (
                        <ul className="divide-y dark:divide-slate-700 max-h-60 overflow-y-auto">
                            {projectsAwaitingForecasts.map(p => <li key={p.rowIndex} className="py-2 flex justify-between items-center text-sm"><span>{p.projectName}</span><span className="font-mono text-xs">{p.poNumber}</span></li>)}
                        </ul>
                    ) : <p className="text-sm text-slate-500">Aucune commande en attente.</p>}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center"><CalendarDaysIcon className="h-6 w-6 mr-2 text-indigo-500" />Réceptions Prévisionnelles Mensuelles</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* FIX: Argument of type 'unknown' is not assignable to parameter of type 'number'. The 'value' from Object.entries was inferred as unknown. */}
                    {Object.entries(monthlyForecasts).map(([key, value]: [string, number]) => (
                        <button key={key} onClick={() => handleMonthClick(key)} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow text-center hover:shadow-lg hover:scale-105 transition-transform duration-200">
                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">{monthNames[key]}</p>
                            <p className="text-lg font-bold mt-1">{formatToMDH(value)}</p>
                        </button>
                    ))}
                </div>
            </div>
            
            <Modal isOpen={isForecastModalOpen} onClose={() => setIsForecastModalOpen(false)} title={`Projets avec réception en ${selectedMonth?.name}`} size="3xl">
                {selectedMonth && selectedMonth.projects.length > 0 ? (
                    <ul className="divide-y dark:divide-slate-700 max-h-96 overflow-y-auto">
                        {selectedMonth.projects.map(p => (
                            <li key={p.rowIndex} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{p.projectName}</p>
                                    <p className="text-sm text-slate-500">{p.poNumber}</p>
                                </div>
                                {p.poNumber && (
                                    <button onClick={() => openPVModal(p)} className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                                        <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
                                        Générer PV Interne
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-slate-500">Aucun projet avec prévision pour ce mois.</p>}
            </Modal>

            {projectForPV && (
                <PVGenerationModal 
                    project={projectForPV} 
                    isOpen={isPVModalOpen} 
                    onClose={() => setIsPVModalOpen(false)}
                    onGenerate={handleGeneratePV}
                />
            )}

            <Modal isOpen={isEngagedDetailModalOpen} onClose={closeModal} title={`Détail du Budget Engagé pour "${selectedCategoryDetails?.name}"`} size="3xl">
                {selectedCategoryDetails && selectedCategoryDetails.projects.length > 0 ? (
                    <div className="space-y-2">
                        <ul className="divide-y dark:divide-slate-700 max-h-80 overflow-y-auto">
                            {selectedCategoryDetails.projects.map(p => (
                                <li key={p.rowIndex} className="py-2 flex justify-between items-center text-sm">
                                    <span>{p.projectName}</span>
                                    <span className="font-mono text-xs">{formatToMAD(p.allocatedBudget)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="pt-2 border-t dark:border-slate-600 text-right font-bold">
                            Total Engagé: {formatToMAD(selectedCategoryDetails.total)}
                        </div>
                    </div>
                ) : <p className="text-slate-500">Aucun projet engagé pour cette catégorie.</p>}
            </Modal>
            
            <Modal isOpen={isBudgetModalOpen} onClose={closeModal} title={selectedBudget ? "Modifier la Catégorie" : "Ajouter une Catégorie"}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nom de la catégorie</label>
                        <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Budget Alloué (en Millions de MAD)</label>
                        <input type="number" value={newAllocatedBudget} onChange={e => setNewAllocatedBudget(Number(e.target.value))} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded">{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
                </div>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={closeModal} title="Confirmer la Suppression" size="md">
                <p>Êtes-vous sûr de vouloir supprimer la catégorie "{selectedBudget?.name}" ?</p>
                <div className="mt-6 flex justify-end space-x-2">
                    <button onClick={closeModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded">Annuler</button>
                    <button onClick={handleDelete} disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded">{isSaving ? 'Suppression...' : 'Supprimer'}</button>
                </div>
            </Modal>

        </div>
    );
};