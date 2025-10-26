import React, { useMemo } from 'react';
import { ProjectWithDetails } from '../types';
import { formatToMAD } from '../utils/formatters';
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/outline';


const StatCard: React.FC<{ title: string; value: string; description: string; colorClass: string }> = ({ title, value, description, colorClass }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
        <p className={`mt-2 text-3xl font-bold ${colorClass}`}>{value}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
);

export const GainsView: React.FC<{ projects: ProjectWithDetails[] }> = ({ projects }) => {
    
    const gainsData = useMemo(() => {
        // FIX: Filter projects that have a PO number, ensuring we only calculate gains on committed projects.
        const committedProjects = projects.filter(p => p.poNumber && p.totalOrdered > 0);

        // FIX: Use Number() to ensure values are treated as numbers, preventing calculation errors.
        const totalAllocated = committedProjects.reduce((sum, p) => sum + Number(p.allocatedBudget || 0), 0);
        const totalOrdered = committedProjects.reduce((sum, p) => sum + Number(p.totalOrdered || 0), 0);
        const totalGain = totalAllocated - totalOrdered;

        const projectsWithGains = committedProjects
            .map(p => ({ ...p, gain: Number(p.allocatedBudget || 0) - Number(p.totalOrdered || 0) }))
            .sort((a, b) => b.gain - a.gain);

        return {
            totalAllocated,
            totalOrdered,
            totalGain,
            projectsWithGains,
        };
    }, [projects]);

    const { totalAllocated, totalOrdered, totalGain, projectsWithGains } = gainsData;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Budget Total Engagé"
                    value={formatToMAD(totalAllocated)}
                    description="Pour les projets avec commandes"
                    colorClass="text-slate-800 dark:text-slate-100"
                />
                 <StatCard
                    title="Total Réel Commandé"
                    value={formatToMAD(totalOrdered)}
                    description="Dépenses effectives sur les projets"
                     colorClass="text-slate-800 dark:text-slate-100"
                />
                <StatCard
                    title="Gain / Perte Total"
                    value={formatToMAD(totalGain)}
                    description={totalGain >= 0 ? "Économie réalisée" : "Dépassement de budget"}
                    colorClass={totalGain >= 0 ? "text-green-500" : "text-red-500"}
                />
            </div>
            
            <div>
                 <h2 className="text-xl font-semibold mb-4">Détail par Projet (Commandes Émises)</h2>
                 <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                         <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/2">Projet</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Budget Alloué</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Total Commandé</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Gain / Perte</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {projectsWithGains.map(project => (
                                <tr key={project.id}>
                                    <td className="px-6 py-4 whitespace-normal text-sm font-medium text-slate-900 dark:text-slate-100">{project.projectName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">{formatToMAD(project.allocatedBudget)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">{formatToMAD(project.totalOrdered)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                                        <span className={`flex items-center justify-end ${project.gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {project.gain >= 0 ? <ArrowUpCircleIcon className="h-5 w-5 mr-1" /> : <ArrowDownCircleIcon className="h-5 w-5 mr-1" />}
                                            {formatToMAD(project.gain)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {projectsWithGains.length === 0 && (
                        <p className="text-center p-8 text-slate-500">Aucun projet avec une commande émise à analyser.</p>
                     )}
                 </div>
            </div>
        </div>
    );
};