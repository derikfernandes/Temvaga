import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, GraduationCap } from 'lucide-react';
import { cursos } from '../mockData';
import { useAppState } from '../providers/AppStateProvider';
import { CourseCard } from '../components/CourseCard';

export function CoursesPage() {
  const { searchQuery, setSearchQuery, myAcquiredCourses, setSelectedCurso } = useAppState();

  const filteredCursos = useMemo(
    () =>
      cursos.filter(
        (c) =>
          c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.tags.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery],
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar por nome do curso ou tags..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue transition-all text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="cursos-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCursos.map((curso) => (
            <div key={curso.id} role="presentation" onClick={() => setSelectedCurso(curso)}>
              <CourseCard curso={curso} isAcquired={myAcquiredCourses.some((c) => c.curso_id === curso.id)} />
            </div>
          ))}
          {filteredCursos.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum curso encontrado para sua busca.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
