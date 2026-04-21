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

function extractVertexErrorMessage(payload: Record<string, unknown>, status: number): string {
  const top = payload.error;
  if (typeof top === 'string' && top.trim()) {
    return top;
  }
  if (top && typeof top === 'object') {
    const msg = (top as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }
  }
  const details = payload.details;
  if (details && typeof details === 'object' && details !== null) {
    const d = details as Record<string, unknown>;
    if (typeof d.message === 'string' && d.message.trim()) {
      return d.message;
    }
    const nested = d.error;
    if (nested && typeof nested === 'object' && nested !== null) {
      const e = nested as Record<string, unknown>;
      if (typeof e.message === 'string' && e.message.trim()) {
        return e.message;
      }
    }
    try {
      const snippet = JSON.stringify(details).slice(0, 400);
      if (snippet && snippet !== '{}') {
        return `Vertex: ${snippet}`;
      }
    } catch {
      /* ignore */
    }
  }
  return `Erro HTTP ${status}. Em desenvolvimento, inicie o proxy: npm run dev:api (porta 8787).`;
}

/** Evita SyntaxError quando o proxy devolve corpo vazio ou HTML em erro. */
async function readResponseBodyAsJson(response: Response): Promise<Record<string, unknown>> {
  const raw = await response.text();
  const trimmed = raw.trim();
  if (!trimmed) {
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: resposta vazia do servidor. 1) Veja o terminal do Vite: "proxy error" / ECONNREFUSED. 2) Rode npm run dev:api e teste http://127.0.0.1:8787/api/vertex/health (deve retornar ok:true). 3) Reinicie npm run dev se mudou .env ou vite.config.`,
      );
    }
    return {};
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const preview = trimmed.slice(0, 160).replace(/\s+/g, ' ');
    throw new Error(
      `HTTP ${response.status}: resposta não é JSON (${preview}${trimmed.length > 160 ? '…' : ''})`,
    );
  }
}

async function callVertex(parts: VertexPart[]): Promise<string> {
  const runtimeApiBase =
    (window as Window & { __TEMVAGA_API_BASE_URL?: string }).__TEMVAGA_API_BASE_URL || '';
  const baseUrl = runtimeApiBase.replace(/\/$/, '');
  const endpoint = `${baseUrl}/api/vertex/generate`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
    }),
  });

  const payload = await readResponseBodyAsJson(response);

  if (!response.ok) {
    const message = extractVertexErrorMessage(payload, response.status);
    console.error('[Vertex] Erro da API:', response.status, payload);
    throw new Error(message);
  }

  const typed = payload as unknown as VertexGenerateResponse;
  const text = typed?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    console.error('[Vertex] Payload sem texto:', payload);
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
    console.error('[Vertex/audio] Falha ao processar áudio:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Não foi possível processar o áudio. Tente novamente ou digite sua descrição.');
  }
}

/** Transcrição fiel do áudio, sem reformatar como currículo ou resumo profissional. */
export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  try {
    return await callVertex([
      {
        inlineData: {
          data: base64Audio,
          mimeType,
        },
      },
      {
        text: 'Transcreva o áudio para texto em Português do Brasil. Seja fiel ao que foi dito: não resuma, não transforme em currículo, não adicione seções nem rótulos (como "Experiência" ou "Objetivo"). Preserve números, datas e documentos como foram falados quando fizer sentido. Se partes estiverem inaudíveis, use [inaudível]. Retorne APENAS o texto transcrito, sem introdução nem comentários.',
      },
    ]);
  } catch (error) {
    console.error('[Vertex/audio] Falha ao transcrever áudio:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Não foi possível transcrever o áudio. Tente novamente ou digite sua mensagem.');
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

export async function extractProfileData(description: string): Promise<Record<string, any>> {
  try {
    const response = await callVertex([
      {
        text: `Você é um assistente de extração de dados. Leia o relato profissional abaixo e extraia as informações de forma estruturada. Retorne APENAS um objeto JSON válido (sem blocos de código de formatação markdown, apenas o JSON). Use estritamente as chaves abaixo, e preencha apenas o que puder deduzir da descrição. 
        
Chaves permitidas:
nome, sexo (Feminino/Masculino/Outro), racaCor, estadoCivil, deficiencia (Sim/Não), municipio, uf, emailPessoal, ddd, numeroTelefone, escolaridade, cursosTecnicos, cursosSuperiores, idiomas, expCompEmpresa, expCompOcupacao, expCompTempo, expSemOcupacao, ocupacaoDesejada, horarioDesejado, dispVeiculo (Sim/Não), dispViagens (Sim/Não).

Relato do usuário: "${description}"`
      }
    ]);
    
    let jsonStr = response.trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.substring(7);
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.substring(3);
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('Erro ao extrair dados do perfil usando Vertex:', error);
    return {};
  }
}
