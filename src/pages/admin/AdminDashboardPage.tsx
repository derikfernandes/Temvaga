import { useAppState } from '../../providers/AppStateProvider';
import { Briefcase, GraduationCap, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { SeedDataButton } from '../../components/SeedDataButton';

export function AdminDashboardPage() {
  const { vagas, cursos } = useAppState();
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    getCountFromServer(collection(db, 'users')).then(snap => {
      setUserCount(snap.data().count);
    }).catch(console.error);
  }, []);

  const pendingVagas = vagas.filter(v => v.status === 'pending').length;
  const approvedVagas = vagas.filter(v => v.status === 'approved').length;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Usuários Cadastrados</p>
            <p className="text-3xl font-black text-slate-800">{userCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Vagas Aprovadas</p>
            <p className="text-3xl font-black text-slate-800">{approvedVagas}</p>
            {pendingVagas > 0 && <p className="text-xs text-amber-500 font-bold mt-1">{pendingVagas} pendentes de aprovação</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase">Cursos Inseridos</p>
            <p className="text-3xl font-black text-slate-800">{cursos.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Ferramentas de Desenvolvedor</h2>
        <p className="text-slate-600 text-sm mb-6">
          Se o sistema estiver vazio, você pode popular o banco de dados com os dados temporários de demonstração.
        </p>
        <SeedDataButton />
      </div>
    </div>
  );
}
