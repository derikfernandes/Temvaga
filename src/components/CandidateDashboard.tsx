import { Link } from 'react-router-dom';
import {
  Target,
  BookOpen,
  Briefcase,
  UserRound,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useMemo } from 'react';
import { useAppState } from '../providers/AppStateProvider';
import { vagaCursoQualificacao } from '../mockData';
import { explainJobMatch } from '../utils/jobMatch';
import { PATHS } from '../routes/paths';

type CandidateDashboardProps = {
  onOpenCourse?: (cursoId: string) => void;
};

export function CandidateDashboard({ onOpenCourse }: CandidateDashboardProps) {
  const {
    userProfile,
    myApplications,
    myAcquiredCourses,
    vagas,
    cursos,
    setSelectedVaga,
    setSelectedCurso,
  } = useAppState();

  const profileText = [
    userProfile?.descricao_profissional,
    userProfile?.experiencia_profissional,
    userProfile?.ocupacaoDesejada,
    userProfile?.cursosTecnicos,
  ]
    .filter(Boolean)
    .join(' ');

  const profileFields = [
    'nome_completo',
    'cpf',
    'email',
    'descricao_profissional',
    'escolaridade',
    'ocupacaoDesejada',
  ];
  const filled = profileFields.filter((f) => {
    const v = userProfile?.[f];
    return typeof v === 'string' ? v.trim().length > 0 : Boolean(v);
  }).length;
  const profilePct = Math.round((filled / profileFields.length) * 100);

  const coursesDone = myAcquiredCourses.filter((c) => Number(c.progress) >= 100).length;
  const coursesInProgress = myAcquiredCourses.filter(
    (c) => Number(c.progress) > 0 && Number(c.progress) < 100,
  ).length;

  const ranked = useMemo(() => {
    return [...vagas]
      .map((vaga) => ({
        vaga,
        match: explainJobMatch({
          vaga,
          profileText,
          cursos,
          acquiredCourses: myAcquiredCourses,
          relations: vagaCursoQualificacao,
        }),
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [vagas, profileText, cursos, myAcquiredCourses]);

  const top = ranked[0];
  const topGaps = top?.match.gaps.filter((g) => g.status !== 'done') ?? [];

  return (
    <section className="mb-8 space-y-4" aria-label="Painel de acompanhamento">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-gov-blue-dark tracking-tight">Seu acompanhamento</h2>
          <p className="text-sm text-slate-500">
            Progresso de perfil, cursos e alinhamento com vagas — sem surpresas no match.
          </p>
        </div>
        {top && profileText.trim() && (
          <p className="text-xs font-bold uppercase tracking-wider text-gov-blue">
            Melhor alinhamento: {top.match.score}% · {top.vaga.titulo}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gov-blue mb-2">
            <UserRound className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Perfil</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{profilePct}%</p>
          <Link to={PATHS.profile} className="text-xs font-semibold text-gov-blue hover:underline">
            Completar perfil
          </Link>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gov-green mb-2">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cursos</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{myAcquiredCourses.length}</p>
          <p className="text-xs text-slate-500">
            {coursesDone} concluído(s) · {coursesInProgress} em andamento
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gov-blue-dark mb-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Candidaturas</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{myApplications.length}</p>
          <p className="text-xs text-slate-500">enviadas nesta conta</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gaps vs vaga</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{topGaps.length}</p>
          <p className="text-xs text-slate-500 truncate">
            {top ? `em ${top.vaga.titulo}` : 'sem vagas carregadas'}
          </p>
        </div>
      </div>

      {top && topGaps.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-800">
                Cursos que aumentam sua chance em “{top.vaga.titulo}”
              </h3>
              <p className="text-sm text-slate-500">
                Cruza a vaga com os cursos recomendados e o seu progresso atual.
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {topGaps.slice(0, 4).map((gap) => {
              const curso = cursos.find((c) => String(c.id) === gap.cursoId);
              return (
                <li
                  key={gap.cursoId}
                  className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{gap.cursoNome}</p>
                    <p className="text-xs text-slate-500">
                      {gap.status === 'in_progress'
                        ? `Em andamento · ${gap.progress}%`
                        : `Pendente · +${gap.bonus}% estimado`}
                    </p>
                  </div>
                  {curso && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCurso(curso);
                        onOpenCourse?.(gap.cursoId);
                      }}
                      className="text-xs font-bold text-gov-blue flex items-center gap-1 hover:underline shrink-0"
                    >
                      Ver curso <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setSelectedVaga(top.vaga)}
            className="mt-3 text-xs font-bold text-gov-blue-dark hover:underline"
          >
            Abrir detalhes da vaga
          </button>
        </div>
      )}

      {top && topGaps.length === 0 && top.match.gaps.length > 0 && (
        <div className="bg-gov-green/5 border border-gov-green/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-gov-green shrink-0" />
          <p className="text-sm text-slate-700">
            Você já cobre os cursos recomendados para <strong>{top.vaga.titulo}</strong>. Match{' '}
            <strong>{top.match.score}%</strong>.
          </p>
        </div>
      )}
    </section>
  );
}
