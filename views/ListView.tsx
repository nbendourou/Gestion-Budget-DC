import React, { useState, useMemo, ChangeEvent, useCallback } from 'react';
import { ProjectWithDetails, Project, OrderDetail, ExtractedPOData } from '../types';
import { apiService } from '../services/apiService';
import { formatToMAD, formatToKDH } from '../utils/formatters';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import { extractInfoFromPDF } from '../services/geminiService';
import { KANBAN_STATUSES } from '../constants';
import { 
    PencilIcon, 
    TrashIcon, 
    EyeIcon, 
    PaperClipIcon, 
    CalendarDaysIcon, 
    MagnifyingGlassIcon,
    PlusIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';


interface ListViewProps {
    projects: ProjectWithDetails[];
    onUpdate: () => void;
    addToast: (type: 'success' | 'error', message: string) => void;
    allBudgetCategories: string[];
}

const getStatusColor = (status: string) => {
    if (["Exécution", "Installation & Livraison"].includes(status)) return 'bg-green-500';
    if (["Commande Émise", "Réception Provisoire (PVR)"].includes(status)) return 'bg-blue-500';
    if (["Processus Achats", "Rédaction CPS / DA"].includes(status)) return 'bg-yellow-500';
    if (["Projet Clôturé"].includes(status)) return 'bg-slate-500';
    return 'bg-gray-400';
};


export const ListView: React.FC<ListViewProps> = ({ projects, onUpdate, addToast, allBudgetCategories }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
    const [isAttachPOModalOpen, setIsAttachPOModalOpen] = useState(false);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    
    const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);
    const [editedProject, setEditedProject] = useState<Partial<Project> | null>(null);
    const [forecastData, setForecastData] = useState<OrderDetail[]>([]);
    
    const [extractedData, setExtractedData] = useState<ExtractedPOData | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const budgetYears = useMemo(() => {
        const years = new Set(projects.map(p => p.yearofbudget).filter(Boolean));
        return Array.from(years).filter((year): year is string | number => year !== undefined);
    }, [projects]);
    
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const searchMatch = searchTerm === '' ||
                String(p.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(p.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(p.fournisseur || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const statusMatch = statusFilter === '' || p.statut === statusFilter;
            const yearMatch = yearFilter === '' || String(p.yearofbudget) === yearFilter;
            const categoryMatch = categoryFilter === '' || p.budgetCategory === categoryFilter;

            return searchMatch && statusMatch && yearMatch && categoryMatch;
        });
    }, [projects, searchTerm, statusFilter, yearFilter, categoryFilter]);

    const openModal = (modalSetter: React.Dispatch<React.SetStateAction<boolean>>, project?: ProjectWithDetails) => {
        if (project) {
           setSelectedProject(project);
        }
        modalSetter(true);
    };
    
    const closeModal = () => {
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsDetailsModalOpen(false);
        setIsForecastModalOpen(false);
        setIsAttachPOModalOpen(false);
        setIsNewProjectModalOpen(false);
        setSelectedProject(null);
        setEditedProject(null);
        setForecastData([]);
        setExtractedData(null);
        setPdfFile(null);
    };
    
    // --- Handlers for each action ---

    const handleEdit = (project: ProjectWithDetails) => {
        setEditedProject({ ...project });
        openModal(setIsEditModalOpen, project);
    };

    const handleDelete = (project: ProjectWithDetails) => {
        openModal(setIsDeleteModalOpen, project);
    };

    const handleViewDetails = (project: ProjectWithDetails) => {
        openModal(setIsDetailsModalOpen, project);
    };
    
    const handleForecast = (project: ProjectWithDetails) => {
        setForecastData(JSON.parse(JSON.stringify(project.details))); // Deep copy
        openModal(setIsForecastModalOpen, project);
    };

    const handleAttachPO = (project: ProjectWithDetails) => {
        openModal(setIsAttachPOModalOpen, project);
    };

    const handleNewProject = () => {
        setEditedProject({ statut: KANBAN_STATUSES[0] });
        setIsNewProjectModalOpen(true);
    };
    
    // --- Save/Update Logic ---
    
    const handleSaveProject = async (projectToSave: Partial<Project>) => {
        if (!projectToSave) return;
        setIsSaving(true);
        try {
            if ('rowIndex' in projectToSave) {
                 await apiService.updateProject(projectToSave as Project);
                 addToast('success', 'Projet mis à jour.');
            } else {
                 await apiService.createProject(projectToSave, []);
                 addToast('success', 'Projet créé avec succès.');
            }
            onUpdate();
            closeModal();
        } catch (error) {
            addToast('error', `Échec: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedProject) return;
        setIsSaving(true);
        try {
            await apiService.deleteProject(selectedProject.rowIndex, selectedProject.poNumber);
            addToast('success', 'Projet supprimé avec succès.');
            onUpdate();
            closeModal();
        } catch (error) {
            addToast('error', `Échec: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveForecasts = async () => {
        if (!selectedProject || !forecastData) return;
        setIsSaving(true);
        try {
            await apiService.updateForecasts(selectedProject.poNumber, forecastData);
            addToast('success', 'Prévisions mises à jour.');
            onUpdate();
            closeModal();
        } catch (error) {
            addToast('error', `Échec: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setPdfFile(file);
            setIsExtracting(true);
            setExtractedData(null);
            const data = await extractInfoFromPDF(file);
            setIsExtracting(false);
            if (data) {
                setExtractedData(data);
            } else {
                addToast('error', "L'extraction des données du PDF a échoué.");
            }
        }
    };

    const handleSavePO = async () => {
        const projectToUpdate = selectedProject || editedProject;
        if (!projectToUpdate || !extractedData) return;
        
        const finalProjectData = {
            ...projectToUpdate,
            poNumber: extractedData.poNumber,
            orderDate: extractedData.orderDate,
            totalOrdered: extractedData.totalOrdered,
            fournisseur: extractedData.fournisseur,
        };
        
        setIsSaving(true);
        try {
            if (!('rowIndex' in finalProjectData)) {
                 await apiService.createProject(finalProjectData, extractedData.details);
                 addToast('success', 'Nouveau projet créé avec le bon de commande.');
            } else {
                 await apiService.updateProjectAndDetails(finalProjectData as Project, extractedData.details);
                 addToast('success', 'Bon de commande mis à jour.');
            }
            onUpdate();
            closeModal();
        } catch (error) {
            addToast('error', `Échec: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleForecastChange = (lineId: string, month: string, value: string) => {
        setForecastData(prev => prev.map(item => {
            if (item.lineId === lineId) {
                const updatedItem: OrderDetail = { ...item };
                (updatedItem as any)[month] = Number(value);
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handleForecastCheckbox = (lineId: string, month: string, checked: boolean, quantity: number) => {
        setForecastData(prev => prev.map(item => {
            if (item.lineId === lineId) {
                const updatedItem: OrderDetail = { ...item };
                const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                months.forEach(m => {
                    (updatedItem as any)[m] = (m === month && checked) ? quantity : 0;
                });
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handleExtractedDataChange = (field: keyof ExtractedPOData, value: any, detailIndex?: number, detailField?: keyof ExtractedPOData['details'][0]) => {
        if (!extractedData) return;

        let newData = { ...extractedData };
        if (detailIndex !== undefined && detailField) {
            const newDetails = [...newData.details];
            (newDetails[detailIndex] as any)[detailField] = value;
            
            const item = newDetails[detailIndex];
            item.lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
            newData.totalOrdered = newDetails.reduce((sum, d) => sum + (d.lineTotal || 0), 0);
            
            newData.details = newDetails;
        } else {
             (newData as any)[field] = value;
        }
        setExtractedData(newData);
    };

    return (
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="flex flex-grow w-full sm:w-auto gap-2 flex-wrap">
                        <div className="relative flex-grow min-w-[200px]">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-md border-slate-300 dark:border-slate-600 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-700 p-2"
                            />
                        </div>
                         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-700 p-2">
                             <option value="">Tous les statuts</option>
                             {KANBAN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                         <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-700 p-2">
                            <option value="">Toutes les catégories</option>
                            {allBudgetCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-700 p-2">
                             <option value="">Toutes les années</option>
                             {budgetYears.map(y => <option key={y} value={y}>{y}</option>)}
                         </select>
                     </div>
                     <button onClick={handleNewProject} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                         <PlusIcon className="h-5 w-5 mr-2" />
                         Ajouter un Projet
                     </button>
                 </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-2/6">Projet</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fournisseur</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Budget Alloué</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Commandé</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredProjects.map(project => (
                            <tr key={project.rowIndex}>
                                <td className="px-4 py-4 whitespace-normal text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {project.projectName}
                                    <div className="text-xs text-sky-500">{project.budgetCategory}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-normal text-sm text-slate-500 dark:text-slate-400">{project.fournisseur || '-'}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center">
                                        <span className={`h-2 w-2 rounded-full ${getStatusColor(project.statut)} mr-2`}></span>
                                        {project.statut}
                                    </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">{formatToKDH(project.allocatedBudget)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">{formatToKDH(project.totalOrdered)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => handleViewDetails(project)} className="group relative">
                                            <EyeIcon className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                                            <span className="absolute bottom-full mb-2 hidden group-hover:block w-auto p-2 text-xs text-white bg-slate-700 rounded-md">Voir Détails</span>
                                        </button>
                                         <button onClick={() => handleEdit(project)} className="group relative">
                                            <PencilIcon className="h-5 w-5 text-slate-400 group-hover:text-yellow-500" />
                                             <span className="absolute bottom-full mb-2 hidden group-hover:block w-auto p-2 text-xs text-white bg-slate-700 rounded-md">Modifier</span>
                                        </button>
                                        <button onClick={() => handleDelete(project)} className="group relative">
                                            <TrashIcon className="h-5 w-5 text-slate-400 group-hover:text-red-500" />
                                            <span className="absolute bottom-full mb-2 hidden group-hover:block w-auto p-2 text-xs text-white bg-slate-700 rounded-md">Supprimer</span>
                                        </button>
                                        <button onClick={() => handleForecast(project)} className="group relative">
                                            <CalendarDaysIcon className="h-5 w-5 text-slate-400 group-hover:text-green-500" />
                                            <span className="absolute bottom-full mb-2 hidden group-hover:block w-auto p-2 text-xs text-white bg-slate-700 rounded-md">Prévisions</span>
                                        </button>
                                        <button onClick={() => handleAttachPO(project)} className="group relative">
                                            <PaperClipIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                                            <span className="absolute bottom-full mb-2 hidden group-hover:block w-auto p-2 text-xs text-white bg-slate-700 rounded-md">Attacher BC</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProjects.length === 0 && (
                    <p className="text-center p-8 text-slate-500">Aucun projet trouvé.</p>
                 )}
            </div>

            {/* --- Modals --- */}
            
            <Modal isOpen={isEditModalOpen} onClose={closeModal} title="Modifier le Projet" size="4xl">
                {editedProject ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Col 1 */}
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Nom du Projet</label>
                                    <input type="text" name="projectName" value={editedProject.projectName || ''} onChange={(e) => setEditedProject({...editedProject, projectName: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium">Catégorie Budgétaire</label>
                                    <select name="budgetCategory" value={editedProject.budgetCategory || ''} onChange={(e) => setEditedProject({...editedProject, budgetCategory: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600">
                                        <option value="">-- Sélectionner --</option>
                                        {allBudgetCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium">Budget Alloué (MAD)</label>
                                    <input type="number" name="allocatedBudget" value={editedProject.allocatedBudget || 0} onChange={(e) => setEditedProject({...editedProject, allocatedBudget: Number(e.target.value)})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium">N° DA</label>
                                    <input type="text" name="numDA" value={editedProject.numDA || ''} onChange={(e) => setEditedProject({...editedProject, numDA: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                            </div>
                            {/* Col 2 */}
                             <div className="space-y-4">
                                 <div>
                                    <label className="block text-sm font-medium">Statut</label>
                                    <select name="statut" value={editedProject.statut || ''} onChange={(e) => setEditedProject({...editedProject, statut: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600">
                                        {KANBAN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium">Année budgétaire</label>
                                    <input type="number" name="yearofbudget" value={editedProject.yearofbudget || ''} onChange={(e) => setEditedProject({...editedProject, yearofbudget: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg space-y-2">
                                     <h4 className="text-sm font-semibold">Infos Bon de Commande</h4>
                                      <p className="text-sm"><strong>Fournisseur:</strong></p>
                                      <input type="text" name="fournisseur" value={editedProject.fournisseur || ''} onChange={(e) => setEditedProject({...editedProject, fournisseur: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={closeModal} className="mr-2 px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded">Annuler</button>
                            <button onClick={() => handleSaveProject(editedProject)} disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center">
                                {isSaving && <Spinner size="sm" />}
                                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </div>
                    </div>
                ) : <p>Chargement...</p>}
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={closeModal} title="Confirmer la Suppression">
                <p>Êtes-vous sûr de vouloir supprimer le projet "{selectedProject?.projectName}" ? Cette action est irréversible et supprimera également les articles de commande associés.</p>
                <div className="mt-6 flex justify-end space-x-2">
                    <button onClick={closeModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded">Annuler</button>
                    <button onClick={handleConfirmDelete} disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded flex items-center">
                        {isSaving && <Spinner size="sm" />}
                        {isSaving ? 'Suppression...' : 'Supprimer'}
                    </button>
                </div>
            </Modal>
            
            <Modal isOpen={isDetailsModalOpen} onClose={closeModal} title={`Détails de la Commande ${selectedProject?.poNumber}`} size="4xl">
                 {selectedProject && selectedProject.details.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead><tr>
                            <th className="py-2 text-left">Description</th>
                            <th className="py-2 text-right">Qté</th>
                            <th className="py-2 text-right">P.U.</th>
                            <th className="py-2 text-right">Total</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {selectedProject.details.map(d => (
                                <tr key={d.lineId}>
                                    <td className="py-2 whitespace-normal">{d.description}</td>
                                    <td className="py-2 text-right">{d.quantity}</td>
                                    <td className="py-2 text-right">{formatToMAD(d.unitPrice)}</td>
                                    <td className="py-2 text-right font-semibold">{formatToMAD(d.lineTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 ) : <p>Aucun article trouvé pour cette commande.</p>}
            </Modal>

            <Modal isOpen={isForecastModalOpen} onClose={closeModal} title={`Gérer les Prévisions - Cde ${selectedProject?.poNumber}`} size="7xl">
                 <div className="overflow-auto relative" style={{ maxHeight: '60vh' }}>
                    <table className="min-w-full text-xs">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700 z-10">
                            <tr>
                                <th className="p-2 text-left sticky left-0 bg-slate-100 dark:bg-slate-700">ID</th>
                                <th className="p-2 text-left sticky left-12 bg-slate-100 dark:bg-slate-700 min-w-[250px]">Description</th>
                                <th className="p-2 text-right">Qté Cde</th>
                                {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map(m => <th key={m} className="p-2 text-center capitalize min-w-[100px]">{m}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {forecastData.map((item, index) => {
                                return (
                                <tr key={item.lineId} className="border-b dark:border-slate-700">
                                    <td className="p-2 sticky left-0 bg-white dark:bg-slate-800">{item.lineId}</td>
                                    <td className="p-2 sticky left-12 bg-white dark:bg-slate-800">{item.description}</td>
                                    <td className="p-2 text-right font-bold">{item.quantity}</td>
                                    {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map(m => (
                                        <td key={m} className="p-2 text-center">
                                            <div className="flex items-center gap-1">
                                                <input type="checkbox" onChange={(e) => handleForecastCheckbox(item.lineId, m, e.target.checked, item.quantity)} className="form-checkbox h-4 w-4" />
                                                <input type="number" value={(item as any)[m] || ''} onChange={(e) => handleForecastChange(item.lineId, m, e.target.value)} className="w-full text-center p-1 rounded bg-slate-100 dark:bg-slate-700 text-sm" />
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 </div>
                 <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveForecasts} disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded">{isSaving ? 'Sauvegarde...' : 'Sauvegarder les Prévisions'}</button>
                </div>
            </Modal>
            
            <Modal isOpen={isAttachPOModalOpen || isNewProjectModalOpen} onClose={closeModal} title={isNewProjectModalOpen ? "Ajouter un Projet" : `Attacher un BC à "${selectedProject?.projectName}"`}>
                <div className="space-y-4">
                     {isNewProjectModalOpen && (
                        <>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Nom du Projet</label>
                                <input type="text" name="projectName" value={editedProject?.projectName || ''} onChange={(e) => setEditedProject({...editedProject, projectName: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Catégorie Budgétaire</label>
                                <select name="budgetCategory" value={editedProject?.budgetCategory || ''} onChange={(e) => setEditedProject({...editedProject, budgetCategory: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600">
                                    <option value="">-- Sélectionner --</option>
                                    {allBudgetCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Budget Alloué <span className="text-slate-500">(en MAD)</span></label>
                                <input type="number" name="allocatedBudget" value={editedProject?.allocatedBudget || 0} onChange={(e) => setEditedProject({...editedProject, allocatedBudget: Number(e.target.value)})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Année budgétaire</label>
                                <input type="number" name="yearofbudget" value={editedProject?.yearofbudget || ''} onChange={(e) => setEditedProject({...editedProject, yearofbudget: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md p-2 dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                         </div>
                         <div className="mt-4 flex justify-end">
                            <button onClick={() => handleSaveProject(editedProject)} disabled={isSaving} className="px-4 py-2 bg-slate-500 text-white rounded">{isSaving ? 'Sauvegarde...' : 'Sauvegarder sans BC'}</button>
                        </div>
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-300 dark:border-slate-600" /></div>
                          <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-800 px-2 text-sm text-slate-500">OU</span></div>
                        </div>
                        </>
                     )}
                     
                    <div>
                        <label className="block text-sm font-medium">Fichier Bon de Commande (PDF)</label>
                        <input type="file" accept=".pdf" onChange={handleFileChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    </div>
                    
                    {isExtracting && <div className="text-center p-4"><Spinner /> <p>Analyse du PDF en cours...</p></div>}
                    
                    {extractedData && (
                        <div className="space-y-4 mt-4 p-4 border rounded-md dark:border-slate-600">
                            <h3 className="font-semibold">Informations Extraites - Veuillez vérifier et corriger si besoin</h3>
                            {selectedProject?.poNumber && <p className="text-sm p-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded">Attention: Vous allez remplacer le BC existant ({selectedProject.poNumber}) et ses articles.</p>}
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs">N° de Cde</label><input type="text" value={extractedData.poNumber} onChange={e => handleExtractedDataChange('poNumber', e.target.value)} className="w-full p-1 border rounded dark:bg-slate-700"/></div>
                                <div><label className="text-xs">Fournisseur</label><input type="text" value={extractedData.fournisseur} onChange={e => handleExtractedDataChange('fournisseur', e.target.value)} className="w-full p-1 border rounded dark:bg-slate-700"/></div>
                                <div><label className="text-xs">Date</label><input type="date" value={extractedData.orderDate} onChange={e => handleExtractedDataChange('orderDate', e.target.value)} className="w-full p-1 border rounded dark:bg-slate-700"/></div>
                                <div><label className="text-xs">Total Commandé</label><input type="number" value={extractedData.totalOrdered} onChange={e => handleExtractedDataChange('totalOrdered', Number(e.target.value))} className="w-full p-1 border rounded dark:bg-slate-700"/></div>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-xs">
                                     <thead><tr className="border-b dark:border-slate-600"><th className="text-left p-1">Description</th><th className="p-1">Qté</th><th className="p-1">P.U.</th><th className="p-1">Total</th></tr></thead>
                                     <tbody>
                                         {extractedData.details.map((d, i) => (
                                             <tr key={i} className="border-b dark:border-slate-700">
                                                 <td><input type="text" value={d.description} onChange={e => handleExtractedDataChange('details', e.target.value, i, 'description')} className="w-full p-1 border rounded dark:bg-slate-700 my-1"/></td>
                                                 <td><input type="number" value={d.quantity} onChange={e => handleExtractedDataChange('details', Number(e.target.value), i, 'quantity')} className="w-20 p-1 border rounded dark:bg-slate-700 my-1"/></td>
                                                 <td><input type="number" value={d.unitPrice} onChange={e => handleExtractedDataChange('details', Number(e.target.value), i, 'unitPrice')} className="w-24 p-1 border rounded dark:bg-slate-700 my-1"/></td>
                                                 <td className="p-1 text-right">{formatToMAD(d.lineTotal)}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                </table>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={handleSavePO} disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded">{isSaving ? 'Sauvegarde...' : 'Confirmer et Sauvegarder'}</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};
