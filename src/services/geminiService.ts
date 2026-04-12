import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateProfileFromAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: "Você é um assistente social e recrutador especializado em acessibilidade. Recebi um áudio de uma pessoa descrevendo sua trajetória profissional e habilidades. Por favor, transforme esse relato em um resumo profissional conciso, em primeira pessoa, adequado para um perfil de portal de empregos. Foque nas experiências, habilidades práticas e objetivos mencionados. Se o áudio estiver confuso, tente extrair o máximo de informações úteis de forma profissional. O texto deve ser em Português do Brasil. IMPORTANTE: Retorne APENAS o texto do resumo profissional, sem introduções, saudações, explicações ou comentários adicionais. O resultado deve estar pronto para ser utilizado diretamente no perfil do usuário.",
          },
        ],
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro ao processar áudio com Gemini:", error);
    throw new Error("Não foi possível processar o áudio. Por favor, tente novamente ou digite sua descrição.");
  }
}

export async function chatWithGemini(userMessage: string, profileDescription: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            text: `Você é um assistente virtual do portal TemVaga. Seu objetivo é ajudar o usuário a encontrar emprego e cursos. 
            O perfil atual do usuário é: "${profileDescription}".
            Se o usuário pedir ajuda para construir o perfil, faça perguntas diretas e curtas sobre suas experiências e habilidades.
            Seja amigável, profissional e use Português do Brasil.
            Responda de forma concisa.
            
            Mensagem do usuário: ${userMessage}`
          },
        ],
      },
    });

    return response.text || "Desculpe, não consegui processar sua mensagem.";
  } catch (error) {
    console.error("Erro no chat com Gemini:", error);
    return "Desculpe, estou com dificuldades técnicas agora.";
  }
}
