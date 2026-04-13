import { GoogleGenAI } from "@google/genai";

const geminiKey = process.env.GEMINI_API_KEY;
const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

export async function generateProfileFromAudio(base64Audio: string, mimeType: string): Promise<string> {
  if (!ai) {
    console.warn("GEMINI_API_KEY não configurada; áudio não será processado.");
    throw new Error("IA indisponível sem API key. Digite seu resumo no campo de texto.");
  }
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
  if (!ai) {
    return "O assistente de IA não está configurado (falta GEMINI_API_KEY no .env.local). Você ainda pode navegar pelo site e usar o restante normalmente.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            text: `Você é um assistente virtual do portal TemVaga, especializado em ajudar pessoas que estão entrando no mercado de trabalho ou que possuem pouca especialização técnica. Seu objetivo é orientar o usuário a encontrar vagas de auxiliar, serviços gerais, comércio e cursos de qualificação básica.
            
            O perfil atual do usuário é: "${profileDescription}".
            
            Seja extremamente encorajador, use linguagem simples e clara (evite termos técnicos complexos).
            Se o usuário pedir ajuda para construir o perfil, faça perguntas diretas e curtas sobre o que ele sabe fazer, mesmo que não tenha experiência formal (ex: 'você já trabalhou com limpeza?', 'gosta de lidar com público?').
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
