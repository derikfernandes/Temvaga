type VertexPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

type VertexGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

async function callVertex(parts: VertexPart[]): Promise<string> {
  const response = await fetch('/api/vertex/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
    }),
  });

  const payload = (await response.json()) as VertexGenerateResponse & { error?: string };

  if (!response.ok) {
    const message = payload?.error || 'Falha na chamada ao Vertex.';
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Resposta vazia do modelo.');
  }

  return text;
}

export async function generateProfileFromAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    return await callVertex([
      {
        inlineData: {
          data: base64Audio,
          mimeType,
        },
      },
      {
        text: 'Você é um assistente social e recrutador especializado em acessibilidade. Recebi um áudio de uma pessoa descrevendo sua trajetória profissional e habilidades. Por favor, transforme esse relato em um resumo profissional conciso, em primeira pessoa, adequado para um perfil de portal de empregos. Foque nas experiências, habilidades práticas e objetivos mencionados. Se o áudio estiver confuso, tente extrair o máximo de informações úteis de forma profissional. O texto deve ser em Português do Brasil. IMPORTANTE: Retorne APENAS o texto do resumo profissional, sem introduções, saudações, explicações ou comentários adicionais. O resultado deve estar pronto para ser utilizado diretamente no perfil do usuário.',
      },
    ]);
  } catch (error) {
    console.error('Erro ao processar áudio com Vertex:', error);
    throw new Error('Não foi possível processar o áudio. Por favor, tente novamente ou digite sua descrição.');
  }
}

export async function chatWithGemini(userMessage: string, profileDescription: string): Promise<string> {
  try {
    return await callVertex([
      {
        text: `Você é um assistente virtual do portal TemVaga, especializado em ajudar pessoas que estão entrando no mercado de trabalho ou que possuem pouca especialização técnica. Seu objetivo é orientar o usuário a encontrar vagas de auxiliar, serviços gerais, comércio e cursos de qualificação básica.
        
        O perfil atual do usuário é: "${profileDescription}".
        
        Seja extremamente encorajador, use linguagem simples e clara (evite termos técnicos complexos).
        Se o usuário pedir ajuda para construir o perfil, faça perguntas diretas e curtas sobre o que ele sabe fazer, mesmo que não tenha experiência formal (ex: 'você já trabalhou com limpeza?', 'gosta de lidar com público?').
        Seja amigável, profissional e use Português do Brasil.
        Responda de forma concisa.
        
        Mensagem do usuário: ${userMessage}`,
      },
    ]);
  } catch (error) {
    console.error('Erro no chat com Vertex:', error);
    return 'Desculpe, estou com dificuldades técnicas agora.';
  }
}
