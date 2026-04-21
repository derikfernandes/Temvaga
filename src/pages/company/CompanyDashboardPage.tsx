import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { useAppState } from '../../providers/AppStateProvider';
import { Briefcase, Users, Clock } from 'lucide-react';
import type { Vaga } from '../../types';

export function CompanyDashboardPage() {
  const { user } = useAppState();
  const [minhasVagas, setMinhasVagas] = useState<Vaga[]>([]);
  const [totalCandidatos, setTotalCandidatos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Busca vagas criadas pela empresa
        const qVagas = query(collection(db, 'vagas'), where('empresa_id', '==', user.uid));
        const vagasSnap = await getDocs(qVagas);
        const vagasData = vagasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vaga));
        setMinhasVagas(vagasData);

        // Busca todas as candidaturas para essas vagas
        if (vagasData.length > 0) {
          const vagaIds = vagasData.map(v => v.id);
          // O Firestore suporta 'in' limitando a 10 valores, mas para simplificar o MVP faremos consultas separadas ou contagem total se menor que 10.
          // Para segurança, vamos buscar todas as applications se a empresa for dona da vaga, o Firestore Rules permite se `vaga_id` cruzar,
          // mas como não podemos fazer uma query `where('vaga.empresa_id', '==', uid)`, vamos fazer querys in batches:
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
  }, [user]);

  if (loading) {
    return <div className="p-8">Carregando dashboard...</div>;
  }

  const vagasAprovadas = minhasVagas.filter(v => v.status === 'approved').length;
  const vagasPendentes = minhasVagas.filter(v => v.status === 'pending').length;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Dashboard da Empresa</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
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
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Total de Candidatos</p>
            <p className="text-3xl font-black text-slate-800">{totalCandidatos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
