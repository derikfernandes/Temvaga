import { useAppState } from '../../providers/AppStateProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { Check, X } from 'lucide-react';
import type { Vaga } from '../../types';

export function AdminVagasPage() {
  const { vagas } = useAppState();

  const handleUpdateStatus = async (vagaId: string | number, status: 'approved' | 'rejected') => {
    try {
      const ref = doc(db, 'vagas', String(vagaId));
      await updateDoc(ref, { status });
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar vaga');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Gerenciar Vagas</h1>

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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
