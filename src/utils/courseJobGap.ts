import type { Curso, Vaga, VagaCursoQualificacao } from '../types';
import { resolveRecommendedCourses, type AcquiredCourseRef } from './jobMatch';

export type JobCourseCoverage = {
  vagaId: string;
  titulo: string;
  recommendedCount: number;
  hasRecommendations: boolean;
  courseNames: string[];
};

export type CandidateGapSummary = {
  targetVagaId: string;
  targetTitulo: string;
  missingCourses: Array<{ id: string; nome: string; bonus: number }>;
  inProgressCourses: Array<{ id: string; nome: string; progress: number }>;
  completedCourses: Array<{ id: string; nome: string }>;
};

/** Cobertura de cursos por vaga (admin / monitoramento). */
export function buildJobCourseCoverage(
  vagas: Vaga[],
  cursos: Curso[],
  relations: VagaCursoQualificacao[] = [],
): {
  items: JobCourseCoverage[];
  withCourses: number;
  withoutCourses: number;
  coveragePct: number;
} {
  const items = vagas.map((vaga) => {
    const recommended = resolveRecommendedCourses(vaga, cursos, relations);
    return {
      vagaId: String(vaga.id),
      titulo: vaga.titulo,
      recommendedCount: recommended.length,
      hasRecommendations: recommended.length > 0,
      courseNames: recommended.map((c) => c.nome),
    };
  });
  const withCourses = items.filter((i) => i.hasRecommendations).length;
  const withoutCourses = items.length - withCourses;
  const coveragePct = items.length === 0 ? 0 : Math.round((withCourses / items.length) * 100);
  return { items, withCourses, withoutCourses, coveragePct };
}

/** Gaps do candidato frente a uma vaga-alvo (ou melhor match). */
export function buildCandidateGapsForVaga(
  vaga: Vaga,
  cursos: Curso[],
  acquiredCourses: AcquiredCourseRef[],
  relations: VagaCursoQualificacao[] = [],
): CandidateGapSummary {
  const recommended = resolveRecommendedCourses(vaga, cursos, relations);
  const acquiredById = new Map(
    acquiredCourses
      .filter((a) => a.curso_id !== undefined && a.curso_id !== null)
      .map((a) => [String(a.curso_id), Math.max(0, Math.min(100, Number(a.progress) || 0))]),
  );

  const missingCourses: CandidateGapSummary['missingCourses'] = [];
  const inProgressCourses: CandidateGapSummary['inProgressCourses'] = [];
  const completedCourses: CandidateGapSummary['completedCourses'] = [];

  for (const curso of recommended) {
    const id = String(curso.id);
    const progress = acquiredById.get(id);
    if (progress === undefined) {
      missingCourses.push({ id, nome: curso.nome, bonus: curso.bonus });
    } else if (progress >= 100) {
      completedCourses.push({ id, nome: curso.nome });
    } else {
      inProgressCourses.push({ id, nome: curso.nome, progress });
    }
  }

  return {
    targetVagaId: String(vaga.id),
    targetTitulo: vaga.titulo,
    missingCourses,
    inProgressCourses,
    completedCourses,
  };
}

/** Para cada curso adquirido, quais vagas ele ajuda a qualificar. */
export function jobsHelpedByCourse(
  cursoId: string | number,
  vagas: Vaga[],
  cursos: Curso[],
  relations: VagaCursoQualificacao[] = [],
): Vaga[] {
  const id = String(cursoId);
  return vagas.filter((vaga) =>
    resolveRecommendedCourses(vaga, cursos, relations).some((c) => String(c.id) === id),
  );
}
