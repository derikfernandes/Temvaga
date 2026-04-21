import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import {
  X,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  ExternalLink,
} from 'lucide-react';
import { useAppState } from '../providers/AppStateProvider';

export function CourseModal() {
  const {
    selectedCurso,
    setSelectedCurso,
    myAcquiredCourses,
    handleAcquireCourse,
  } = useAppState();

  if (!selectedCurso) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => setSelectedCurso(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gov-gray-light">
            <div className="flex items-center gap-4">
              <div className="bg-gov-blue p-3 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gov-blue-dark">{selectedCurso.nome}</h2>
                <p className="text-sm text-slate-500">Oferecido por {selectedCurso.quem_criou}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCurso(null)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="prose prose-slate max-w-none">
                  <div className="markdown-body">
                    <Markdown>{selectedCurso.conteudo || ''}</Markdown>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" /> O que você vai aprender
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Fundamentos sólidos', 'Projetos práticos', 'Mentoria exclusiva', 'Certificado incluso'].map(
                      (item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-4">Detalhes do Curso</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Duração</span>
                      <span className="font-semibold text-slate-900">20 horas</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Nível</span>
                      <span className="font-semibold text-slate-900">Intermediário</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Acesso</span>
                      <span className="font-semibold text-slate-900">Vitalício</span>
                    </div>
                  </div>
                  {myAcquiredCourses.some((c) => c.curso_id === selectedCurso.id) ? (
                    <button
                      type="button"
                      onClick={() => selectedCurso.url && window.open(selectedCurso.url, '_blank')}
                      className="w-full mt-6 py-3 bg-gov-green text-white rounded-xl font-bold hover:bg-gov-green/90 transition-all flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5" /> Continuar Curso
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleAcquireCourse(selectedCurso.id)}
                      className="w-full mt-6 py-3 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all"
                    >
                      Adquirir Curso
                    </button>
                  )}
                </div>

                <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50">
                  <h4 className="font-bold text-slate-900 mb-2 text-sm">Tags Relacionadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCurso.tags.split(',').map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
