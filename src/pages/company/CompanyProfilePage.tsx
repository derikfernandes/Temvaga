import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { useAppState } from '../../providers/AppStateProvider';
import { Building, ShieldCheck, Mail } from 'lucide-react';

export function CompanyProfilePage() {
  const { user, userProfile } = useAppState();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_fantasia: '',
    cnpj: '',
    descricao_profissional: '', // usaremos isso como a descrição da empresa
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        nome_completo: userProfile.nome_completo || '',
        nome_fantasia: (userProfile as any).nome_fantasia || '',
        cnpj: (userProfile as any).cnpj || '',
        descricao_profissional: userProfile.descricao_profissional || '',
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        nome_completo: formData.nome_completo,
        nome_fantasia: formData.nome_fantasia,
        cnpj: formData.cnpj,
        descricao_profissional: formData.descricao_profissional,
      });
      alert('Perfil da empresa atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Perfil da Empresa</h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Building className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Dados Cadastrais</h2>
              <p className="text-sm text-slate-500">Altere as informações públicas da sua empresa.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Razão Social / Responsável</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none"
                value={formData.nome_completo}
                onChange={e => setFormData({...formData, nome_completo: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Fantasia</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none"
                value={formData.nome_fantasia}
                onChange={e => setFormData({...formData, nome_fantasia: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" /> CNPJ
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.cnpj}
                onChange={e => setFormData({...formData, cnpj: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> E-mail da Conta (Apenas leitura)
              </label>
              <input
                type="email"
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                value={user?.email || ''}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Sobre a Empresa (Aparecerá para os candidatos)</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none"
              placeholder="Descreva a missão, visão e área de atuação da sua empresa..."
              value={formData.descricao_profissional}
              onChange={e => setFormData({...formData, descricao_profissional: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
