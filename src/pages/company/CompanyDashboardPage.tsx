import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { useAppState } from '../../providers/AppStateProvider';
import { Briefcase, Users, Clock, Link2, GraduationCap } from 'lucide-react';
import type { Vaga } from '../../types';
import { buildJobCourseCoverage } from '../../utils/courseJobGap';
import { vagaCursoQualificacao } from '../../mockData';
import { Link } from 'react-router-dom';
import { PATHS } from '../../routes/paths';

export function CompanyDashboardPage() {
  const { user, cursos, demoMode, vagas: appVagas } = useAppState();
  const [minhasVagas, setMinhasVagas] = useState<Vaga[]>([]);
  const [totalCandidatos, setTotalCandidatos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      if (demoMode) {
        setMinhasVagas(appVagas);
        setTotalCandidatos(3);
        setLoading(false);
        return;
      }

      try {
        const qVagas = query(collection(db, 'vagas'), where('empresa_id', '==', user.uid));
        const vagasSnap = await getDocs(qVagas);
        const vagasData = vagasSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Vaga));
        setMinhasVagas(vagasData);

        if (vagasData.length > 0) {
          const vagaIds = vagasData.map((v) => v.id);
          let candidaturasCount = 0;
          for (let i = 0; i < vagaIds.length; i += 10) {
            const batch = vagaIds.slice(i, i + 10);
            const qApps = query(collection(db, 'applications'), where('vaga_id', 'in', batch));
            const snap = await getDocs(qApps);
            candidaturasCount += snap.size;
          }
          setTotalCandidatos(candidaturasCount);
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard da empresa', err);
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, [user, demoMode, appVagas]);

  const coverage = useMemo(
    () => buildJobCourseCoverage(minhasVagas, cursos, vagaCursoQualificacao),
    [minhasVagas, cursos],
  );

  if (loading) {
    return <div className="p-8 text-slate-600">Carregando dashboard...</div>;
  }

  const vagasAprovadas = minhasVagas.filter((v) => v.status === 'approved').length;
  const vagasPendentes = minhasVagas.filter((v) => v.status === 'pending').length;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Dashboard da Empresa</h1>
      <p className="text-sm text-slate-500 mb-8">
        Acompanhe vagas, candidaturas e se suas vagas têm cursos de qualificação vinculados.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-gov-green/10 text-gov-green rounded-xl">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Vagas Ativas</p>
            <p className="text-3xl font-black text-slate-800">{vagasAprovadas}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Vagas Pendentes</p>
            <p className="text-3xl font-black text-slate-800">{vagasPendentes}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-gov-blue/10 text-gov-blue rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Total de Candidatos</p>
            <p className="text-3xl font-black text-slate-800">{totalCandidatos}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-gov-yellow/20 text-gov-blue-dark rounded-xl">
            <Link2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Vagas com Cursos</p>
            <p className="text-3xl font-black text-slate-800">{coverage.coveragePct}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {coverage.withoutCourses > 0
                ? `${coverage.withoutCourses} sem cursos recomendados`
                : 'Todas vinculadas'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-gov-blue" />
            <h2 className="text-lg font-bold text-slate-800">Qualificação por vaga</h2>
          </div>
          <ul className="space-y-3">
            {coverage.items.slice(0, 8).map((item) => (
              <li key={item.vagaId} className="border-b border-slate-50 pb-3 last:border-0">
                <p className="font-semibold text-slate-800 text-sm">{item.titulo}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {item.hasRecommendations
                    ? item.courseNames.join(' · ')
                    : 'Nenhum curso recomendado — edite a vaga para vincular.'}
                </p>
              </li>
            ))}
            {coverage.items.length === 0 && (
              <p className="text-sm text-slate-500">Você ainda não publicou vagas.</p>
            )}
          </ul>
          <Link
            to={PATHS.companyVagas}
            className="inline-block mt-4 text-sm font-bold text-gov-blue hover:underline"
          >
            Gerenciar vagas
          </Link>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gov-green" />
            <h2 className="text-lg font-bold text-slate-800">Próximos passos</h2>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
            <li>Publique ou revise vagas com cursos recomendados claros.</li>
            <li>Acompanhe candidatos e o alinhamento de formação.</li>
            <li>Atualize o perfil da empresa para os candidatos.</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={PATHS.companyApplicants}
              className="px-4 py-2 bg-gov-blue text-white rounded-lg text-sm font-bold hover:bg-gov-blue-dark"
            >
              Ver candidatos
            </Link>
            <Link
              to={PATHS.companyProfile}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200"
            >
              Perfil da empresa
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
