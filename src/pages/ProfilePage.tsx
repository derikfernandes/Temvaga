import { User } from 'lucide-react';
import { useAppState } from '../providers/AppStateProvider';
import { AudioRecorder } from '../components/AudioRecorder';

export function ProfilePage() {
  const {
    user,
    userProfile,
    descricaoProfissional,
    setDescricaoProfissional,
    handleUpdateProfile,
  } = useAppState();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gov-blue/10 rounded-xl flex items-center justify-center">
              <User className="w-8 h-8 text-gov-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gov-blue-dark">
                {userProfile?.nome_completo as string}
              </h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Descrição Profissional
              </label>
              <textarea
                rows={6}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all text-slate-600 leading-relaxed text-sm"
                placeholder="Conte-nos um pouco sobre sua experiência, habilidades e o que você busca... (Ex: Designer UI/UX com 5 anos de experiência em apps mobile)"
                value={descricaoProfissional}
                onChange={(e) => setDescricaoProfissional(e.target.value)}
              />
              <AudioRecorder onTranscription={(text) => setDescricaoProfissional(text)} />
              <p className="mt-2 text-[10px] text-slate-400 italic">
                * Esta descrição será usada para recomendar as vagas mais compatíveis com seu perfil.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleUpdateProfile()}
              className="w-full py-4 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all shadow-lg shadow-gov-blue/20 active:scale-[0.98]"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
