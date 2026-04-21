import { useState } from 'react';
import { useAppState } from '../../providers/AppStateProvider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../initFirebase';

export function AdminCursosPage() {
  const { cursos } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    quem_criou: '',
    tags: '',
    url: '',
    conteudo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'cursos'), {
        ...formData,
        data_de_criacao: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
      alert('Curso criado com sucesso!');
      setFormData({ nome: '', quem_criou: '', tags: '', url: '', conteudo: '' });
    } catch (error) {
      console.error(error);
      alert('Erro ao criar curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Gerenciar Cursos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Adicionar Novo Curso</h2>
          
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Curso</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Autor / Empresa Criadora</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.quem_criou}
                onChange={e => setFormData({...formData, quem_criou: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tags (separadas por vírgula)</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="limpeza, vendas, atendimento"
                value={formData.tags}
                onChange={e => setFormData({...formData, tags: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">URL Externa (opcional)</label>
              <input
                type="url"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Conteúdo (Markdown)</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.conteudo}
                onChange={e => setFormData({...formData, conteudo: e.target.value})}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar Curso'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Cursos Existentes</h2>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {cursos.length === 0 && (
              <li className="p-6 text-center text-slate-500">Nenhum curso cadastrado.</li>
            )}
            {cursos.map(curso => (
              <li key={curso.id} className="p-4 hover:bg-slate-50">
                <p className="font-bold text-slate-800">{curso.nome}</p>
                <p className="text-sm text-slate-500">Por: {curso.quem_criou}</p>
                <p className="text-xs text-slate-400 mt-1">Tags: {curso.tags}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
