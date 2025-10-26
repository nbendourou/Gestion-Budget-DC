import { Type } from '@google/genai';

export const KANBAN_STATUSES: string[] = [
    "Idée / En Attente",
    "Comité d'Engagement",
    "Rédaction CPS / DA",
    "Processus Achats",
    "Commande Émise",
    "Exécution",
    "Installation & Livraison",
    "Réception Provisoire (PVR)",
    "Projet Clôturé"
];

// IMPORTANT : L'URL a été mise à jour avec le script de l'utilisateur.
// L'application va maintenant se connecter aux données réelles de la feuille Google Sheets.
export const GOOGLE_APPS_SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbwRIcsAgK298M5cOyST6y1M0ig3zkj_UhmERdlXpv-Ce7u_0gkdOpo4QYMeQwC0-2ez/exec';


export const GEMINI_EXTRACTION_PROMPT = `Analyze all pages of the provided purchase order (PO) PDF to extract key information. Consolidate all line items, even if they span multiple pages, into a single list.
Extract the following:
1.  **poNumber**: The purchase order number (e.g., "BC-12345").
2.  **orderDate**: The date of the purchase order, formatted as YYYY-MM-DD.
3.  **totalOrdered**: The final total amount of the purchase order.
4.  **fournisseur**: The name of the Vendor/Supplier. Extract only the company name, omitting the address.
5.  **details**: A list of all line items from the order. For each item, extract its position/ID as lineId, description, quantity, unit price (as unitPrice), and total line price (as lineTotal).
Return the result as a single JSON object.`;


export const GEMINI_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        poNumber: { type: Type.STRING, description: "The purchase order number" },
        orderDate: { type: Type.STRING, description: "The date of the order (YYYY-MM-DD)" },
        totalOrdered: { type: Type.NUMBER, description: "The final total amount" },
        fournisseur: { type: Type.STRING, description: "The vendor/supplier name" },
        details: {
            type: Type.ARRAY,
            description: "List of all line items from the order",
            items: {
                type: Type.OBJECT,
                properties: {
                    lineId: { type: Type.STRING, description: "Item position or ID" },
                    description: { type: Type.STRING, description: "Item description" },
                    quantity: { type: Type.NUMBER, description: "Item quantity" },
                    unitPrice: { type: Type.NUMBER, description: "Item unit price" },
                    lineTotal: { type: Type.NUMBER, description: "Total price for the line item" },
                },
                required: ["lineId", "description", "quantity", "unitPrice", "lineTotal"],
            },
        },
    },
    required: ["poNumber", "orderDate", "totalOrdered", "fournisseur", "details"],
};