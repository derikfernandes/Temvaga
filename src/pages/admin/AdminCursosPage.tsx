import { useState } from 'react';
import { useAppState } from '../../providers/AppStateProvider';
import { collection, addDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { Check, Pencil, Plus, X } from 'lucide-react';
import type { Curso } from '../../types';

type CourseFormData = {
  nome: string;
  quem_criou: string;
  tags: string;
  url: string;
  conteudo: string;
};

const EMPTY_FORM: CourseFormData = {
  nome: '',
  quem_criou: '',
  tags: '',
  url: '',
  conteudo: '',
};

export function AdminCursosPage() {
  const { cursos } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(EMPTY_FORM);

  const isEditing = editingCourseId !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const ref = doc(db, 'cursos', String(editingCourseId));
        await updateDoc(ref, {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        alert('Curso atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'cursos'), {
          ...formData,
          data_de_criacao: new Date().toISOString(),
          status: 'pending',
          createdAt: serverTimestamp(),
        });
        alert('Curso criado com sucesso!');
      }

      setFormData(EMPTY_FORM);
      setShowForm(false);
      setEditingCourseId(null);
    } catch (error) {
      console.error(error);
      alert(isEditing ? 'Erro ao atualizar curso' : 'Erro ao criar curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    cursoId: string | number,
    status: 'approved' | 'rejected'
  ) => {
    try {
      const ref = doc(db, 'cursos', String(cursoId));
      await updateDoc(ref, { status });
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar curso');
    }
  };

  const handleCreateClick = () => {
    setFormData(EMPTY_FORM);
    setEditingCourseId(null);
    setShowForm(true);
  };

  const handleEditClick = (curso: Curso) => {
    setFormData({
      nome: curso.nome || '',
      quem_criou: curso.quem_criou || '',
      tags: curso.tags || '',
      url: curso.url || '',
      conteudo: curso.conteudo || '',
    });
    setEditingCourseId(curso.id);
    setShowForm(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Gerenciar Cursos</h1>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Inserir Curso
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {isEditing ? 'Editar Curso' : 'Adicionar Novo Curso'}
          </h2>

          <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Curso</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Empresa</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.quem_criou}
                onChange={(e) => setFormData({ ...formData, quem_criou: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tags (vírgula)</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="limpeza, vendas, atendimento"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">URL Externa</label>
              <input
                type="url"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Conteúdo (Markdown)</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCourseId(null);
                  setFormData(EMPTY_FORM);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Edição' : 'Adicionar Curso'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Título</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Empresa</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cursos.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Nenhum curso encontrado.
                </td>
              </tr>
            )}
            {cursos.map((curso: Curso) => (
              <tr key={curso.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{curso.nome}</p>
                </td>
                <td className="p-4 text-sm text-slate-600">{curso.quem_criou || 'N/A'}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                      curso.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : curso.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {curso.status || 'pending'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => void handleUpdateStatus(curso.id, 'approved')}
                      disabled={curso.status === 'approved'}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-30"
                      title="Aprovar"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => void handleUpdateStatus(curso.id, 'rejected')}
                      disabled={curso.status === 'rejected'}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                      title="Recusar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditClick(curso)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="Editar"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
