import { useAppState } from '../../providers/AppStateProvider';
import { BarChart3, Briefcase, GraduationCap, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { collection, getCountFromServer, getDocs } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { SeedDataButton } from '../../components/SeedDataButton';

type SimpleInteraction = {
  user_uid?: string;
  vaga_id?: string | number;
  curso_id?: string | number;
};

type RankedItem = {
  id: string;
  label: string;
  count: number;
};

type ActiveUser = {
  id: string;
  name: string;
  applications: number;
  courses: number;
  total: number;
};

export function AdminDashboardPage() {
  const { vagas, cursos } = useAppState();
  const [userCount, setUserCount] = useState(0);
  const [applications, setApplications] = useState<SimpleInteraction[]>([]);
  const [acquiredCourses, setAcquiredCourses] = useState<SimpleInteraction[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getCountFromServer(collection(db, 'users'))
      .then((snap) => {
        setUserCount(snap.data().count);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [usersSnap, appsSnap, acquiredSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'applications')),
          getDocs(collection(db, 'acquired_courses')),
        ]);

        const nextUsersMap: Record<string, string> = {};
        usersSnap.forEach((userDoc) => {
          const data = userDoc.data() as { nome_completo?: string; email?: string };
          nextUsersMap[userDoc.id] = data.nome_completo || data.email || userDoc.id;
        });

        setUsersMap(nextUsersMap);
        setApplications(appsSnap.docs.map((docSnap) => docSnap.data() as SimpleInteraction));
        setAcquiredCourses(acquiredSnap.docs.map((docSnap) => docSnap.data() as SimpleInteraction));
      } catch (error) {
        console.error(error);
      }
    };

    void loadAnalytics();
  }, []);

  const pendingVagas = vagas.filter(v => v.status === 'pending').length;
  const approvedVagas = vagas.filter(v => v.status === 'approved').length;
  const approvedCursos = cursos.filter((c) => c.status === 'approved').length;

  const topVagas = useMemo<RankedItem[]>(() => {
    const counts = new Map<string, number>();
    for (const app of applications) {
      if (!app.vaga_id) continue;
      const id = String(app.vaga_id);
      counts.set(id, (counts.get(id) || 0) + 1);
    }

    return vagas
      .map((vaga) => ({
        id: String(vaga.id),
        label: vaga.titulo,
        count: counts.get(String(vaga.id)) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applications, vagas]);

  const topCursos = useMemo<RankedItem[]>(() => {
    const counts = new Map<string, number>();
    for (const acquired of acquiredCourses) {
      if (!acquired.curso_id) continue;
      const id = String(acquired.curso_id);
      counts.set(id, (counts.get(id) || 0) + 1);
    }

    return cursos
      .map((curso) => ({
        id: String(curso.id),
        label: curso.nome,
        count: counts.get(String(curso.id)) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [acquiredCourses, cursos]);

  const topUsers = useMemo<ActiveUser[]>(() => {
    const applicationsByUser = new Map<string, number>();
    const coursesByUser = new Map<string, number>();

    for (const app of applications) {
      if (!app.user_uid) continue;
      applicationsByUser.set(app.user_uid, (applicationsByUser.get(app.user_uid) || 0) + 1);
    }

    for (const acquired of acquiredCourses) {
      if (!acquired.user_uid) continue;
      coursesByUser.set(acquired.user_uid, (coursesByUser.get(acquired.user_uid) || 0) + 1);
    }

    const allUserIds = new Set<string>([
      ...applicationsByUser.keys(),
      ...coursesByUser.keys(),
    ]);

    return Array.from(allUserIds)
      .map((uid) => {
        const applicationsCount = applicationsByUser.get(uid) || 0;
        const coursesCount = coursesByUser.get(uid) || 0;
        return {
          id: uid,
          name: usersMap[uid] || uid,
          applications: applicationsCount,
          courses: coursesCount,
          total: applicationsCount + coursesCount,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [applications, acquiredCourses, usersMap]);

  const maxVagas = topVagas[0]?.count || 1;
  const maxCursos = topCursos[0]?.count || 1;
  const maxUsers = topUsers[0]?.total || 1;

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
            <p className="text-xs text-purple-500 font-bold mt-1">{approvedCursos} aprovados</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-12">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Vagas Mais Procuradas</h2>
          </div>
          <div className="space-y-4">
            {topVagas.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-700 truncate pr-2">{item.label}</p>
                  <span className="text-xs font-bold text-slate-500">{item.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(item.count / maxVagas) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topVagas.length === 0 && <p className="text-sm text-slate-500">Sem dados de candidatura ainda.</p>}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Cursos Mais Procurados</h2>
          </div>
          <div className="space-y-4">
            {topCursos.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-700 truncate pr-2">{item.label}</p>
                  <span className="text-xs font-bold text-slate-500">{item.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(item.count / maxCursos) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topCursos.length === 0 && <p className="text-sm text-slate-500">Sem dados de aquisição de curso ainda.</p>}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-800">Usuários Mais Ativos</h2>
          </div>
          <div className="space-y-4">
            {topUsers.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className="text-sm font-semibold text-slate-700 truncate">{item.name}</p>
                  <span className="text-xs font-bold text-slate-500">{item.total}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(item.total / maxUsers) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {item.applications} vagas • {item.courses} cursos
                </p>
              </div>
            ))}
            {topUsers.length === 0 && <p className="text-sm text-slate-500">Sem interações de usuários ainda.</p>}
          </div>
        </section>
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
