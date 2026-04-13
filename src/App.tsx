import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Search, 
  Briefcase, 
  GraduationCap, 
  ChevronRight, 
  Tag, 
  Building2, 
  Calendar,
  Info,
  ArrowRight,
  X,
  PlayCircle,
  BookOpen,
  CheckCircle2,
  LogOut,
  User,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ExternalLink,
  Mic,
  Square,
  MessageSquare,
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  Menu
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './initFirebase';
import { empresas, cursos, vagas, vagaCursoQualificacao } from './mockData';
import { Vaga, Curso } from './types';
import { generateProfileFromAudio, chatWithGemini } from './services/geminiService';

// --- Helpers & Components ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

function AudioRecorder({ onTranscription, variant = 'button' }: { onTranscription: (text: string) => void, variant?: 'button' | 'icon' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            const transcription = await generateProfileFromAudio(base64data, 'audio/webm');
            onTranscription(transcription);
          };
        } catch (error) {
          console.error(error);
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`p-2 rounded-lg transition-all flex items-center justify-center relative ${
          isRecording 
            ? 'bg-gov-red text-white animate-pulse' 
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        {isRecording && (
          <span className="absolute -top-8 right-0 bg-gov-red text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap animate-bounce">
            Gravando...
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={isProcessing}
          className="flex items-center gap-2 px-3 py-1.5 bg-gov-blue/10 text-gov-blue rounded-lg text-xs font-bold hover:bg-gov-blue/20 transition-all disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
          {isProcessing ? 'Processando...' : 'Gravar Descrição por Áudio'}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-1.5 bg-gov-red text-white rounded-lg text-xs font-bold animate-pulse"
        >
          <Square className="w-3 h-3" /> Parar Gravação
        </button>
      )}
      {isRecording && <span className="text-[10px] text-gov-red font-bold animate-pulse uppercase tracking-widest">Gravando áudio...</span>}
    </div>
  );
}

function Chatbot({ user, userProfile, onOpenAuth, isOpen, setIsOpen, showLanding }: { 
  user: FirebaseUser | null, 
  userProfile: any, 
  onOpenAuth: (mode: 'login' | 'register') => void,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  showLanding: boolean
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Olá! Vamos encontrar uma vaga pra você!\nQual o seu CPF? ' }
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<'initial' | 'cpf_check' | 'registration' | 'profile_help' | 'general'>('initial');
  const [regStepIndex, setRegStepIndex] = useState(0);
  const [regData, setRegData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const REGISTRATION_STEPS = [
    { key: 'nome_completo', question: 'Qual seu nome completo?' },
    { key: 'email', question: 'Qual seu email?' },
    { key: 'experiencia_profissional', question: 'Tem experiência profissional? Se sim, descreva suas atividades e quanto tempo ficou em cada uma delas?' },
    { key: 'password', question: 'Para finalizar, escolha uma senha para sua conta:' }
  ];

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = overrideMsg || input;
    if (!userMsg.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    if (!overrideMsg) setInput('');
    setLoading(true);

    if (step === 'initial') {
      const cleanCpf = userMsg.replace(/\D/g, '');
      if (cleanCpf.length === 11) {
        try {
          const docRef = doc(db, 'cpf_lookup', cleanCpf);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Encontrei seu cadastro! Para continuar com segurança, por favor finalize seu login clicando no botão abaixo.' }]);
            setMessages(prev => [...prev, { role: 'bot', text: 'LOGIN_LINK' }]);
          } else {
            setMessages(prev => [...prev, { role: 'bot', text: 'Não encontrei nenhum cadastro com este CPF. Gostaria de criar uma conta agora mesmo por aqui? É só responder algumas perguntas!' }]);
            setMessages(prev => [...prev, { role: 'bot', text: 'CHAT_REGISTER_START' }]);
            setRegData({ cpf: cleanCpf });
          }
        } catch (err) {
          console.error("Erro ao verificar CPF:", err);
          setMessages(prev => [...prev, { role: 'bot', text: 'Houve um erro ao verificar seu CPF. Tente novamente mais tarde.' }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'Por favor, digite um CPF válido (11 números).' }]);
      }
    } else if (step === 'registration') {
      const currentStep = REGISTRATION_STEPS[regStepIndex];
      const updatedData = { ...regData, [currentStep.key]: userMsg };
      setRegData(updatedData);

      if (regStepIndex < REGISTRATION_STEPS.length - 1) {
        const nextStep = REGISTRATION_STEPS[regStepIndex + 1];
        setMessages(prev => [...prev, { role: 'bot', text: nextStep.question }]);
        setRegStepIndex(regStepIndex + 1);
      } else {
        // Finalize registration
        try {
          setMessages(prev => [...prev, { role: 'bot', text: 'Processando seu cadastro... Por favor, aguarde um momento.' }]);
          const cred = await createUserWithEmailAndPassword(auth, updatedData.email, updatedData.password);
          
          const profileData = {
            uid: cred.user.uid,
            nome_completo: updatedData.nome_completo,
            email: updatedData.email,
            cpf: updatedData.cpf,
            experiencia_profissional: updatedData.experiencia_profissional,
            descricao_profissional: updatedData.experiencia_profissional, // Fallback for match logic
            createdAt: serverTimestamp()
          };

          await setDoc(doc(db, 'users', cred.user.uid), profileData);
          await setDoc(doc(db, 'cpf_lookup', updatedData.cpf), {
            uid: cred.user.uid,
            createdAt: serverTimestamp()
          });

          setMessages(prev => [...prev, { role: 'bot', text: 'Cadastro realizado com sucesso! Bem-vindo ao TemVaga. Agora você já pode se candidatar a vagas e fazer cursos.' }]);
          setStep('general');
          
          // Auto-minimize after success
          setTimeout(() => {
            setIsOpen(false);
          }, 3000);
        } catch (err: any) {
          console.error("Erro no cadastro via chat:", err);
          setMessages(prev => [...prev, { role: 'bot', text: `Houve um erro ao criar sua conta: ${err.message}. Por favor, tente novamente.` }]);
          // Reset to a safe step or allow retry
        }
      }
    } else {
      try {
        const response = await chatWithGemini(userMsg, userProfile?.descricao_profissional || '');
        setMessages(prev => [...prev, { role: 'bot', text: response }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'bot', text: 'Desculpe, tive um problema ao processar sua mensagem.' }]);
      }
    }

    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white w-[calc(100vw-2rem)] sm:w-80 h-[450px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col mb-4 overflow-hidden right-0"
          >
            <div className="bg-gov-blue p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-bold text-sm">Assistente TemVaga</span>
              </div>
              <button onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-gov-blue text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                  }`}>
                    {m.text === 'LOGIN_LINK' ? (
                      <button 
                        onClick={() => onOpenAuth('login')}
                        className="flex items-center gap-2 text-gov-blue font-bold underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Finalizar Login aqui
                      </button>
                    ) : m.text === 'REGISTER_LINK' ? (
                      <button 
                        onClick={() => onOpenAuth('register')}
                        className="flex items-center gap-2 text-gov-blue font-bold underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Criar conta aqui
                      </button>
                    ) : m.text === 'CHAT_REGISTER_START' ? (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            setStep('registration');
                            setRegStepIndex(0);
                            setMessages(prev => [...prev, { role: 'bot', text: 'Ótimo! Vamos começar. Qual seu nome completo?' }]);
                          }}
                          className="w-full py-2 bg-gov-blue text-white rounded-lg font-bold text-xs"
                        >
                          Sim, criar agora pelo chat
                        </button>
                        <button 
                          onClick={() => onOpenAuth('register')}
                          className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs"
                        >
                          Prefiro o formulário tradicional
                        </button>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                    <Loader2 className="w-4 h-4 animate-spin text-gov-blue" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gov-blue/20 outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                
                <div className="flex items-center gap-1">
                  <AudioRecorder variant="icon" onTranscription={(text) => handleSend(text)} />
                  
                  <button 
                    onClick={() => handleSend()}
                    className="p-2 bg-gov-blue text-white rounded-lg hover:bg-gov-blue-dark transition-colors flex items-center justify-center"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button (Hidden on Landing) */}
      {!showLanding && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gov-blue text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-12 right-0 bg-white text-gov-blue text-[10px] font-black px-3 py-1.5 rounded-full shadow-md border border-gov-blue/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            TemVaga? Fale comigo!
          </span>
        </button>
      )}
    </div>
  );
}

function LandingPage({ onStartChat, onOpenAuth }: { onStartChat: () => void, onOpenAuth: (mode: 'login' | 'register') => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Gov.br Top Bar */}
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

      {/* Header */}
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
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 text-sm font-bold text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors"
              >
                Entrar
              </button>
              <button 
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 bg-gov-blue text-white rounded-lg text-sm font-bold hover:bg-gov-blue-dark transition-all shadow-sm"
              >
                Criar Conta
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 hover:text-gov-blue transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
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
                  onClick={() => { onOpenAuth('login'); setIsMenuOpen(false); }}
                  className="w-full py-3 text-left font-bold text-gov-blue border-b border-slate-50"
                >
                  Entrar
                </button>
                <button 
                  onClick={() => { onOpenAuth('register'); setIsMenuOpen(false); }}
                  className="w-full py-3 text-left font-bold text-gov-blue"
                >
                  Criar Conta
                </button>
                <button 
                  onClick={() => { onStartChat(); setIsMenuOpen(false); }}
                  className="w-full py-4 bg-gov-yellow text-gov-blue-dark rounded-xl font-black text-center shadow-lg"
                >
                  TemVaga? Fale com a IA
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-32 overflow-hidden bg-gov-blue-dark text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gov-green rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gov-yellow rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
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
                  onClick={onStartChat}
                  className="px-8 py-4 bg-gov-yellow text-gov-blue-dark rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-gov-yellow/20 flex items-center gap-2"
                >
                  TemVaga? <MessageSquare className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onOpenAuth('login')}
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
                  {vagas.slice(0, 3).map(vaga => (
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

      {/* Features Section */}
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


export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [descricaoProfissional, setDescricaoProfissional] = useState('');

  // App State
  const [showLanding, setShowLanding] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vagas' | 'cursos' | 'meus-cursos' | 'perfil'>('vagas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Firestore Data
  const [userProfile, setUserProfile] = useState<any>(null);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myAcquiredCourses, setMyAcquiredCourses] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setLoading(false);
      } else {
        setShowLanding(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !auth.currentUser) return;

    // Listen to user profile
    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
        setDescricaoProfissional(doc.data().descricao_profissional || '');
      }
      setLoading(false);
    }, (err) => {
      setLoading(false);
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    // Listen to applications
    const qApps = query(collection(db, 'applications'), where('user_uid', '==', user.uid));
    const unsubApps = onSnapshot(qApps, (snapshot) => {
      setMyApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'applications');
    });

    // Listen to acquired courses
    const qCourses = query(collection(db, 'acquired_courses'), where('user_uid', '==', user.uid));
    const unsubCourses = onSnapshot(qCourses, (snapshot) => {
      setMyAcquiredCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'acquired_courses');
    });

    return () => {
      unsubProfile();
      unsubApps();
      unsubCourses();
    };
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const cleanCpf = cpf.replace(/\D/g, '');
        
        // Create user profile
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          nome_completo: fullName,
          email: email,
          cpf: cleanCpf,
          descricao_profissional: descricaoProfissional,
          createdAt: serverTimestamp()
        });

        // Create CPF lookup for the chatbot
        await setDoc(doc(db, 'cpf_lookup', cleanCpf), {
          uid: cred.user.uid,
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
      setShowLanding(false);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        descricao_profissional: descricaoProfissional
      }, { merge: true });
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleApply = async (vagaId: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'applications'), {
        vaga_id: vagaId,
        user_uid: user.uid,
        status: 'applied',
        appliedAt: serverTimestamp()
      });
      alert('Candidatura enviada com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'applications');
    }
  };

  const handleAcquireCourse = async (cursoId: number) => {
    if (!user) return;
    // Check if already acquired
    if (myAcquiredCourses.some(c => c.curso_id === cursoId)) {
      alert('Você já possui este curso!');
      return;
    }
    try {
      await addDoc(collection(db, 'acquired_courses'), {
        curso_id: cursoId,
        user_uid: user.uid,
        progress: 0,
        acquiredAt: serverTimestamp()
      });
      alert('Curso adicionado à sua lista!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'acquired_courses');
    }
  };

  // Filter jobs based on search and profile
  const filteredVagas = useMemo(() => {
    let result = vagas.filter(v => 
      v.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.empresa?.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort based on professional description if available
    if (userProfile?.descricao_profissional) {
      const profileText = userProfile.descricao_profissional.toLowerCase();
      
      result = [...result].sort((a, b) => {
        const scoreA = calculateMatchScore(a, profileText);
        const scoreB = calculateMatchScore(b, profileText);
        return scoreB - scoreA; // Higher score first
      });
    }

    return result;
  }, [searchQuery, userProfile]);

  // Simple scoring function for job matching
  function calculateMatchScore(vaga: Vaga, profileText: string) {
    let score = 0;
    const vagaText = (vaga.titulo + " " + vaga.descricao).toLowerCase();
    
    // Split profile into words and check for matches
    const profileWords = profileText.split(/\W+/).filter(w => w.length > 3);
    
    profileWords.forEach(word => {
      if (vagaText.includes(word)) {
        score += 1;
      }
    });

    // Bonus for title matches
    if (vaga.titulo.toLowerCase().split(/\W+/).some(word => word.length > 3 && profileText.includes(word))) {
      score += 5;
    }

    return score;
  }

  // Filter courses based on search
  const filteredCursos = useMemo(() => {
    return cursos.filter(c => 
      c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Get recommended courses for a specific job
  const getRecommendedCourses = (vagaId: number) => {
    const recommendations = vagaCursoQualificacao
      .filter(rel => rel.vaga_id === vagaId);
    
    return recommendations.map(rel => {
      const curso = cursos.find(c => c.id === rel.curso_id);
      return {
        ...curso!,
        bonus: rel.bonus_aprovacao
      };
    });
  };

  const myCursosData = useMemo(() => {
    return myAcquiredCourses.map(ac => {
      const curso = cursos.find(c => c.id === ac.curso_id);
      return { ...curso!, progress: ac.progress };
    }).filter(c => c.id !== undefined);
  }, [myAcquiredCourses]);

  return (
    <div className="min-h-screen bg-gov-gray-light text-gov-gray-dark font-sans">
      {showLanding && !user ? (
        <LandingPage 
          onStartChat={() => setIsChatOpen(true)} 
          onOpenAuth={(mode) => { setAuthMode(mode); setShowAuthModal(true); }}
        />
      ) : (
        <>
          {/* Gov.br Top Bar */}
          <div className="bg-gov-blue-dark text-white py-1 px-4 text-[10px] font-bold uppercase tracking-wider">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex gap-4">
                <span>BRASIL</span>
                <span className="opacity-60"></span>
              </div>
              <div className="flex gap-4 opacity-80">
                <span>Acesso à informação</span>
                <span>Participe</span>
                <span>Legislação</span>
                <span>Órgãos do Governo</span>
              </div>
            </div>
          </div>

          {/* Header */}
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
                
                <nav className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => { setActiveTab('vagas'); setSelectedVaga(null); }}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === 'vagas' 
                        ? 'bg-gov-blue text-white shadow-sm' 
                        : 'text-slate-600 hover:text-gov-blue'
                    }`}
                  >
                    Vagas
                  </button>
                  <button
                    onClick={() => { setActiveTab('cursos'); setSelectedVaga(null); }}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === 'cursos' 
                        ? 'bg-gov-blue text-white shadow-sm' 
                        : 'text-slate-600 hover:text-gov-blue'
                    }`}
                  >
                    Cursos
                  </button>
                  <button
                    onClick={() => { setActiveTab('meus-cursos'); setSelectedVaga(null); }}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === 'meus-cursos' 
                        ? 'bg-gov-blue text-white shadow-sm' 
                        : 'text-slate-600 hover:text-gov-blue'
                    }`}
                  >
                    Meus Cursos
                  </button>
                  <button
                    onClick={() => { setActiveTab('perfil'); setSelectedVaga(null); }}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === 'perfil' 
                        ? 'bg-white text-gov-blue shadow-sm border border-gov-blue/20' 
                        : 'text-slate-600 hover:text-gov-blue'
                    }`}
                  >
                    Perfil
                  </button>
                </nav>

                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase">Usuário</p>
                    <p className="text-sm font-semibold text-slate-700">{userProfile?.nome_completo || user?.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { signOut(auth); setShowLanding(true); }}
                      className="hidden md:block p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Sair"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>

                    {/* Mobile Menu Button */}
                    <button 
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="md:hidden p-2 text-slate-600 hover:text-gov-blue transition-colors"
                    >
                      {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
                >
                  <div className="px-4 py-4 space-y-1">
                    {[
                      { id: 'vagas', label: 'Vagas', icon: Briefcase },
                      { id: 'cursos', label: 'Cursos', icon: GraduationCap },
                      { id: 'meus-cursos', label: 'Meus Cursos', icon: BookOpen },
                      { id: 'perfil', label: 'Perfil', icon: User }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { 
                          setActiveTab(item.id as any); 
                          setSelectedVaga(null); 
                          setIsMobileMenuOpen(false); 
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          activeTab === item.id 
                            ? 'bg-gov-blue/10 text-gov-blue' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                    <button 
                      onClick={() => { signOut(auth); setShowLanding(true); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all mt-4 border-t border-slate-50 pt-4"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da Conta
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        {(activeTab !== 'meus-cursos' && activeTab !== 'perfil') && (
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'vagas' ? "Pesquisar por título, empresa ou descrição..." : "Pesquisar por nome do curso ou tags..."}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue transition-all text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main List */}
          <div className={`${(selectedVaga && activeTab === 'vagas') ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-300`}>
            <AnimatePresence mode="wait">
              {activeTab === 'vagas' ? (
                <motion.div
                  key="vagas-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4"
                >
                  {filteredVagas.map((vaga) => {
                    const hasApplied = myApplications.some(a => a.vaga_id === vaga.id);
                    const matchScore = userProfile?.descricao_profissional ? calculateMatchScore(vaga, userProfile.descricao_profissional.toLowerCase()) : 0;
                    
                    return (
                      <motion.div
                        key={vaga.id}
                        layoutId={`vaga-${vaga.id}`}
                        onClick={() => setSelectedVaga(vaga)}
                        className={`p-6 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-md group relative ${
                          selectedVaga?.id === vaga.id ? 'border-gov-blue ring-1 ring-gov-blue' : 'border-slate-200'
                        }`}
                      >
                        {matchScore > 5 && (
                          <div className="absolute -top-2 -right-2 bg-gov-yellow text-gov-blue-dark text-[10px] font-black px-2 py-1 rounded-md shadow-sm flex items-center gap-1 z-10 border border-gov-yellow-dark">
                            <Tag className="w-3 h-3" /> RECOMENDADO PARA VOCÊ
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-gov-blue transition-colors">
                              {vaga.titulo}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                              <Building2 className="w-4 h-4" />
                              <span className="text-sm font-medium">{vaga.empresa?.nome}</span>
                            </div>
                          </div>
                          {hasApplied ? (
                            <div className="bg-gov-green/10 text-gov-green px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Candidatado
                            </div>
                          ) : (
                            <div className="bg-gov-blue/10 text-gov-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                              Nova
                            </div>
                          )}
                        </div>
                        <p className="text-slate-600 line-clamp-2 mb-4 text-sm leading-relaxed">
                          {vaga.descricao}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Full-time</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Remoto</span>
                          </div>
                          <div className="flex items-center text-gov-blue font-bold text-sm gap-1">
                            Ver detalhes <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {filteredVagas.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Nenhuma vaga encontrada para sua busca.</p>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'cursos' ? (
                <motion.div
                  key="cursos-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredCursos.map((curso) => (
                    <div key={curso.id} onClick={() => setSelectedCurso(curso)}>
                      <CourseCard curso={curso} isAcquired={myAcquiredCourses.some(c => c.curso_id === curso.id)} />
                    </div>
                  ))}
                  {filteredCursos.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                      <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Nenhum curso encontrado para sua busca.</p>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'meus-cursos' ? (
                <motion.div
                  key="meus-cursos-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {myCursosData.map((curso) => (
                    <div key={curso.id} onClick={() => setSelectedCurso(curso)}>
                      <CourseCard curso={curso} isAcquired={true} />
                    </div>
                  ))}
                  {myCursosData.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Você ainda não adquiriu nenhum curso.</p>
                      <button 
                        onClick={() => setActiveTab('cursos')}
                        className="mt-6 px-8 py-3 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all shadow-sm"
                      >
                        Explorar Cursos
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="perfil-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto w-full"
                >
                  <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-gov-blue/10 rounded-xl flex items-center justify-center">
                        <User className="w-8 h-8 text-gov-blue" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gov-blue-dark">{userProfile?.nome_completo}</h2>
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
                        onClick={handleUpdateProfile}
                        className="w-full py-4 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all shadow-lg shadow-gov-blue/20 active:scale-[0.98]"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Details Sidebar (for Vagas) */}
          {activeTab === 'vagas' && selectedVaga && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5 space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-8 sticky top-24 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gov-blue-dark">{selectedVaga.titulo}</h2>
                  <button 
                    onClick={() => setSelectedVaga(null)}
                    className="text-slate-400 hover:text-gov-blue p-1"
                  >
                    <ArrowRight className="w-6 h-6 rotate-180" />
                  </button>
                </div>

                <div className="space-y-6">
                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" /> Sobre a Vaga
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {selectedVaga.descricao}
                    </p>
                  </section>

                  <div className="h-px bg-slate-100" />

                  <section>
                    <div className="flex justify-between items-end mb-4">
                      <h4 className="text-xs font-bold text-gov-blue uppercase tracking-widest flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" /> Cursos Recomendados
                      </h4>
                      <span className="text-[10px] text-slate-400 italic">*Aumento estimado na chance de aprovação</span>
                    </div>
                    <div className="space-y-4">
                      {getRecommendedCourses(selectedVaga.id).map(curso => (
                        <div 
                          key={curso.id} 
                          onClick={() => setSelectedCurso(curso)}
                          className="p-4 bg-gov-blue/5 border border-gov-blue/10 rounded-xl group hover:bg-gov-blue/10 transition-colors cursor-pointer relative overflow-hidden"
                        >
                          {/* Bonus Badge */}
                          <div className="absolute top-0 right-0 bg-gov-green text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            +{curso.bonus}% de chance
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <h5 className="font-bold text-slate-900 mb-1 text-sm">{curso.nome}</h5>
                            <PlayCircle className="w-5 h-5 text-gov-blue/40 group-hover:text-gov-blue transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {myApplications.some(a => a.vaga_id === selectedVaga.id) ? (
                    <div className="w-full py-4 bg-gov-green/10 text-gov-green rounded-xl font-bold text-center border border-gov-green/20">
                      Candidatura Enviada
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleApply(selectedVaga.id)}
                      className="w-full py-4 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all shadow-lg shadow-gov-blue/20 active:scale-[0.98]"
                    >
                      Candidatar-se Agora
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  )}

  <Chatbot 
    user={user} 
    userProfile={userProfile} 
    onOpenAuth={(mode) => { setAuthMode(mode); setShowAuthModal(true); }}
    isOpen={isChatOpen}
    setIsOpen={setIsChatOpen}
    showLanding={showLanding}
  />

      {/* Course Content Modal */}
      <AnimatePresence>
        {selectedCurso && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedCurso(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gov-gray-light">
                <div className="flex items-center gap-4">
                  <div className="bg-gov-blue p-3 rounded-xl">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gov-blue-dark">{selectedCurso.nome}</h2>
                    <p className="text-sm text-slate-500">Oferecido por {selectedCurso.quem_criou}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCurso(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="prose prose-slate max-w-none">
                      <div className="markdown-body">
                        <Markdown>{selectedCurso.conteudo || ''}</Markdown>
                      </div>
                    </div>
                    
                    <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" /> O que você vai aprender
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Fundamentos sólidos', 'Projetos práticos', 'Mentoria exclusiva', 'Certificado incluso'].map(item => (
                          <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-4">Detalhes do Curso</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Duração</span>
                          <span className="font-semibold text-slate-900">20 horas</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Nível</span>
                          <span className="font-semibold text-slate-900">Intermediário</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Acesso</span>
                          <span className="font-semibold text-slate-900">Vitalício</span>
                        </div>
                      </div>
                      {myAcquiredCourses.some(c => c.curso_id === selectedCurso.id) ? (
                        <button 
                          onClick={() => selectedCurso.url && window.open(selectedCurso.url, '_blank')}
                          className="w-full mt-6 py-3 bg-gov-green text-white rounded-xl font-bold hover:bg-gov-green/90 transition-all flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-5 h-5" /> Continuar Curso
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAcquireCourse(selectedCurso.id)}
                          className="w-full mt-6 py-3 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all"
                        >
                          Adquirir Curso
                        </button>
                      )}
                    </div>

                    <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50">
                      <h4 className="font-bold text-slate-900 mb-2 text-sm">Tags Relacionadas</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCurso.tags.split(',').map(tag => (
                          <span key={tag} className="px-2 py-1 bg-white text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
          >
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-gov-blue transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
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
      )}

      {/* Global Loading State */}
      {loading && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 mb-6">
            <div className="w-2 h-8 bg-gov-green rounded-sm animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-8 bg-gov-yellow rounded-sm animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-8 bg-gov-blue rounded-sm animate-bounce" />
            <div className="w-2 h-8 bg-gov-red rounded-sm animate-bounce [animation-delay:0.15s]" />
          </div>
          <p className="text-gov-blue font-black text-xl tracking-tighter">TemVaga</p>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2"></p>
        </div>
      )}
    </div>
  );
}

function CourseCard({ curso, isAcquired }: { curso: Curso, isAcquired?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
      <div className="h-40 bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gov-blue/10 to-gov-blue-dark/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <GraduationCap className="w-16 h-16 text-gov-blue/20" />
        </div>
        {isAcquired && (
          <div className="absolute top-3 right-3 bg-gov-green text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
            <CheckCircle2 className="w-3 h-3" /> Adquirido
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-3">
          {curso.tags.split(',').map(tag => (
            <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
              {tag.trim()}
            </span>
          ))}
        </div>
        <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-gov-blue transition-colors line-clamp-2">
          {curso.nome}
        </h4>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          Oferecido por {curso.quem_criou}
        </p>
        
        {isAcquired && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
              <span>Progresso</span>
              <span>{(curso as any).progress || 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(curso as any).progress || 0}%` }}
                className="h-full bg-gov-green"
              />
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Calendar className="w-3 h-3" /> 20h de conteúdo
          </div>
          <div className="text-gov-blue font-bold text-sm flex items-center gap-1">
            {isAcquired ? 'Continuar' : 'Ver mais'} <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

