export enum View {
    Kanban = 'Kanban',
    List = 'Liste',
    Gains = 'Gains',
    Budgets = 'Budgets',
}

export interface ToastMessage {
    id: number;
    type: 'success' | 'error';
    message: string;
}

export interface Project {
    id: string;
    rowIndex: number;
    projectName: string;
    poNumber: string;
    statut: string;
    fournisseur: string;
    budgetCategory: string;
    allocatedBudget: number;
    totalOrdered: number;
    numDA?: string;
    orderDate?: string;
    yearofbudget?: number | string;
    [key: string]: any;
}

export interface OrderDetail {
    poNumber: string;
    lineId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    jan?: number;
    feb?: number;
    mar?: number;
    apr?: number;
    may?: number;
    jun?: number;
    jul?: number;
    aug?: number;
    sep?: number;
    oct?: number;
    nov?: number;
    dec?: number;
    quantityReceived?: number;
}

export interface GlobalBudget {
    budgetCategory: string;
    allocatedBudget: number; // In MMAD
    rowIndex: number;
}

export interface AppData {
    projects: Project[];
    orderDetails: OrderDetail[];
    globalBudgets: GlobalBudget[];
}

export interface ProjectWithDetails extends Project {
    details: OrderDetail[];
}

export interface ExtractedPOData {
    poNumber: string;
    orderDate: string;
    totalOrdered: number;
    fournisseur: string;
    details: Array<{
        lineId: string;
        description: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
    }>;
}


// --- Types pour le PV de Réception Interne ---

export interface PVItem {
    lineId: string;
    description: string;
    quantityToReceive: number;
}

export interface PVData {
    project: ProjectWithDetails;
    pvDate: string;
    items: PVItem[];
    reserves: string;
    isBonAPayer: boolean;
    signatoryName: string;
    signatoryRole: string;
    refContrat: string;
    refContratSAP: string;
    periodeDu: string;
    periodeAu: string;
}