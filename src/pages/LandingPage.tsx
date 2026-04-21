import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  X,
  Menu,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  Mic,
} from 'lucide-react';
import { PATHS } from '../routes/paths';
import { useAppState } from '../providers/AppStateProvider';

type LandingPageProps = {
  onStartChat: () => void;
};

export function LandingPage({ onStartChat }: LandingPageProps) {
  const navigate = useNavigate();
  const { vagas } = useAppState();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openAuth = (mode: 'login' | 'register') => {
    navigate(PATHS.login, { state: { mode } });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gov-blue-dark text-white py-1 px-4 text-[10px] font-bold uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span>BRASIL</span>
          </div>
          <div className="hidden sm:flex gap-4 opacity-80">
            <span>Acesso à informação</span>
            <span>Participe</span>
            <span>Legislação</span>
            <span>Órgãos do Governo</span>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-2 h-4 bg-gov-green rounded-sm" />
                  <div className="w-2 h-4 bg-gov-yellow rounded-sm" />
                  <div className="w-2 h-4 bg-gov-blue rounded-sm" />
                  <div className="w-2 h-4 bg-gov-red rounded-sm" />
                  <h1 className="text-2xl font-extrabold tracking-tighter text-gov-blue ml-1">TemVaga</h1>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="px-4 py-2 text-sm font-bold text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="px-4 py-2 bg-gov-blue text-white rounded-lg text-sm font-bold hover:bg-gov-blue-dark transition-all shadow-sm"
              >
                Criar Conta
              </button>
            </div>

            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 hover:text-gov-blue transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    openAuth('login');
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3 text-left font-bold text-gov-blue border-b border-slate-50"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openAuth('register');
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3 text-left font-bold text-gov-blue"
                >
                  Criar Conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStartChat();
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-4 bg-gov-yellow text-gov-blue-dark rounded-xl font-black text-center shadow-lg"
                >
                  TemVaga? Fale com a IA
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="relative py-16 lg:py-32 overflow-hidden bg-gov-blue-dark text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gov-green rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gov-yellow rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3 text-gov-yellow" /> O Futuro do Trabalho no Brasil
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter mb-6 leading-tight">
                Oportunidades para quem quer <span className="text-gov-yellow">começar</span> ou recomeçar.
              </h1>
              <p className="text-xl text-white/80 mb-10 leading-relaxed max-w-xl">
                Conectamos você a vagas de auxiliar, serviços gerais, comércio e muito mais, com cursos gratuitos para você se destacar.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={onStartChat}
                  className="px-8 py-4 bg-gov-yellow text-gov-blue-dark rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-gov-yellow/20 flex items-center gap-2"
                >
                  TemVaga? <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-2xl font-bold text-lg transition-all"
                >
                  Já tenho conta
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gov-green rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Vagas em Destaque</h3>
                    <p className="text-white/60 text-sm">Atualizado agora</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {vagas.slice(0, 3).map((vaga) => (
                    <div key={vaga.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                      <div className="text-sm font-bold text-white/90">{vaga.titulo}</div>
                      <div className="text-[10px] font-black bg-gov-yellow text-gov-blue-dark px-2 py-1 rounded uppercase tracking-wider">
                        Disponível
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-gov-blue-dark tracking-tight mb-4">
              Tudo o que você precisa em um só lugar
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              O substituto moderno do PAT, focado em quem busca o primeiro emprego ou novas oportunidades no setor de serviços e comércio.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gov-blue/10 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-gov-blue" />
              </div>
              <h3 className="text-xl font-bold text-gov-blue-dark mb-4">Segurança Gov.br</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Seus dados estão protegidos com os mesmos padrões de segurança do Governo Federal.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gov-green/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-gov-green" />
              </div>
              <h3 className="text-xl font-bold text-gov-blue-dark mb-4">Match Inteligente</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nossa IA recomenda as vagas que mais combinam com seu perfil e sugere cursos para você se destacar.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gov-yellow/10 rounded-2xl flex items-center justify-center mb-6">
                <Mic className="w-6 h-6 text-gov-yellow-dark" />
              </div>
              <h3 className="text-xl font-bold text-gov-blue-dark mb-4">Acessibilidade Total</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Crie seu perfil profissional apenas falando. Nossa tecnologia entende seu áudio e monta seu currículo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
