

import { GoogleGenAI } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { GEMINI_EXTRACTION_PROMPT, GEMINI_RESPONSE_SCHEMA } from '../constants';
import { ExtractedPOData } from '../types';

// The workerSrc property needs to be set to the path of the worker file.
// FIX: The workerSrc URL was pointing to cdnjs, which can cause cross-origin issues 
// in sandboxed environments. It's now pointing to aistudiocdn.com, the same CDN used
// for the main pdf.js library, ensuring consistency and preventing fetch errors.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;


// FIX: The API key must be retrieved from `process.env.API_KEY` per coding guidelines, which resolves the TypeScript error for `import.meta.env`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

async function pdfToImageParts(file: File) {
    const fileAsArrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(fileAsArrayBuffer).promise;
    const numPages = pdf.numPages;
    const imageParts = [];

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg');
            const base64Data = dataUrl.split(',')[1];
            imageParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/jpeg'
                }
            });
        }
    }
    return imageParts;
}


export const extractInfoFromPDF = async (pdfFile: File): Promise<ExtractedPOData | null> => {
    try {
        const imageParts = await pdfToImageParts(pdfFile);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            // FIX: The 'contents' field for a single multimodal request should be an object with a 'parts' array, not an array of content objects.
            contents: { parts: [ { text: GEMINI_EXTRACTION_PROMPT }, ...imageParts ]},
            config: {
                responseMimeType: "application/json",
                responseSchema: GEMINI_RESPONSE_SCHEMA,
            },
        });

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText) as ExtractedPOData;
        return data;
    } catch (error) {
        console.error("Error extracting data with Gemini:", error);
        return null;
    }
};