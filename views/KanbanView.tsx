import React from 'react';
import { ProjectWithDetails } from '../types';
import { KANBAN_STATUSES } from '../constants';
import { formatToMAD } from '../utils/formatters';
import { apiService } from '../services/apiService';

interface KanbanViewProps {
    projects: ProjectWithDetails[];
    onUpdate: () => void;
    addToast: (type: 'success' | 'error', message: string) => void;
}

const ProjectCard: React.FC<{ project: ProjectWithDetails; onDragStart: (e: React.DragEvent<HTMLDivElement>, projectRowIndex: number) => void }> = ({ project, onDragStart }) => {
    const budget = project.allocatedBudget;
    const ordered = project.totalOrdered;
    const consumedPercentage = budget > 0 ? (ordered / budget) * 100 : 0;

    let progressBarColor = 'bg-indigo-500';
    if (consumedPercentage > 80) progressBarColor = 'bg-yellow-500';
    if (consumedPercentage >= 100) progressBarColor = 'bg-red-500';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, project.rowIndex)}
            className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-3 cursor-grab active:cursor-grabbing"
        >
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 break-words pr-2 line-clamp-3 mb-2">{project.projectName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{project.poNumber || 'Pas de N° de Cde'}</p>
            <div className="text-xs space-y-2">
                <div>
                    <div className="flex justify-between mb-1">
                        <span>Commandé</span>
                        <span className="font-semibold">{formatToMAD(ordered)}</span>
                    </div>
                     <div className="flex justify-between text-slate-500">
                        <span>Budget</span>
                        <span>{formatToMAD(budget)}</span>
                    </div>
                </div>
                {budget > 0 && (
                     <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                            className={`${progressBarColor} h-1.5 rounded-full`}
                            style={{ width: `${Math.min(consumedPercentage, 100)}%` }}
                        ></div>
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">{project.fournisseur || 'Pas de fournisseur'}</p>
        </div>
    );
}

export const KanbanView: React.FC<KanbanViewProps> = ({ projects, onUpdate, addToast }) => {
    
    const [optimisticProjects, setOptimisticProjects] = React.useState(projects);

    React.useEffect(() => {
        setOptimisticProjects(projects);
    }, [projects]);


    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, projectRowIndex: number) => {
        e.dataTransfer.setData("projectRowIndex", String(projectRowIndex));
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
        e.preventDefault();
        const projectRowIndex = parseInt(e.dataTransfer.getData("projectRowIndex"));
        
        const originalProjects = [...optimisticProjects];
        const updatedProjects = optimisticProjects.map(p => 
            p.rowIndex === projectRowIndex ? { ...p, statut: newStatus } : p
        );

        setOptimisticProjects(updatedProjects);

        try {
            await apiService.updateProjectStatus(projectRowIndex, newStatus);
            addToast('success', 'Statut du projet mis à jour.');
        } catch (error) {
            setOptimisticProjects(originalProjects);
            addToast('error', 'Échec de la mise à jour du statut.');
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const projectsByStatus = KANBAN_STATUSES.reduce((acc, status) => {
        acc[status] = optimisticProjects.filter(p => String(p.statut || '').trim().toLowerCase() === status.toLowerCase());
        return acc;
    }, {} as Record<string, ProjectWithDetails[]>);

    return (
        <div className="flex overflow-x-auto space-x-4 p-1 h-full" style={{minHeight: 'calc(100vh - 150px)'}}>
            {KANBAN_STATUSES.map(status => (
                <div 
                    key={status} 
                    className="flex-shrink-0 w-80 bg-slate-100 dark:bg-slate-800/50 rounded-lg shadow-inner"
                    onDrop={(e) => handleDrop(e, status)}
                    onDragOver={handleDragOver}
                >
                    <div className="p-3 bg-slate-200 dark:bg-slate-700/50 rounded-t-lg sticky top-0 z-10 backdrop-blur-sm">
                        <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200">{status} <span className="text-slate-500 dark:text-slate-400">({projectsByStatus[status]?.length || 0})</span></h2>
                    </div>
                    <div className="p-2 h-full overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
                        {projectsByStatus[status]?.length > 0 ? (
                            projectsByStatus[status].map(project => <ProjectCard key={project.rowIndex} project={project} onDragStart={handleDragStart} />)
                        ) : (
                            <div className="text-center text-sm text-slate-400 py-4 px-2">Aucun projet dans cette étape.</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};