import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Loader2,
  ExternalLink,
  MessageSquare,
  Bot,
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
    { role: 'bot', text: 'Olá! Vamos encontrar uma vaga pra você!\nQual o seu CPF? ' },
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<'initial' | 'cpf_check' | 'registration' | 'profile_help' | 'general'>('initial');
  const [regStepIndex, setRegStepIndex] = useState(0);
  const [regData, setRegData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const REGISTRATION_STEPS = [
    { key: 'nome_completo', question: 'Qual seu nome completo?' },
    { key: 'email', question: 'Qual seu email?' },
    {
      key: 'experiencia_profissional',
      question:
        'Tem experiência profissional? Se sim, descreva suas atividades e quanto tempo ficou em cada uma delas?',
    },
    { key: 'password', question: 'Para finalizar, escolha uma senha para sua conta:' },
  ];

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
                text: 'Encontrei seu cadastro! Para continuar com segurança, por favor finalize seu login clicando no botão abaixo.',
              },
            ]);
            setMessages((prev) => [...prev, { role: 'bot', text: 'LOGIN_LINK' }]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                role: 'bot',
                text: 'Não encontrei nenhum cadastro com este CPF. Gostaria de criar uma conta agora mesmo por aqui? É só responder algumas perguntas!',
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
        setMessages((prev) => [...prev, { role: 'bot', text: 'Por favor, digite um CPF válido (11 números).' }]);
      }
    } else if (step === 'registration') {
      const currentStep = REGISTRATION_STEPS[regStepIndex];
      const updatedData = { ...regData, [currentStep.key]: userMsg };
      setRegData(updatedData);

      if (regStepIndex < REGISTRATION_STEPS.length - 1) {
        const nextStep = REGISTRATION_STEPS[regStepIndex + 1];
        setMessages((prev) => [...prev, { role: 'bot', text: nextStep.question }]);
        setRegStepIndex(regStepIndex + 1);
      } else {
        try {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: 'Processando seu cadastro... Por favor, aguarde um momento.' },
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
              text: 'Cadastro realizado com sucesso! Bem-vindo ao TemVaga. Agora você já pode se candidatar a vagas e fazer cursos.',
            },
          ]);
          setStep('general');

          setTimeout(() => {
            setIsOpen(false);
          }, 3000);
        } catch (err: unknown) {
          console.error('Erro no cadastro via chat:', err);
          const msg = err instanceof Error ? err.message : String(err);
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: `Houve um erro ao criar sua conta: ${msg}. Por favor, tente novamente.` },
          ]);
        }
      }
    } else {
      try {
        const desc = (userProfile?.descricao_profissional as string) || '';
        const response = await chatWithGemini(userMsg, desc);
        setMessages((prev) => [...prev, { role: 'bot', text: response }]);
      } catch {
        setMessages((prev) => [...prev, { role: 'bot', text: 'Desculpe, tive um problema ao processar sua mensagem.' }]);
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
            className="bg-white w-[calc(100vw-2rem)] sm:w-80 h-[450px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col mb-4 overflow-x-hidden min-h-0 right-0"
          >
            <div className="bg-gov-blue p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-bold text-sm">Assistente TemVaga</span>
              </div>
              <button type="button" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
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
                        <ExternalLink className="w-3 h-3" /> Finalizar Login aqui
                      </button>
                    ) : m.text === 'REGISTER_LINK' ? (
                      <button
                        type="button"
                        onClick={() => openAuth('register')}
                        className="flex items-center gap-2 text-gov-blue font-bold underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Criar conta aqui
                      </button>
                    ) : m.text === 'CHAT_REGISTER_START' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStep('registration');
                            setRegStepIndex(0);
                            setMessages((prev) => [...prev, { role: 'bot', text: 'Ótimo! Vamos começar. Qual seu nome completo?' }]);
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
                    placeholder="Digite sua mensagem..."
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
