import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { useAppState } from '../../providers/AppStateProvider';
import { Briefcase, Eye } from 'lucide-react';
import type { Vaga } from '../../types';
import { Link } from 'react-router-dom';
import { PATHS } from '../../routes/paths';

export function CompanyVagasPage() {
  const { user, cursos, userProfile } = useAppState();
  const [minhasVagas, setMinhasVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    cursos_recomendados: [] as string[]
  });

  const loadVagas = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const qVagas = query(collection(db, 'vagas'), where('empresa_id', '==', user.uid));
      const vagasSnap = await getDocs(qVagas);
      setMinhasVagas(vagasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vaga)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVagas();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'vagas'), {
        titulo: formData.titulo,
        descricao: formData.descricao,
        empresa_id: user.uid,
        cursos_recomendados: formData.cursos_recomendados,
        status: 'pending',
        empresa: {
          id: user.uid,
          nome: userProfile?.nome_completo || '',
          nome_fantasia: userProfile?.nome_fantasia || '',
          cnpj: userProfile?.cnpj || ''
        },
        createdAt: serverTimestamp()
      });
      alert('Vaga criada com sucesso! Aguardando aprovação do administrador.');
      setFormData({ titulo: '', descricao: '', cursos_recomendados: [] });
      void loadVagas();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar vaga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCursoToggle = (cursoId: string) => {
    setFormData(prev => ({
      ...prev,
      cursos_recomendados: prev.cursos_recomendados.includes(cursoId)
        ? prev.cursos_recomendados.filter(id => id !== cursoId)
        : [...prev.cursos_recomendados, cursoId]
    }));
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Gerenciar Vagas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Criar Nova Vaga</h2>
          
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Título da Vaga</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                value={formData.titulo}
                onChange={e => setFormData({...formData, titulo: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
              <textarea
                rows={4}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                value={formData.descricao}
                onChange={e => setFormData({...formData, descricao: e.target.value})}
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-3">Cursos Recomendados (Opcional)</label>
              <p className="text-xs text-slate-500 mb-4">
                Selecione cursos da plataforma que aumentariam as chances do candidato ser aprovado.
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
                {cursos.map(curso => (
                  <label key={curso.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded"
                      checked={formData.cursos_recomendados.includes(String(curso.id))}
                      onChange={() => handleCursoToggle(String(curso.id))}
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{curso.nome}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{curso.tags}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 mt-4"
            >
              {isSubmitting ? 'Enviando...' : 'Publicar Vaga (Sujeito a aprovação)'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Minhas Vagas Publicadas</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center text-slate-500">Carregando vagas...</div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
              {minhasVagas.length === 0 && (
                <li className="p-12 text-center text-slate-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  Nenhuma vaga criada ainda.
                </li>
              )}
              {minhasVagas.map(vaga => (
                <li key={vaga.id} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{vaga.titulo}</h3>
                    <div className="mt-2 flex gap-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                        vaga.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        vaga.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {vaga.status || 'pending'}
                      </span>
                      {vaga.cursos_recomendados && vaga.cursos_recomendados.length > 0 && (
                        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-indigo-100 text-indigo-700">
                          {vaga.cursos_recomendados.length} Cursos recomendados
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`${PATHS.companyApplicants}?vagaId=${vaga.id}`}
                    className="p-3 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-colors flex flex-col items-center gap-1"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Candidatos</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
