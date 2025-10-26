import { AppData } from './types';

// This file is reserved for mock data for testing and development purposes.
// The application is currently configured to use live data from Google Apps Script.

export const MOCK_DATA: AppData = {
  projects: [
    {
      id: "PROJ-001",
      rowIndex: 2,
      projectName: "Refonte du site web institutionnel",
      poNumber: "BC-12345",
      statut: "Exécution",
      fournisseur: "Web Agency Express",
      budgetCategory: "Marketing",
      allocatedBudget: 500000,
      totalOrdered: 450000,
      numDA: "DA-001",
      orderDate: "2024-03-15",
      yearofbudget: 2024,
    },
     {
      id: "PROJ-002",
      rowIndex: 3,
      projectName: "Migration vers le cloud Azure",
      poNumber: "BC-67890",
      statut: "Commande Émise",
      fournisseur: "Cloud Services Inc.",
      budgetCategory: "IT",
      allocatedBudget: 1200000,
      totalOrdered: 1150000,
      numDA: "DA-002",
      orderDate: "2024-02-20",
      yearofbudget: 2024,
    },
    {
      id: "PROJ-003",
      rowIndex: 4,
      projectName: "Campagne publicitaire Q3",
      poNumber: "",
      statut: "Idée / En Attente",
      fournisseur: "",
      budgetCategory: "Marketing",
      allocatedBudget: 750000,
      totalOrdered: 0,
      numDA: "",
      orderDate: "",
      yearofbudget: 2025,
    },
  ],
  orderDetails: [
    {
      poNumber: "BC-12345",
      lineId: "1",
      description: "Développement front-end pour la nouvelle landing page marketing et optimisation SEO",
      quantity: 1,
      unitPrice: 250000,
      lineTotal: 250000,
      jan: 0, feb: 0, mar: 100000, apr: 150000, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
    },
     {
      poNumber: "BC-12345",
      lineId: "2",
      description: "Développement back-end et intégration API",
      quantity: 1,
      unitPrice: 200000,
      lineTotal: 200000,
      jan: 0, feb: 0, mar: 0, apr: 0, may: 200000, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
    },
  ],
  globalBudgets: [
      { budgetCategory: "IT", allocatedBudget: 5 }, // In MMAD
      { budgetCategory: "Marketing", allocatedBudget: 2 }, // In MMAD
  ]
};