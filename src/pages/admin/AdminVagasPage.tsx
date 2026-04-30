import { useState } from 'react';
import { useAppState } from '../../providers/AppStateProvider';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { Check, Pencil, Plus, X } from 'lucide-react';
import type { Vaga } from '../../types';

type VagaFormData = {
  titulo: string;
  empresaNome: string;
  descricao: string;
  cursos_recomendados: string[];
};

export function AdminVagasPage() {
  const { vagas, cursos } = useAppState();
  const [warningMode, setWarningMode] = useState<'create' | 'edit' | null>(null);
  const [pendingEditVaga, setPendingEditVaga] = useState<Vaga | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVagaId, setEditingVagaId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<VagaFormData>({
    titulo: '',
    empresaNome: '',
    descricao: '',
    cursos_recomendados: [],
  });
  const isEditing = editingVagaId !== null;

  const handleUpdateStatus = async (vagaId: string | number, status: 'approved' | 'rejected') => {
    try {
      const ref = doc(db, 'vagas', String(vagaId));
      await updateDoc(ref, { status });
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar vaga');
    }
  };

  const handleEditWarning = (vaga: Vaga) => {
    setPendingEditVaga(vaga);
    setWarningMode('edit');
  };

  const handleCreateWarning = () => {
    setPendingEditVaga(null);
    setWarningMode('create');
  };

  const handleConfirmWarning = () => {
    if (warningMode === 'edit' && pendingEditVaga) {
      setFormData({
        titulo: pendingEditVaga.titulo || '',
        empresaNome: pendingEditVaga.empresa?.nome_fantasia || pendingEditVaga.empresa?.nome || '',
        descricao: pendingEditVaga.descricao || '',
        cursos_recomendados: (pendingEditVaga.cursos_recomendados || []).map(String),
      });
      setEditingVagaId(pendingEditVaga.id);
      setShowForm(true);
    }

    if (warningMode === 'create') {
      setFormData({
        titulo: '',
        empresaNome: '',
        descricao: '',
        cursos_recomendados: [],
      });
      setEditingVagaId(null);
      setShowForm(true);
    }

    setWarningMode(null);
    setPendingEditVaga(null);
  };

  const handleCancelWarning = () => {
    setWarningMode(null);
    setPendingEditVaga(null);
  };

  const handleCursoToggle = (cursoId: string) => {
    setFormData((prev) => ({
      ...prev,
      cursos_recomendados: prev.cursos_recomendados.includes(cursoId)
        ? prev.cursos_recomendados.filter((id) => id !== cursoId)
        : [...prev.cursos_recomendados, cursoId],
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingVagaId) {
        const ref = doc(db, 'vagas', String(editingVagaId));
        await updateDoc(ref, {
          titulo: formData.titulo,
          descricao: formData.descricao,
          cursos_recomendados: formData.cursos_recomendados,
          empresa: {
            id: 'admin-manual',
            nome: formData.empresaNome,
            nome_fantasia: formData.empresaNome,
            cnpj: '',
          },
          updatedAt: serverTimestamp(),
        });
        alert('Vaga atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'vagas'), {
          titulo: formData.titulo,
          descricao: formData.descricao,
          cursos_recomendados: formData.cursos_recomendados,
          empresa_id: 'admin-manual',
          empresa: {
            id: 'admin-manual',
            nome: formData.empresaNome,
            nome_fantasia: formData.empresaNome,
            cnpj: '',
          },
          status: 'pending',
          createdAt: serverTimestamp(),
          createdByAdmin: true,
        });
        alert('Vaga criada com sucesso!');
      }

      setShowForm(false);
      setEditingVagaId(null);
      setFormData({
        titulo: '',
        empresaNome: '',
        descricao: '',
        cursos_recomendados: [],
      });
    } catch (error) {
      console.error(error);
      alert(editingVagaId ? 'Erro ao atualizar vaga' : 'Erro ao criar vaga');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Gerenciar Vagas</h1>
        <button
          onClick={handleCreateWarning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Inserir Vaga
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {isEditing ? 'Editar Vaga' : 'Inserir Vaga'}
          </h2>
          <form onSubmit={(e) => void handleSaveEdit(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Título da Vaga</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Empresa</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.empresaNome}
                onChange={(e) => setFormData({ ...formData, empresaNome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
              <textarea
                rows={4}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-3">Cursos Recomendados</label>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
                {cursos.map((curso) => (
                  <label
                    key={curso.id}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                  >
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
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingVagaId(null);
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
                {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Edição' : 'Salvar Vaga'}
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
            {vagas.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Nenhuma vaga encontrada.
                </td>
              </tr>
            )}
            {vagas.map((vaga: Vaga) => (
              <tr key={vaga.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{vaga.titulo}</p>
                </td>
                <td className="p-4 text-sm text-slate-600">
                  {vaga.empresa?.nome_fantasia || vaga.empresa?.nome || 'N/A'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                    vaga.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    vaga.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {vaga.status || 'pending'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => void handleUpdateStatus(vaga.id, 'approved')}
                    disabled={vaga.status === 'approved'}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-30"
                    title="Aprovar"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => void handleUpdateStatus(vaga.id, 'rejected')}
                    disabled={vaga.status === 'rejected'}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                    title="Rejeitar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEditWarning(vaga)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    title="Editar"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {warningMode !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h2 className="text-xl font-extrabold text-slate-800 mb-3">
              {warningMode === 'edit' ? 'Atenção antes de editar' : 'Atenção antes de inserir'}
            </h2>
            {warningMode === 'edit' && pendingEditVaga && (
              <p className="text-slate-600 mb-6 text-justify">
                Você está prestes a editar a vaga <strong>{pendingEditVaga.titulo}</strong>. Alterações feitas no
                painel administrativo podem divergir das informações originais enviadas pela empresa e causar
                <strong> inconsistência no histórico da vaga</strong>. Continue apenas se a alteração for
                <strong> realmente necessária</strong>.
              </p>
            )}
            {warningMode === 'create' && (
              <p className="text-slate-600 mb-6 text-justify">
                A inserção de vagas pelo painel administrativo transfere integralmente ao administrador a
                <strong> responsabilidade</strong> pela validação das informações, pelo alinhamento com a empresa e
                pela confirmação de que a oportunidade está <strong>realmente disponível</strong> para publicação.
                Continue apenas se essa <strong>conferência já foi realizada</strong>.
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelWarning}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmWarning}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors"
              >
                Continuar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
