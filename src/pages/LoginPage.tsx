import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../providers/AppStateProvider';
import { motion } from 'motion/react';
import { User, Lock, Mail, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../initFirebase';
import { PATHS } from '../routes/paths';
import { AudioRecorder } from '../components/AudioRecorder';

type LocationState = { mode?: 'login' | 'register'; from?: string };

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAppState();
  const state = (location.state || {}) as LocationState;

  const [authMode, setAuthMode] = useState<'login' | 'register'>(state.mode === 'register' ? 'register' : 'login');
  const [authError, setAuthError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [descricaoProfissional, setDescricaoProfissional] = useState('');

  useEffect(() => {
    if (state.mode === 'login' || state.mode === 'register') {
      setAuthMode(state.mode);
    }
  }, [state.mode]);

  useEffect(() => {
    if (!authLoading && user) {
      const dest = state.from && state.from !== PATHS.login ? state.from : PATHS.home;
      navigate(dest, { replace: true });
    }
  }, [authLoading, user, navigate, state.from]);

  if (authLoading || user) {
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const cleanCpf = cpf.replace(/\D/g, '');

        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          nome_completo: fullName,
          email,
          cpf: cleanCpf,
          descricao_profissional: descricaoProfissional,
          createdAt: serverTimestamp(),
        });

        await setDoc(doc(db, 'cpf_lookup', cleanCpf), {
          uid: cred.user.uid,
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      const dest = state.from && state.from !== PATHS.login ? state.from : PATHS.home;
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-screen bg-gov-gray-light flex flex-col items-center justify-center p-4">
      <Link
        to={PATHS.root}
        className="absolute top-6 left-6 text-sm font-bold text-gov-blue hover:underline"
      >
        ← Voltar ao início
      </Link>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <Link
          to={PATHS.root}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-gov-blue transition-colors"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </Link>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-6 bg-gov-green rounded-sm" />
              <div className="w-1.5 h-6 bg-gov-yellow rounded-sm" />
              <div className="w-1.5 h-6 bg-gov-blue rounded-sm" />
              <div className="w-1.5 h-6 bg-gov-red rounded-sm" />
            </div>
            <h2 className="text-2xl font-black text-gov-blue tracking-tighter">TemVaga</h2>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gov-blue-dark mb-2">
              {authMode === 'login' ? 'Acesse sua conta gov.br' : 'Crie sua conta'}
            </h3>
            <p className="text-slate-500 text-sm">
              {authMode === 'login'
                ? 'Utilize seu e-mail e senha para acessar o portal de empregos.'
                : 'Junte-se ao portal oficial de intermediação de mão de obra.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">CPF</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Descrição Profissional</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all text-sm"
                  placeholder="Ex: Desenvolvedor Frontend com experiência em React..."
                  value={descricaoProfissional}
                  onChange={(e) => setDescricaoProfissional(e.target.value)}
                />
                <AudioRecorder onTranscription={(text) => setDescricaoProfissional(text)} />
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-gov-red text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{authError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all shadow-lg shadow-gov-blue/20 active:scale-[0.98] mt-4"
            >
              {authMode === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              {authMode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="ml-2 text-gov-blue font-bold hover:underline"
              >
                {authMode === 'login' ? 'Cadastre-se' : 'Faça Login'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
