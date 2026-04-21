import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../initFirebase';
import { Shield, ShieldAlert, Mail } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrors';

export function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });
    return () => unsub();
  }, []);

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    if (!window.confirm('Tem certeza que deseja alterar as permissões deste usuário?')) return;
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar permissão');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Gerenciamento de Usuários</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Nome</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Contato (Email)</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Perfil</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Permissões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{u.nome_completo}</p>
                    <p className="text-xs text-slate-400">ID: {u.id}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${u.email}`} className="hover:text-indigo-600 hover:underline">
                        {u.email}
                      </a>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                      u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => void handleToggleAdmin(u.id, u.role)}
                      className={`flex items-center gap-2 ml-auto px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        u.role === 'admin' 
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                          : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                      }`}
                    >
                      {u.role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      {u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
