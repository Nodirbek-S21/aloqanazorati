
import { GoogleGenAI } from "@google/genai";
import { Report } from "../types";

/**
 * Hisobotlarni sun'iy intellekt yordamida tahlil qilish
 */
export const analyzeDailyReports = async (reports: Report[]) => {
  if (reports.length === 0) return "Tahlil qilish uchun hisobotlar mavjud emas.";

  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const reportContext = reports.map(r => 
    `Operator: ${r.operatorName}, Holat: ${r.visitStatus}, Izoh: ${r.tasksCompleted}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quyidagi operator hisobotlarini tahlil qiling va o'zbek tilida professional xulosa bering. 
      Muammolarni aniqlang va menejerga tavsiyalar bering: \n\n${reportContext}`,
      config: {
        systemInstruction: "Siz professional biznes tahlilchisiz. Ma'lumotlarni chuqur tahlil qilib, faqat eng muhim nuqtalarni o'zbek tilida yozing."
      }
    });

    return response.text || "Tahlil yakunida natija olinmadi.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI tahlili vaqtincha ishlamayapti. Iltimos, Vercel-da API_KEY o'rnatilganini tekshiring.";
  }
};