import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { useAppState } from '../../providers/AppStateProvider';
import { UserCircle, Briefcase, Mail, FileText } from 'lucide-react';
import type { Vaga } from '../../types';

type Applicant = {
  applicationId: string;
  status: string;
  appliedAt: any;
  user: any;
};

export function CompanyApplicantsPage() {
  const { user } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedVagaId = searchParams.get('vagaId');

  const [minhasVagas, setMinhasVagas] = useState<Vaga[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        // Load vagas
        const qVagas = query(collection(db, 'vagas'), where('empresa_id', '==', user.uid));
        const vagasSnap = await getDocs(qVagas);
        const vagasData = vagasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vaga));
        setMinhasVagas(vagasData);

        // If a vaga is selected, load applicants
        if (selectedVagaId) {
          const qApps = query(collection(db, 'applications'), where('vaga_id', '==', selectedVagaId));
          const appsSnap = await getDocs(qApps);
          
          const applicantsData: Applicant[] = [];
          for (const appDoc of appsSnap.docs) {
            const appData = appDoc.data();
            const userSnap = await getDoc(doc(db, 'users', appData.user_uid));
            if (userSnap.exists()) {
              applicantsData.push({
                applicationId: appDoc.id,
                status: appData.status,
                appliedAt: appData.appliedAt,
                user: userSnap.data()
              });
            }
          }
          setApplicants(applicantsData);
        } else {
          setApplicants([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [user, selectedVagaId]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Candidatos</h1>

      <div className="mb-8">
        <label className="block text-sm font-bold text-slate-700 mb-2">Filtrar por Vaga</label>
        <select
          className="w-full max-w-md px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none"
          value={selectedVagaId || ''}
          onChange={(e) => setSearchParams(e.target.value ? { vagaId: e.target.value } : {})}
        >
          <option value="">Selecione uma vaga para visualizar...</option>
          {minhasVagas.map(vaga => (
            <option key={vaga.id} value={vaga.id}>{vaga.titulo}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-500">Carregando candidatos...</div>
      ) : !selectedVagaId ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Selecione uma vaga no menu acima para listar os candidatos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-slate-800">Candidaturas recebidas</h2>
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm font-bold">
              {applicants.length}
            </span>
          </div>

          {applicants.length === 0 && (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-100 shadow-sm">
              <p className="text-slate-500">Nenhum candidato para esta vaga ainda.</p>
            </div>
          )}

          {applicants.map(app => (
            <div key={app.applicationId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-8 h-8 text-slate-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{app.user.nome_completo}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {app.user.email}</span>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-2">
                    <FileText className="w-3 h-3" /> Resumo Profissional
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {app.user.descricao_profissional || 'O candidato ainda não preencheu a descrição profissional.'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-400 font-bold text-right">
                  Aplicou-se em: {app.appliedAt ? new Date(app.appliedAt.toDate()).toLocaleDateString() : 'N/A'}
                </span>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors w-full">
                  Entrar em Contato
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
