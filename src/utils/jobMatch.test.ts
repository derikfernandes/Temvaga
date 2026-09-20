import { describe, expect, it } from 'vitest';
import { cursos, vagaCursoQualificacao, vagas } from '../mockData';
import {
  calculateMatchScore,
  explainJobMatch,
  resolveRecommendedCourses,
  tokenize,
} from './jobMatch';
import { buildJobCourseCoverage, jobsHelpedByCourse } from './courseJobGap';

describe('tokenize', () => {
  it('remove stopwords e acentos', () => {
    const tokens = tokenize('Responsável pela limpeza de escritórios e áreas');
    expect(tokens).toContain('limpeza');
    expect(tokens).toContain('escritorios');
    expect(tokens).not.toContain('pela');
    expect(tokens).not.toContain('de');
  });
});

describe('resolveRecommendedCourses', () => {
  it('usa cursos_recomendados do documento da vaga', () => {
    const vaga = { ...vagas[0], id: 'abc', cursos_recomendados: ['1', '6'] };
    const resolved = resolveRecommendedCourses(vaga, cursos, []);
    expect(resolved.map((c) => String(c.id))).toEqual(['1', '6']);
  });

  it('faz fallback para relações mock por id', () => {
    const resolved = resolveRecommendedCourses(vagas[3], cursos, vagaCursoQualificacao);
    expect(resolved.some((c) => c.nome.includes('Caixa'))).toBe(true);
  });
});

describe('explainJobMatch', () => {
  it('retorna indefinido sem perfil', () => {
    const result = explainJobMatch({ vaga: vagas[0], profileText: '' });
    expect(result.level).toBe('indefinido');
    expect(result.score).toBe(0);
  });

  it('pontua mais perfil alinhado a limpeza do que a caixa', () => {
    const profile = 'Tenho experiência em limpeza profissional, higiene e uso de EPI em escritórios';
    const limpeza = explainJobMatch({
      vaga: vagas[0],
      profileText: profile,
      cursos,
      relations: vagaCursoQualificacao,
    });
    const caixa = explainJobMatch({
      vaga: vagas[3],
      profileText: profile,
      cursos,
      relations: vagaCursoQualificacao,
    });
    expect(limpeza.score).toBeGreaterThan(caixa.score);
    expect(limpeza.reasons.length).toBeGreaterThan(0);
  });

  it('aumenta score quando cursos recomendados estão concluídos', () => {
    const profile = 'Busco vaga de operador de caixa e atendimento ao cliente';
    const semCursos = explainJobMatch({
      vaga: vagas[3],
      profileText: profile,
      cursos,
      acquiredCourses: [],
      relations: vagaCursoQualificacao,
    });
    const comCursos = explainJobMatch({
      vaga: vagas[3],
      profileText: profile,
      cursos,
      acquiredCourses: [{ curso_id: 3, progress: 100 }],
      relations: vagaCursoQualificacao,
    });
    expect(comCursos.score).toBeGreaterThan(semCursos.score);
    expect(comCursos.gaps.some((g) => g.status === 'done')).toBe(true);
    expect(semCursos.gaps.some((g) => g.status === 'missing')).toBe(true);
  });

  it('calculateMatchScore permanece 0–100', () => {
    const score = calculateMatchScore(vagas[0], 'limpeza higiene escritorio', {
      cursos,
      relations: vagaCursoQualificacao,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('courseJobGap', () => {
  it('calcula cobertura de vagas com cursos', () => {
    const coverage = buildJobCourseCoverage(vagas, cursos, vagaCursoQualificacao);
    expect(coverage.withCourses).toBeGreaterThan(0);
    expect(coverage.coveragePct).toBeGreaterThan(0);
  });

  it('lista vagas ajudadas por um curso', () => {
    const helped = jobsHelpedByCourse(3, vagas, cursos, vagaCursoQualificacao);
    expect(helped.some((v) => v.titulo.includes('Caixa'))).toBe(true);
  });
});
