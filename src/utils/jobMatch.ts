import type { Curso, Vaga, VagaCursoQualificacao } from '../types';

/** Stopwords comuns em PT para reduzir ruído lexical. */
const STOPWORDS = new Set([
  'para',
  'com',
  'sem',
  'uma',
  'uns',
  'umas',
  'dos',
  'das',
  'pelo',
  'pela',
  'pelos',
  'pelas',
  'que',
  'qual',
  'quais',
  'como',
  'mais',
  'menos',
  'muito',
  'muita',
  'sobre',
  'entre',
  'este',
  'esta',
  'esse',
  'essa',
  'isso',
  'aqui',
  'onde',
  'quando',
  'também',
  'sendo',
  'serao',
  'serão',
  'sera',
  'será',
  'voce',
  'você',
  'nosso',
  'nossa',
  'seus',
  'suas',
  'deves',
  'deve',
  'podem',
  'pode',
  'area',
  'área',
  'atividades',
  'atividade',
  'responsavel',
  'responsável',
  'experiencia',
  'experiência',
  'anterior',
  'oferecemos',
  'desejavel',
  'desejável',
  'necessario',
  'necessário',
  'ensino',
  'completo',
  'vaga',
  'ideal',
  'primeiro',
  'emprego',
  'local',
  'treinamento',
]);

/** Sinônimos leves de domínio (emprego de entrada / serviços). */
const SYNONYMS: Record<string, string[]> = {
  limpeza: ['higiene', 'higienizacao', 'higienização', 'faxina', 'servicos', 'serviços'],
  higiene: ['limpeza', 'higienizacao', 'higienização'],
  cozinha: ['alimentos', 'culinaria', 'culinária', 'cozinheiro', 'auxiliar'],
  alimentos: ['cozinha', 'manipulacao', 'manipulação'],
  caixa: ['atendimento', 'pdv', 'operador', 'vendas'],
  atendimento: ['caixa', 'cliente', 'vendas'],
  repositor: ['estoque', 'gôndola', 'gondola', 'logistica', 'logística', 'mercadorias'],
  estoque: ['repositor', 'logistica', 'logística', 'mercadorias'],
  seguranca: ['epi', 'nr', 'trabalho'],
  segurança: ['epi', 'nr', 'trabalho'],
  comunicacao: ['entrevista', 'publico', 'público', 'softskill'],
  comunicação: ['entrevista', 'publico', 'público', 'softskill'],
};

export type MatchLevel = 'alto' | 'medio' | 'baixo' | 'indefinido';

export type CourseGap = {
  cursoId: string;
  cursoNome: string;
  bonus: number;
  status: 'missing' | 'in_progress' | 'done';
  progress: number;
};

export type MatchExplanation = {
  /** Score normalizado 0–100 (heurística local, sem IA). */
  score: number;
  level: MatchLevel;
  reasons: string[];
  gaps: CourseGap[];
  titleHits: string[];
  skillHits: string[];
  courseCoveragePct: number;
};

export type AcquiredCourseRef = {
  curso_id?: string | number;
  progress?: number;
};

export type MatchInput = {
  vaga: Vaga;
  profileText: string;
  cursos?: Curso[];
  acquiredCourses?: AcquiredCourseRef[];
  relations?: VagaCursoQualificacao[];
};

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Tokeniza e filtra palavras curtas / stopwords. */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return stripAccents(text.toLowerCase())
    .split(/[^a-z0-9]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function expandWithSynonyms(tokens: string[]): Set<string> {
  const out = new Set(tokens);
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) {
      for (const s of syns) out.add(stripAccents(s.toLowerCase()));
    }
    // Também expandir se o token for sinônimo de alguma chave
    for (const [key, values] of Object.entries(SYNONYMS)) {
      const keyN = stripAccents(key.toLowerCase());
      if (values.some((v) => stripAccents(v.toLowerCase()) === token) || keyN === token) {
        out.add(keyN);
        for (const v of values) out.add(stripAccents(v.toLowerCase()));
      }
    }
  }
  return out;
}

function uniqueHits(a: Set<string>, b: Set<string>): string[] {
  const hits: string[] = [];
  for (const t of a) {
    if (b.has(t)) hits.push(t);
  }
  return hits;
}

/**
 * Resolve cursos recomendados: prioriza `vaga.cursos_recomendados` (Firestore),
 * depois relações mock `vagaCursoQualificacao` (ids numéricos de seed).
 */
export function resolveRecommendedCourses(
  vaga: Vaga,
  cursos: Curso[],
  relations: VagaCursoQualificacao[] = [],
): Array<Curso & { bonus: number }> {
  const byId = new Map(cursos.map((c) => [String(c.id), c]));
  const result: Array<Curso & { bonus: number }> = [];
  const seen = new Set<string>();

  const fromDoc = (vaga.cursos_recomendados || []).map(String);
  for (const id of fromDoc) {
    const curso = byId.get(id);
    if (!curso || seen.has(id)) continue;
    seen.add(id);
    result.push({ ...curso, bonus: 25 });
  }

  for (const rel of relations) {
    if (String(rel.vaga_id) !== String(vaga.id)) continue;
    const id = String(rel.curso_id);
    if (seen.has(id)) {
      const existing = result.find((c) => String(c.id) === id);
      if (existing && rel.bonus_aprovacao > existing.bonus) {
        existing.bonus = rel.bonus_aprovacao;
      }
      continue;
    }
    const curso = byId.get(id);
    if (!curso) continue;
    seen.add(id);
    result.push({ ...curso, bonus: rel.bonus_aprovacao });
  }

  return result;
}

function levelFromScore(score: number, hasProfile: boolean): MatchLevel {
  if (!hasProfile) return 'indefinido';
  if (score >= 65) return 'alto';
  if (score >= 35) return 'medio';
  return 'baixo';
}

/**
 * Matching explicável perfil × vaga × cursos.
 * Pesos aproximados: título 35, descrição/skills 25, cobertura de cursos 30, tags 10.
 */
export function explainJobMatch(input: MatchInput): MatchExplanation {
  const { vaga, profileText, cursos = [], acquiredCourses = [], relations = [] } = input;
  const profileRaw = (profileText || '').trim();
  const hasProfile = profileRaw.length > 0;

  if (!hasProfile) {
    return {
      score: 0,
      level: 'indefinido',
      reasons: ['Complete sua descrição profissional para calcular o match.'],
      gaps: [],
      titleHits: [],
      skillHits: [],
      courseCoveragePct: 0,
    };
  }

  const profileTokens = expandWithSynonyms(tokenize(profileRaw));
  const titleTokens = expandWithSynonyms(tokenize(vaga.titulo || ''));
  const descTokens = expandWithSynonyms(tokenize(vaga.descricao || ''));

  const titleHits = uniqueHits(profileTokens, titleTokens);
  const skillHits = uniqueHits(profileTokens, descTokens).filter((t) => !titleHits.includes(t));

  const titleScore =
    titleTokens.size === 0 ? 0 : Math.min(35, (titleHits.length / Math.max(1, Math.min(titleTokens.size, 6))) * 35);
  const skillScore =
    descTokens.size === 0 ? 0 : Math.min(25, (skillHits.length / Math.max(1, Math.min(descTokens.size, 12))) * 25);

  const recommended = resolveRecommendedCourses(vaga, cursos, relations);
  const acquiredById = new Map(
    acquiredCourses
      .filter((a) => a.curso_id !== undefined && a.curso_id !== null)
      .map((a) => [String(a.curso_id), Math.max(0, Math.min(100, Number(a.progress) || 0))]),
  );

  const gaps: CourseGap[] = recommended.map((curso) => {
    const progress = acquiredById.get(String(curso.id));
    let status: CourseGap['status'] = 'missing';
    if (progress !== undefined) {
      status = progress >= 100 ? 'done' : 'in_progress';
    }
    return {
      cursoId: String(curso.id),
      cursoNome: curso.nome,
      bonus: curso.bonus,
      status,
      progress: progress ?? 0,
    };
  });

  let coursePoints = 0;
  let maxCoursePoints = 0;
  for (const gap of gaps) {
    const weight = Math.max(10, gap.bonus);
    maxCoursePoints += weight;
    if (gap.status === 'done') coursePoints += weight;
    else if (gap.status === 'in_progress') coursePoints += weight * (0.35 + (gap.progress / 100) * 0.5);
  }
  const courseCoveragePct =
    maxCoursePoints === 0 ? 0 : Math.round((coursePoints / maxCoursePoints) * 100);
  const courseScore = maxCoursePoints === 0 ? 0 : (coursePoints / maxCoursePoints) * 30;

  // Affinity por tags dos cursos já adquiridos
  let tagScore = 0;
  const tagHits: string[] = [];
  for (const curso of cursos) {
    const progress = acquiredById.get(String(curso.id));
    if (progress === undefined) continue;
    const tags = tokenize((curso.tags || '').replace(/,/g, ' '));
    const tagSet = expandWithSynonyms(tags);
    const hits = uniqueHits(tagSet, new Set([...titleTokens, ...descTokens]));
    if (hits.length > 0) {
      tagHits.push(...hits);
      tagScore += Math.min(4, hits.length * 2) * (0.5 + (progress / 100) * 0.5);
    }
  }
  tagScore = Math.min(10, tagScore);

  const raw = titleScore + skillScore + courseScore + tagScore;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const reasons: string[] = [];
  if (titleHits.length > 0) {
    reasons.push(`Alinhamento com o título da vaga (${titleHits.slice(0, 4).join(', ')}).`);
  }
  if (skillHits.length > 0) {
    reasons.push(`Skills em comum na descrição (${skillHits.slice(0, 5).join(', ')}).`);
  }
  const doneCount = gaps.filter((g) => g.status === 'done').length;
  const inProgressCount = gaps.filter((g) => g.status === 'in_progress').length;
  if (recommended.length > 0) {
    reasons.push(
      `Cursos recomendados: ${doneCount} concluído(s), ${inProgressCount} em andamento, ${gaps.filter((g) => g.status === 'missing').length} pendente(s).`,
    );
  } else {
    reasons.push('Esta vaga ainda não tem cursos recomendados cadastrados.');
  }
  if (tagHits.length > 0) {
    reasons.push(`Tags dos seus cursos reforçam o perfil (${[...new Set(tagHits)].slice(0, 4).join(', ')}).`);
  }
  if (score < 35 && titleHits.length === 0 && skillHits.length === 0) {
    reasons.push('Pouca sobreposição lexical — atualize o currículo ou faça os cursos recomendados.');
  }

  return {
    score,
    level: levelFromScore(score, hasProfile),
    reasons,
    gaps,
    titleHits,
    skillHits,
    courseCoveragePct,
  };
}

/**
 * Compatível com o uso antigo (número “bruto”).
 * Agora retorna o score 0–100 da heurística explicável.
 */
export function calculateMatchScore(
  vaga: Vaga,
  profileText: string,
  extras?: Omit<MatchInput, 'vaga' | 'profileText'>,
): number {
  return explainJobMatch({
    vaga,
    profileText,
    cursos: extras?.cursos,
    acquiredCourses: extras?.acquiredCourses,
    relations: extras?.relations,
  }).score;
}

export function matchLevelLabel(level: MatchLevel): string {
  switch (level) {
    case 'alto':
      return 'Alto alinhamento';
    case 'medio':
      return 'Alinhamento médio';
    case 'baixo':
      return 'Baixo alinhamento';
    default:
      return 'Match indisponível';
  }
}
