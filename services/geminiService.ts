
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDailyInspiration = async (name: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是Chuck的AI乐高助手。请为Chuck生成一小段今日鼓励语（乐高风格），包含一句话的今日科学小知识。输出请简洁生动。`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "嘿 Chuck！今天也是充满创造力的一天，让我们像乐高积木一样拼搭出精彩吧！";
  }
};

export const getSmartPlanSuggestions = async (activities: string[]) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `基于Chuck喜欢的活动：${activities.join(', ')}，为他生成一个合理的每日计划JSON，包含3个具体任务。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    time: { type: Type.STRING }
                }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
        return [
            { text: "完成数学趣味练习", time: "10:00" },
            { text: "乐高拼搭大挑战", time: "15:00" },
            { text: "户外运动30分钟", time: "17:00" }
        ];
    }
}
