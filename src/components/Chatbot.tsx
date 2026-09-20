import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Loader2,
  ExternalLink,
  MessageSquare,
  Bot,
  Briefcase,
  GraduationCap,
  User,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../initFirebase';
import { chatWithGemini } from '../services/geminiService';
import { PATHS } from '../routes/paths';
import { AudioRecorder } from './AudioRecorder';

type ChatbotProps = {
  user: FirebaseUser | null;
  userProfile: Record<string, unknown> | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  showLanding: boolean;
};

export function Chatbot({ user, userProfile, isOpen, setIsOpen, showLanding }: ChatbotProps) {
  const navigate = useNavigate();
  const openAuth = (mode: 'login' | 'register') => {
    navigate(PATHS.login, { state: { mode } });
  };

  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    {
      role: 'bot',
      text: 'Olá! Sou o assistente TemVaga.\nPara começar, informe seu CPF (somente números) — assim verifico se você já tem cadastro.',
    },
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<'initial' | 'cpf_check' | 'registration' | 'profile_help' | 'general'>(
    'initial',
  );
  const [regStepIndex, setRegStepIndex] = useState(0);
  const [regData, setRegData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomedUserRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!user || !isOpen) return;
    if (welcomedUserRef.current === user.uid) return;
    welcomedUserRef.current = user.uid;
    const nome = (userProfile?.nome_completo as string) || 'você';
    setStep('general');
    setMessages([
      {
        role: 'bot',
        text: `Olá, ${nome}! Posso ajudar com vagas, cursos ou o seu perfil. Use os atalhos abaixo ou digite sua dúvida.`,
      },
      { role: 'bot', text: 'QUICK_ACTIONS' },
    ]);
  }, [user, userProfile, isOpen]);

  const REGISTRATION_STEPS = [
    { key: 'nome_completo', question: 'Qual seu nome completo?' },
    { key: 'email', question: 'Qual seu email?' },
    {
      key: 'experiencia_profissional',
      question:
        'Tem experiência profissional? Se sim, descreva suas atividades e quanto tempo ficou em cada uma delas.',
    },
    { key: 'password', question: 'Para finalizar, escolha uma senha para sua conta:' },
  ];

  const goTo = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = overrideMsg || input;
    if (!userMsg.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    if (!overrideMsg) setInput('');
    setLoading(true);

    if (step === 'initial') {
      const cleanCpf = userMsg.replace(/\D/g, '');
      if (cleanCpf.length === 11) {
        try {
          const docRef = doc(db, 'cpf_lookup', cleanCpf);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'bot',
                text: 'Encontrei seu cadastro! Para continuar com segurança, finalize o login pelo botão abaixo.',
              },
            ]);
            setMessages((prev) => [...prev, { role: 'bot', text: 'LOGIN_LINK' }]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                role: 'bot',
                text: 'Não encontrei cadastro com este CPF. Quer criar a conta agora pelo chat? São só algumas perguntas.',
              },
            ]);
            setMessages((prev) => [...prev, { role: 'bot', text: 'CHAT_REGISTER_START' }]);
            setRegData({ cpf: cleanCpf });
          }
        } catch (err) {
          console.error('Erro ao verificar CPF:', err);
          const firestoreCode = (err as { code?: string })?.code;
          const isConnectivityIssue = firestoreCode === 'unavailable' || firestoreCode === 'failed-precondition';
          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              text: isConnectivityIssue
                ? 'Não consegui acessar a base de dados agora. Se você estiver em produção, confirme se as variáveis VITE_FIREBASE_* foram configuradas no deploy.'
                : 'Houve um erro ao verificar seu CPF. Tente novamente mais tarde.',
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: 'CPF inválido. Digite 11 números (pode com ou sem pontuação).' },
        ]);
      }
    } else if (step === 'registration') {
      const currentStep = REGISTRATION_STEPS[regStepIndex];
      const updatedData = { ...regData, [currentStep.key]: userMsg };
      setRegData(updatedData);

      if (regStepIndex < REGISTRATION_STEPS.length - 1) {
        const nextStep = REGISTRATION_STEPS[regStepIndex + 1];
        const nextIndex = regStepIndex + 1;
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: `Passo ${nextIndex + 1} de ${REGISTRATION_STEPS.length}: ${nextStep.question}`,
          },
        ]);
        setRegStepIndex(nextIndex);
      } else {
        try {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: 'Processando seu cadastro... Aguarde um momento.' },
          ]);
          const cred = await createUserWithEmailAndPassword(auth, updatedData.email, updatedData.password);

          const profileData = {
            uid: cred.user.uid,
            nome_completo: updatedData.nome_completo,
            email: updatedData.email,
            cpf: updatedData.cpf,
            experiencia_profissional: updatedData.experiencia_profissional,
            descricao_profissional: updatedData.experiencia_profissional,
            createdAt: serverTimestamp(),
          };

          await setDoc(doc(db, 'users', cred.user.uid), profileData);
          await setDoc(doc(db, 'cpf_lookup', updatedData.cpf), {
            uid: cred.user.uid,
            createdAt: serverTimestamp(),
          });

          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              text: 'Cadastro realizado! Bem-vindo ao TemVaga. Você já pode ver vagas, fazer cursos e acompanhar seu progresso.',
            },
            { role: 'bot', text: 'QUICK_ACTIONS' },
          ]);
          setStep('general');

          setTimeout(() => {
            setIsOpen(false);
          }, 4000);
        } catch (err: unknown) {
          console.error('Erro no cadastro via chat:', err);
          const msg = err instanceof Error ? err.message : String(err);
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: `Houve um erro ao criar sua conta: ${msg}. Tente novamente.` },
          ]);
        }
      }
    } else {
      try {
        const desc = (userProfile?.descricao_profissional as string) || '';
        const response = await chatWithGemini(userMsg, desc);
        setMessages((prev) => [...prev, { role: 'bot', text: response }, { role: 'bot', text: 'QUICK_ACTIONS' }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: 'Desculpe, tive um problema ao processar sua mensagem.' },
          { role: 'bot', text: 'QUICK_ACTIONS' },
        ]);
      }
    }

    setLoading(false);
  };

  const registrationProgress =
    step === 'registration'
      ? Math.round(((regStepIndex + 1) / REGISTRATION_STEPS.length) * 100)
      : null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white w-[calc(100vw-2rem)] sm:w-96 h-[min(520px,70vh)] rounded-2xl shadow-2xl border border-slate-200 flex flex-col mb-4 overflow-x-hidden min-h-0 right-0"
          >
            <div className="bg-gov-blue p-4 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <div>
                    <span className="font-bold text-sm block">Assistente TemVaga</span>
                    <span className="text-[10px] opacity-80 font-medium">
                      {step === 'registration'
                        ? `Cadastro · passo ${regStepIndex + 1}/${REGISTRATION_STEPS.length}`
                        : user
                          ? 'Logado · atalhos disponíveis'
                          : 'Identificação por CPF'}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} aria-label="Fechar chat">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {registrationProgress !== null && (
                <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gov-yellow rounded-full transition-all"
                    style={{ width: `${registrationProgress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      m.role === 'user'
                        ? 'bg-gov-blue text-white rounded-tr-none'
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {m.text === 'LOGIN_LINK' ? (
                      <button
                        type="button"
                        onClick={() => openAuth('login')}
                        className="flex items-center gap-2 text-gov-blue font-bold underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Finalizar login
                      </button>
                    ) : m.text === 'REGISTER_LINK' ? (
                      <button
                        type="button"
                        onClick={() => openAuth('register')}
                        className="flex items-center gap-2 text-gov-blue font-bold underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Criar conta no formulário
                      </button>
                    ) : m.text === 'CHAT_REGISTER_START' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStep('registration');
                            setRegStepIndex(0);
                            setMessages((prev) => [
                              ...prev,
                              {
                                role: 'bot',
                                text: `Passo 1 de ${REGISTRATION_STEPS.length}: Qual seu nome completo?`,
                              },
                            ]);
                          }}
                          className="w-full py-2 bg-gov-blue text-white rounded-lg font-bold text-xs"
                        >
                          Sim, criar agora pelo chat
                        </button>
                        <button
                          type="button"
                          onClick={() => openAuth('register')}
                          className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs"
                        >
                          Prefiro o formulário tradicional
                        </button>
                      </div>
                    ) : m.text === 'QUICK_ACTIONS' ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Atalhos
                        </p>
                        <button
                          type="button"
                          onClick={() => goTo(PATHS.home)}
                          className="w-full py-2 px-3 bg-gov-blue/5 text-gov-blue rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gov-blue/10"
                        >
                          <Briefcase className="w-3.5 h-3.5" /> Ver vagas e match
                        </button>
                        <button
                          type="button"
                          onClick={() => goTo(PATHS.homeCourses)}
                          className="w-full py-2 px-3 bg-gov-blue/5 text-gov-blue rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gov-blue/10"
                        >
                          <GraduationCap className="w-3.5 h-3.5" /> Explorar cursos
                        </button>
                        <button
                          type="button"
                          onClick={() => goTo(PATHS.profile)}
                          className="w-full py-2 px-3 bg-gov-blue/5 text-gov-blue rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gov-blue/10"
                        >
                          <User className="w-3.5 h-3.5" /> Completar perfil
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

            <div className="p-3 border-t border-slate-100 bg-white shrink-0">
              <AudioRecorder
                variant="chat"
                audioMode="transcribe"
                sendDisabled={loading}
                chatInput={
                  <input
                    type="text"
                    placeholder={
                      step === 'initial'
                        ? 'Digite seu CPF...'
                        : step === 'registration'
                          ? 'Responda a pergunta...'
                          : 'Digite sua mensagem...'
                    }
                    className="w-full bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gov-blue/20 outline-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
                  />
                }
                onSendClick={() => void handleSend()}
                onTranscription={(text) => {
                  const t = text.trim();
                  if (!t) {
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: 'bot',
                        text: 'Não consegui usar o que foi falado. Tente de novo ou digite sua mensagem.',
                      },
                    ]);
                    return;
                  }
                  void handleSend(t);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showLanding && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gov-blue text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
          aria-label="Abrir assistente TemVaga"
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
