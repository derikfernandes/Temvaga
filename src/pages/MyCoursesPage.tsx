import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { cursos } from '../mockData';
import { useAppState } from '../providers/AppStateProvider';
import { CourseCard } from '../components/CourseCard';
import { PATHS } from '../routes/paths';

export function MyCoursesPage() {
  const navigate = useNavigate();
  const { myAcquiredCourses, setSelectedCurso } = useAppState();

  const myCursosData = useMemo(
    () =>
      myAcquiredCourses
        .map((ac) => {
          const curso = cursos.find((c) => c.id === ac.curso_id);
          return curso ? { ...curso, progress: ac.progress as number } : null;
        })
        .filter(Boolean) as Array<(typeof cursos)[number] & { progress: number }>,
    [myAcquiredCourses],
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnimatePresence mode="wait">
        <motion.div
          key="meus-cursos-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {myCursosData.map((curso) => (
            <div key={curso.id} role="presentation" onClick={() => setSelectedCurso(curso)}>
              <CourseCard curso={curso} isAcquired />
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
