import { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../initFirebase';
import { vagas, cursos, empresas } from '../mockData';

export function SeedDataButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const batch = writeBatch(db);

      // Cursos (ID fixo original para não quebrar links preexistentes)
      cursos.forEach(curso => {
        const ref = doc(db, 'cursos', String(curso.id));
        batch.set(ref, curso);
      });

      // Vagas (com status approved para aparecerem direto)
      vagas.forEach(vaga => {
        const ref = doc(db, 'vagas', String(vaga.id));
        batch.set(ref, {
          ...vaga,
          status: 'approved',
          empresa: empresas.find(e => e.id === vaga.empresa_id) || null
        });
      });

      await batch.commit();
      setSuccess(true);
      alert('Dados inseridos com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao inserir dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => void handleSeed()}
      disabled={loading}
      className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${
        success ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'
      } disabled:opacity-50`}
    >
      {loading ? 'Inserindo...' : success ? 'Dados Migrados' : 'Popular Banco de Dados'}
    </button>
  );
}
