
import { GoogleGenAI } from "@google/genai";
import { Report } from "../types";

export const analyzeDailyReports = async (reports: Report[]) => {
  if (reports.length === 0) return "Hisobotlar yo'q.";

  // process.env.API_KEY ishlatish shart (qoidaga muvofiq)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const reportContext = reports.map(r => 
    `Operator: ${r.operatorName}, Holat: ${r.visitStatus}, Izoh: ${r.tasksCompleted}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quyidagi operator hisobotlarini tahlil qiling va o'zbek tilida professional xulosa bering: \n\n${reportContext}`,
      config: {
        systemInstruction: "Siz professional biznes tahlilchisiz. Faqat muhim nuqtalarni o'zbek tilida yozing."
      }
    });

    return response.text || "Natija yo'q.";
  } catch (error) {
    console.error("AI Error:", error);
    return "AI xizmati hozircha mavjud emas.";
  }
};
