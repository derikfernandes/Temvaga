import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Briefcase,
  GraduationCap,
  ChevronRight,
  Tag,
  Building2,
  Info,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';
import { vagaCursoQualificacao } from '../mockData';
import type { Curso } from '../types';
import { useAppState } from '../providers/AppStateProvider';
import { calculateMatchScore } from '../utils/jobMatch';

export function HomeJobsPage() {
  const {
    userProfile,
    myApplications,
    searchQuery,
    setSearchQuery,
    selectedVaga,
    setSelectedVaga,
    setSelectedCurso,
    handleApply,
    vagas,
    cursos,
  } = useAppState();

  const filteredVagas = useMemo(() => {
    let result = vagas.filter(
      (v) =>
        v.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.empresa?.nome.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const desc = userProfile?.descricao_profissional as string | undefined;
    if (desc) {
      const profileText = desc.toLowerCase();
      result = [...result].sort((a, b) => {
        const scoreA = calculateMatchScore(a, profileText);
        const scoreB = calculateMatchScore(b, profileText);
        return scoreB - scoreA;
      });
    }

    return result;
  }, [searchQuery, userProfile]);

  const getRecommendedCourses = (vagaId: number) => {
    const recommendations = vagaCursoQualificacao.filter((rel) => rel.vaga_id === vagaId);
    return recommendations.map((rel) => {
      const curso = cursos.find((c) => c.id === rel.curso_id)!;
      return {
        ...curso,
        bonus: rel.bonus_aprovacao,
      };
    });
  };

  const profileDesc = ((userProfile?.descricao_profissional as string) || '').toLowerCase();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar por título, empresa ou descrição..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue transition-all text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`${selectedVaga ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-300`}>
          <AnimatePresence mode="wait">
            <motion.div
              key="vagas-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4"
            >
              {filteredVagas.map((vaga) => {
                const hasApplied = myApplications.some((a) => a.vaga_id === vaga.id);
                const matchScore = userProfile?.descricao_profissional
                  ? calculateMatchScore(vaga, profileDesc)
                  : 0;

                return (
                  <motion.div
                    key={vaga.id}
                    layoutId={`vaga-${vaga.id}`}
                    onClick={() => setSelectedVaga(vaga)}
                    className={`p-6 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-md group relative ${
                      selectedVaga?.id === vaga.id ? 'border-gov-blue ring-1 ring-gov-blue' : 'border-slate-200'
                    }`}
                  >
                    {matchScore > 5 && (
                      <div className="absolute -top-2 -right-2 bg-gov-yellow text-gov-blue-dark text-[10px] font-black px-2 py-1 rounded-md shadow-sm flex items-center gap-1 z-10 border border-gov-yellow-dark">
                        <Tag className="w-3 h-3" /> RECOMENDADO PARA VOCÊ
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-gov-blue transition-colors">
                          {vaga.titulo}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-500 mt-1">
                          <Building2 className="w-4 h-4" />
                          <span className="text-sm font-medium">{vaga.empresa?.nome}</span>
                        </div>
                      </div>
                      {hasApplied ? (
                        <div className="bg-gov-green/10 text-gov-green px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Candidatado
                        </div>
                      ) : (
                        <div className="bg-gov-blue/10 text-gov-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          Nova
                        </div>
                      )}
                    </div>
                    <p className="text-slate-600 line-clamp-2 mb-4 text-sm leading-relaxed">{vaga.descricao}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Full-time</span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Remoto</span>
                      </div>
                      <div className="flex items-center text-gov-blue font-bold text-sm gap-1">
                        Ver detalhes <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filteredVagas.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhuma vaga encontrada para sua busca.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {selectedVaga && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-8 sticky top-24 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gov-blue-dark">{selectedVaga.titulo}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedVaga(null)}
                  className="text-slate-400 hover:text-gov-blue p-1"
                >
                  <ArrowRight className="w-6 h-6 rotate-180" />
                </button>
              </div>

              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Sobre a Vaga
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-sm">{selectedVaga.descricao}</p>
                </section>

                <div className="h-px bg-slate-100" />

                <section>
                  <div className="flex justify-between items-end mb-4">
                    <h4 className="text-xs font-bold text-gov-blue uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" /> Cursos Recomendados
                    </h4>
                    <span className="text-[10px] text-slate-400 italic">*Aumento estimado na chance de aprovação</span>
                  </div>
                  <div className="space-y-4">
                    {getRecommendedCourses(selectedVaga.id).map((curso: Curso & { bonus: number }) => (
                      <div
                        key={curso.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCurso(curso)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedCurso(curso)}
                        className="p-4 bg-gov-blue/5 border border-gov-blue/10 rounded-xl group hover:bg-gov-blue/10 transition-colors cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-gov-green text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />+{curso.bonus}% de chance
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <h5 className="font-bold text-slate-900 mb-1 text-sm">{curso.nome}</h5>
                          <PlayCircle className="w-5 h-5 text-gov-blue/40 group-hover:text-gov-blue transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {myApplications.some((a) => a.vaga_id === selectedVaga.id) ? (
                  <div className="w-full py-4 bg-gov-green/10 text-gov-green rounded-xl font-bold text-center border border-gov-green/20">
                    Candidatura Enviada
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleApply(selectedVaga.id)}
                    className="w-full py-4 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all shadow-lg shadow-gov-blue/20 active:scale-[0.98]"
                  >
                    Candidatar-se Agora
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
