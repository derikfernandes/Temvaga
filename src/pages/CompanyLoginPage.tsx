import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../providers/AppStateProvider';
import { motion } from 'motion/react';
import { Building2, Lock, Mail, X, ShieldCheck, AlertCircle, Briefcase } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../initFirebase';
import { PATHS } from '../routes/paths';

export function CompanyLoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, userProfile } = useAppState();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');

  useEffect(() => {
    if (!authLoading && user && userProfile?.role === 'empresa') {
      navigate(PATHS.company, { replace: true });
    }
  }, [authLoading, user, userProfile, navigate]);

  if (authLoading) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const cleanCnpj = cnpj.replace(/\D/g, '');

        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          nome_completo: fullName,
          email,
          cnpj: cleanCnpj,
          nome_fantasia: nomeFantasia,
          role: 'empresa',
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  };

  const isLoggedAsAnotherRole = !!user && userProfile?.role !== 'empresa';

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-4">
      <Link
        to={PATHS.root}
        className="absolute top-6 left-6 text-sm font-bold text-indigo-600 hover:underline"
      >
        ← Voltar ao início
      </Link>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <Link
          to={PATHS.root}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>
        <div className="p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-indigo-900 tracking-tighter">Portal da Empresa</h2>
          </div>

          <div className="mb-8 text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {authMode === 'login' ? 'Acesse o painel da sua empresa' : 'Cadastre sua empresa no TemVaga'}
            </h3>
            <p className="text-slate-500 text-sm">
              {authMode === 'login'
                ? 'Gerencie vagas e visualize currículos de forma rápida e prática.'
                : 'Publique vagas e encontre os candidatos ideais com a ajuda da nossa IA.'}
            </p>
          </div>

          {isLoggedAsAnotherRole && (
            <div className="p-4 mb-6 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm space-y-3">
              <p>
                A conta atual nao possui perfil de empresa. Use uma conta empresarial para acessar esta area.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await signOut(auth);
                  setAuthError('');
                }}
                className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors"
              >
                Sair desta conta e entrar como empresa
              </button>
            </div>
          )}

          {!isLoggedAsAnotherRole && (
            <form onSubmit={(e) => void handleAuth(e)} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Razão Social / Nome do Responsável</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                      placeholder="Nome da empresa"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">CNPJ</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                        placeholder="00.000.000/0001-00"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Fantasia</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                        placeholder="Nome Fantasia"
                        value={nomeFantasia}
                        onChange={(e) => setNomeFantasia(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                  placeholder="empresa@email.com"
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{authError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] mt-6"
            >
              {authMode === 'login' ? 'Entrar no Painel' : 'Criar Conta de Empresa'}
            </button>
            </form>
          )}

          {!isLoggedAsAnotherRole && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                {authMode === 'login' ? 'Ainda não cadastrou sua empresa?' : 'Já possui cadastro?'}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="ml-2 text-indigo-600 font-bold hover:underline"
                >
                  {authMode === 'login' ? 'Cadastre aqui' : 'Faça Login'}
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
