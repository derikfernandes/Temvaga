import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Briefcase } from 'lucide-react';
import { useAppState } from '../providers/AppStateProvider';
import { CourseCard } from '../components/CourseCard';
import { PATHS } from '../routes/paths';
import { vagaCursoQualificacao } from '../mockData';
import { jobsHelpedByCourse } from '../utils/courseJobGap';

export function MyCoursesPage() {
  const navigate = useNavigate();
  const { myAcquiredCourses, setSelectedCurso, cursos, vagas } = useAppState();

  const myCursosData = useMemo(
    () =>
      myAcquiredCourses
        .map((ac) => {
          const curso = cursos.find((c) => c.id === ac.curso_id);
          if (!curso) return null;
          const helped = jobsHelpedByCourse(curso.id, vagas, cursos, vagaCursoQualificacao);
          return {
            ...curso,
            progress: ac.progress as number,
            helpedVagas: helped,
          };
        })
        .filter(Boolean) as Array<
        (typeof cursos)[number] & {
          progress: number;
          helpedVagas: typeof vagas;
        }
      >,
    [myAcquiredCourses, cursos, vagas],
  );

  const avgProgress =
    myCursosData.length === 0
      ? 0
      : Math.round(myCursosData.reduce((sum, c) => sum + (c.progress || 0), 0) / myCursosData.length);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-gov-blue-dark tracking-tight">Meus cursos</h2>
        <p className="text-sm text-slate-500 mt-1">
          Monitore progresso e veja quais vagas cada curso ajuda a desbloquear.
        </p>
        {myCursosData.length > 0 && (
          <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inscritos</p>
              <p className="text-xl font-black text-slate-800">{myCursosData.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progresso médio</p>
              <p className="text-xl font-black text-slate-800">{avgProgress}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vagas relacionadas</p>
              <p className="text-xl font-black text-slate-800">
                {new Set(myCursosData.flatMap((c) => c.helpedVagas.map((v) => String(v.id)))).size}
              </p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="meus-cursos-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {myCursosData.map((curso) => (
            <div key={curso.id} className="space-y-2">
              <div role="presentation" onClick={() => setSelectedCurso(curso)}>
                <CourseCard curso={curso} isAcquired />
              </div>
              {curso.helpedVagas.length > 0 ? (
                <div className="px-3 py-2 bg-gov-blue/5 border border-gov-blue/10 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gov-blue flex items-center gap-1 mb-1">
                    <Briefcase className="w-3 h-3" /> Ajuda em {curso.helpedVagas.length} vaga(s)
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {curso.helpedVagas.map((v) => v.titulo).join(' · ')}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 px-1">Sem vínculo direto com vagas aprovadas no momento.</p>
              )}
            </div>
          ))}
          {myCursosData.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Você ainda não adquiriu nenhum curso.</p>
              <button
                type="button"
                onClick={() => navigate(PATHS.homeCourses)}
                className="mt-6 px-8 py-3 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all shadow-sm"
              >
                Explorar Cursos
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
