import { AppData, Project, OrderDetail, ExtractedPOData, GlobalBudget } from '../types';
import { GOOGLE_APPS_SCRIPT_URL } from '../constants';

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    try {
        const result = JSON.parse(text);
        if (result.status === 'success') {
            return result;
        } else {
            console.error("Erreur du backend:", result);
            throw new Error(`Erreur renvoyée par le script Google Apps: ${result.message || 'Message d\'erreur non fourni.'}`);
        }
    } catch (e) {
        console.error("Impossible de parser la réponse JSON du backend. Réponse reçue:", text);
        throw new Error("La réponse du backend n'est pas un JSON valide.");
    }
};

const postRequest = async (body: object) => {
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(body),
            cache: 'no-cache',
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error(`Erreur lors de l'action ${ (body as any).action}:`, error);
        throw error;
    }
};


const getData = async (): Promise<AppData> => {
    const result = await postRequest({ action: 'getData' });
    
    if (result && result.data && 
        Array.isArray(result.data.projects) &&
        Array.isArray(result.data.orderDetails) &&
        Array.isArray(result.data.globalBudgets)) {
        return result.data as AppData;
    }
    
    const receivedDataForLogging = JSON.stringify(result, null, 2);
    console.error("Données malformées reçues du backend:", receivedDataForLogging);
    throw new Error(`La réponse du backend est invalide. Vérifiez que votre script Google Apps est bien déployé et renvoie la structure de données attendue ({data: {projects: [], ...}}). Réponse reçue: ${receivedDataForLogging.substring(0, 200)}...`);
};

const createProject = async (projectData: Partial<Project>, orderDetails: ExtractedPOData['details']) => {
    return await postRequest({ action: 'createProject', projectData, orderDetails });
};

const updateProjectStatus = async (rowIndex: number, newStatus: string) => {
    return await postRequest({ action: 'updateProjectStatus', rowIndex, newStatus });
};

const deleteProject = async (rowIndex: number, poNumber: string) => {
    return await postRequest({ action: 'deleteProject', rowIndex, poNumber });
};

const updateProject = async (projectData: Project) => {
    return await postRequest({ action: 'updateProject', projectData });
};

const updateForecasts = async (poNumber: string, forecasts: any) => {
    return await postRequest({ action: 'updateForecasts', poNumber, forecasts });
};

const updateProjectAndDetails = async (projectData: Project, orderDetails: ExtractedPOData['details']) => {
    return await postRequest({ action: 'updateProjectAndDetails', projectData, orderDetails });
};

// CRUD for Global Budgets
const createBudgetCategory = async (categoryData: Omit<GlobalBudget, 'rowIndex'>) => {
    return await postRequest({ action: 'createBudgetCategory', categoryData });
};

const updateBudgetCategory = async (categoryData: GlobalBudget) => {
    return await postRequest({ action: 'updateBudgetCategory', categoryData });
};

const deleteBudgetCategory = async (rowIndex: number) => {
    return await postRequest({ action: 'deleteBudgetCategory', rowIndex });
};


export const apiService = {
    getData,
    createProject,
    updateProjectStatus,
    deleteProject,
    updateProject,
    updateForecasts,
    updateProjectAndDetails,
    createBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
};