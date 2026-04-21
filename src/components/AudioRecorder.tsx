import { useState, useEffect, useRef, cloneElement, isValidElement, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Mic,
  Square,
  Trash2,
  Pause,
  Play,
  Send,
} from 'lucide-react';
import { generateProfileFromAudio } from '../services/geminiService';

function formatVoiceTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const VOICE_WAVE_BARS = 26;

type AudioRecorderProps = {
  onTranscription: (text: string) => void;
  variant?: 'button' | 'chat';
  chatInput?: ReactElement;
  onSendClick?: () => void;
  sendDisabled?: boolean;
};

export function AudioRecorder({
  onTranscription,
  variant = 'button',
  chatInput,
  onSendClick,
  sendDisabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successFlash, setSuccessFlash] = useState(false);
  const [errorShakeKey, setErrorShakeKey] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(() =>
    Array.from({ length: VOICE_WAVE_BARS }, () => 0.08),
  );

  const cancelledRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef('');
  const recordStartRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseBeginRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!successFlash) return;
    const id = window.setTimeout(() => setSuccessFlash(false), 2200);
    return () => window.clearTimeout(id);
  }, [successFlash]);

  useEffect(() => {
    if (!isRecording) {
      setElapsedMs(0);
      return;
    }
    const tick = () => {
      const now = Date.now();
      let elapsed = now - recordStartRef.current - pausedAccumRef.current;
      if (pauseBeginRef.current != null) {
        elapsed -= now - pauseBeginRef.current;
      }
      setElapsedMs(Math.max(0, elapsed));
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => clearInterval(id);
  }, [isRecording, isPaused]);

  const logAudioError = (context: string, err: unknown) => {
    console.error(`[AudioRecorder:${context}]`, err);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
  };

  const teardownAnalyser = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setWaveform(Array.from({ length: VOICE_WAVE_BARS }, () => 0.08));
  };

  const startWaveformLoop = (stream: MediaStream) => {
    teardownAnalyser();
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const barCount = VOICE_WAVE_BARS;
      const loop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const heights: number[] = [];
        const binPerBar = Math.max(1, Math.floor(bufferLength / barCount));
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < binPerBar; j++) {
            sum += dataArray[Math.min(i * binPerBar + j, bufferLength - 1)] ?? 0;
          }
          const avg = sum / binPerBar / 255;
          heights.push(Math.min(1, Math.pow(avg, 0.65) * 1.35 + 0.06));
        }
        setWaveform(heights);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      logAudioError('analyser', e);
    }
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Falha ao converter áudio para base64.'));
          return;
        }
        const base64 = result.split(',')[1];
        if (!base64) {
          reject(new Error('Falha ao extrair dados do áudio.'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Falha ao ler o áudio gravado.'));
    });

  const getSupportedAudioMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  };

  const startRecording = async () => {
    setErrorMessage('');
    setSuccessFlash(false);
    cancelledRef.current = false;
    chunksRef.current = [];
    recordStartRef.current = Date.now();
    pausedAccumRef.current = 0;
    pauseBeginRef.current = null;
    setIsPaused(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Seu navegador não suporta captura de áudio.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = async () => {
        teardownAnalyser();
        const chunks = chunksRef.current;
        const chosenMime = mimeTypeRef.current;

        if (cancelledRef.current) {
          cancelledRef.current = false;
          recorder.stream.getTracks().forEach((track) => track.stop());
          recorderRef.current = null;
          setMediaRecorder(null);
          setIsRecording(false);
          setIsProcessing(false);
          setIsPaused(false);
          return;
        }

        setIsProcessing(true);
        try {
          if (chunks.length === 0) {
            throw new Error('Nenhum trecho de áudio foi capturado. Tente gravar novamente.');
          }

          const finalMimeType = recorder.mimeType || chosenMime || 'audio/webm';
          const blob = new Blob(chunks, { type: finalMimeType });
          const maxAudioSizeBytes = 8 * 1024 * 1024;
          if (blob.size > maxAudioSizeBytes) {
            throw new Error('Áudio muito longo. Grave até 1 minuto e tente novamente.');
          }
          if (blob.size < 256) {
            throw new Error('Áudio muito curto ou silencioso. Fale um pouco mais antes de parar.');
          }

          const base64data = await blobToBase64(blob);
          const transcription = await generateProfileFromAudio(base64data, finalMimeType);
          const trimmed = transcription.trim();
          if (!trimmed) {
            throw new Error('A transcrição veio vazia. Tente falar de novo, um pouco mais alto.');
          }
          onTranscription(trimmed);
          setSuccessFlash(true);
        } catch (error) {
          logAudioError('processamento', error);
          const message = error instanceof Error ? error.message : 'Erro ao processar áudio.';
          setErrorMessage(message);
          setErrorShakeKey((k) => k + 1);
        } finally {
          setIsProcessing(false);
          recorder.stream.getTracks().forEach((track) => track.stop());
          recorderRef.current = null;
          setMediaRecorder(null);
          setIsRecording(false);
          setIsPaused(false);
        }
      };

      const timesliceMs = 250;
      recorder.start(timesliceMs);
      recorderRef.current = recorder;
      setMediaRecorder(recorder);
      setIsRecording(true);
      startWaveformLoop(stream);
    } catch (err) {
      logAudioError('microfone', err);
      setErrorMessage('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      setErrorShakeKey((k) => k + 1);
      teardownAnalyser();
    }
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    setIsRecording(false);
    setIsProcessing(true);
    try {
      if (typeof rec.requestData === 'function') {
        rec.requestData();
      }
    } catch (e) {
      logAudioError('requestData', e);
    }
    rec.stop();
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    teardownAnalyser();
    setIsRecording(false);
    setIsPaused(false);
    pauseBeginRef.current = null;
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        if (typeof rec.requestData === 'function') {
          rec.requestData();
        }
      } catch (e) {
        logAudioError('requestData-cancel', e);
      }
      rec.stop();
    } else {
      setIsRecording(false);
      setIsProcessing(false);
      recorderRef.current = null;
      setMediaRecorder(null);
    }
  };

  const togglePause = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    if (typeof rec.pause !== 'function' || typeof rec.resume !== 'function') {
      return;
    }
    if (rec.state === 'recording') {
      rec.pause();
      pauseBeginRef.current = Date.now();
      setIsPaused(true);
      void audioCtxRef.current?.suspend();
    } else if (rec.state === 'paused') {
      rec.resume();
      if (pauseBeginRef.current != null) {
        pausedAccumRef.current += Date.now() - pauseBeginRef.current;
        pauseBeginRef.current = null;
      }
      setIsPaused(false);
      void audioCtxRef.current?.resume();
    }
  };

  const mergedChatInput =
    variant === 'chat' && chatInput && isValidElement(chatInput)
      ? (() => {
          const el = chatInput as ReactElement<{ className?: string }>;
          return cloneElement(el, {
            className: [el.props.className, 'min-w-0'].filter(Boolean).join(' '),
          });
        })()
      : null;

  if (variant === 'chat') {
    const showErrorShake = !!errorMessage && !isRecording && !isProcessing;
    const voiceActive = isRecording || isProcessing;

    return (
      <div className="flex flex-col gap-2 w-full min-w-0">
        <AnimatePresence mode="wait">
          {!voiceActive ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0.92 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.9 }}
              className="flex items-center gap-2 w-full min-w-0"
            >
              <div className="flex-1 min-w-0">{mergedChatInput}</div>
              <motion.button
                key={errorShakeKey}
                type="button"
                layout
                onClick={startRecording}
                disabled={isProcessing || sendDisabled}
                animate={
                  showErrorShake
                    ? { x: [0, -5, 5, -5, 0] }
                    : successFlash
                      ? { scale: [1, 1.06, 1] }
                      : { scale: 1, x: 0 }
                }
                transition={{ duration: showErrorShake ? 0.4 : 0.35 }}
                className={`p-2.5 rounded-full shrink-0 border transition-colors ${
                  successFlash
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : showErrorShake
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-transparent'
                } disabled:opacity-50`}
                title="Gravar áudio"
              >
                {successFlash ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>
              <button
                type="button"
                onClick={() => onSendClick?.()}
                disabled={sendDisabled}
                className="p-2.5 bg-gov-blue text-white rounded-full hover:bg-gov-blue-dark transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 shadow-sm"
                title="Enviar"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1.5 w-full min-w-0 rounded-full bg-white border border-slate-200/90 shadow-sm pl-1.5 pr-1 py-1"
            >
              <button
                type="button"
                onClick={cancelRecording}
                disabled={isProcessing}
                className="p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-40"
                title="Descartar"
              >
                <Trash2 className="w-5 h-5 stroke-[1.75]" />
              </button>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-pulse shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" />
              <span className="text-sm font-semibold text-slate-800 tabular-nums min-w-[2.75rem] shrink-0">
                {formatVoiceTime(elapsedMs)}
              </span>
              <div className="flex-1 flex items-center justify-center gap-[2px] h-9 min-w-0 px-0.5 overflow-hidden">
                {isProcessing ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-gov-blue" />
                    Enviando áudio…
                  </div>
                ) : (
                  waveform.map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full bg-slate-400 shrink-0 origin-bottom"
                      animate={{
                        scaleY: isPaused ? 0.35 : 0.35 + h * 0.95,
                        opacity: isPaused ? 0.45 : 0.55 + h * 0.45,
                      }}
                      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
                      style={{ height: 22 }}
                    />
                  ))
                )}
              </div>
              {!isProcessing &&
                typeof MediaRecorder !== 'undefined' &&
                typeof MediaRecorder.prototype.pause === 'function' && (
                <button
                  type="button"
                  onClick={togglePause}
                  className="p-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  title={isPaused ? 'Continuar' : 'Pausar'}
                >
                  {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
                </button>
              )}
              <button
                type="button"
                onClick={stopRecording}
                disabled={isProcessing}
                className="p-2.5 rounded-full bg-[#25D366] text-white hover:bg-[#20bd5c] shadow-md shrink-0 disabled:opacity-50 flex items-center justify-center transition-transform active:scale-95"
                title="Enviar áudio"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Send className="w-5 h-5 translate-x-px" strokeWidth={2.25} />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!!errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 text-[11px] leading-snug text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2 min-w-0 whitespace-normal break-words"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex flex-wrap items-center gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gov-blue/10 text-gov-blue rounded-lg text-xs font-bold hover:bg-gov-blue/20 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
            {isProcessing ? 'Enviando áudio…' : 'Gravar Descrição por Áudio'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-3 py-1.5 bg-gov-red text-white rounded-lg text-xs font-bold animate-pulse"
          >
            <Square className="w-3 h-3" /> Parar e enviar
          </button>
        )}
        {isRecording && (
          <span className="text-[10px] text-gov-red font-bold animate-pulse uppercase tracking-widest">
            Gravando…
          </span>
        )}
        {successFlash && !isRecording && !isProcessing && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Áudio recebido e texto atualizado
          </motion.span>
        )}
      </div>
      <AnimatePresence>
        {!!errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
