import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../initFirebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import type { Vaga, Curso } from '../types';

type AppRecord = Record<string, unknown> & { id: string; vaga_id?: string | number };
type CourseRecord = Record<string, unknown> & { id: string; curso_id?: string | number };

export type DemoSessionPayload = {
  user: FirebaseUser;
  profile: Record<string, unknown>;
  vagas: Vaga[];
  cursos: Curso[];
  applications: AppRecord[];
  acquiredCourses: CourseRecord[];
  descricao: string;
};

type AppStateValue = {
  user: FirebaseUser | null;
  loading: boolean;
  userProfile: Record<string, unknown> | null;
  myApplications: AppRecord[];
  myAcquiredCourses: CourseRecord[];
  vagas: Vaga[];
  cursos: Curso[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedVaga: Vaga | null;
  setSelectedVaga: (v: Vaga | null) => void;
  selectedCurso: Curso | null;
  setSelectedCurso: (c: Curso | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  descricaoProfissional: string;
  setDescricaoProfissional: (s: string) => void;
  handleUpdateProfile: () => Promise<void>;
  handleApply: (vagaId: string | number) => Promise<void>;
  handleAcquireCourse: (cursoId: string | number) => Promise<void>;
  demoMode: boolean;
  applyDemoSession: (payload: DemoSessionPayload) => void;
  clearDemoSession: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [myApplications, setMyApplications] = useState<AppRecord[]>([]);
  const [myAcquiredCourses, setMyAcquiredCourses] = useState<CourseRecord[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [descricaoProfissional, setDescricaoProfissional] = useState('');

  const applyDemoSession = useCallback((payload: DemoSessionPayload) => {
    setDemoMode(true);
    setUser(payload.user);
    setUserProfile(payload.profile);
    setVagas(payload.vagas);
    setCursos(payload.cursos);
    setMyApplications(payload.applications);
    setMyAcquiredCourses(payload.acquiredCourses);
    setDescricaoProfissional(payload.descricao);
    setLoading(false);
  }, []);

  const clearDemoSession = useCallback(() => {
    setDemoMode(false);
    setUser(null);
    setUserProfile(null);
    setVagas([]);
    setCursos([]);
    setMyApplications([]);
    setMyAcquiredCourses([]);
    setDescricaoProfissional('');
    setLoading(false);
  }, []);

  useEffect(() => {
    if (demoMode) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) return;

    const isAdmin = userProfile?.role === 'admin';
    const qCursos = isAdmin
      ? collection(db, 'cursos')
      : query(collection(db, 'cursos'), where('status', '==', 'approved'));

    const unsubCursos = onSnapshot(
      qCursos,
      (snapshot) => {
        setCursos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Curso)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'cursos'),
    );
    return () => unsubCursos();
  }, [userProfile?.role, demoMode]);

  useEffect(() => {
    if (demoMode) return;

    const isAdmin = userProfile?.role === 'admin';
    const qVagas = isAdmin
      ? collection(db, 'vagas')
      : query(collection(db, 'vagas'), where('status', '==', 'approved'));

    const unsubVagas = onSnapshot(
      qVagas,
      (snapshot) => {
        setVagas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Vaga)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'vagas'),
    );
    return () => unsubVagas();
  }, [userProfile?.role, demoMode]);

  useEffect(() => {
    if (demoMode || !user) return;

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserProfile(data);
          setDescricaoProfissional((data.descricao_profissional as string) || '');
        } else {
          setUserProfile(null);
          setDescricaoProfissional('');
        }
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      },
    );

    const qApps = query(collection(db, 'applications'), where('user_uid', '==', user.uid));
    const unsubApps = onSnapshot(
      qApps,
      (snapshot) => {
        setMyApplications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'applications');
      },
    );

    const qCourses = query(collection(db, 'acquired_courses'), where('user_uid', '==', user.uid));
    const unsubCourses = onSnapshot(
      qCourses,
      (snapshot) => {
        setMyAcquiredCourses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'acquired_courses');
      },
    );

    return () => {
      unsubProfile();
      unsubApps();
      unsubCourses();
    };
  }, [user, demoMode]);

  const handleUpdateProfile = useCallback(async () => {
    if (!user) return;
    if (demoMode) {
      setUserProfile((prev) => ({ ...(prev || {}), descricao_profissional: descricaoProfissional }));
      alert('Perfil atualizado (modo demo local).');
      return;
    }
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          descricao_profissional: descricaoProfissional,
        },
        { merge: true },
      );
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  }, [user, descricaoProfissional, demoMode]);

  const handleApply = useCallback(
    async (vagaId: string | number) => {
      if (!user) return;
      if (demoMode) {
        if (myApplications.some((a) => a.vaga_id === vagaId)) {
          alert('Você já se candidatou (demo).');
          return;
        }
        setMyApplications((prev) => [
          ...prev,
          { id: `demo-app-${Date.now()}`, vaga_id: vagaId, status: 'applied' },
        ]);
        alert('Candidatura enviada (modo demo local).');
        return;
      }
      try {
        await addDoc(collection(db, 'applications'), {
          vaga_id: vagaId,
          user_uid: user.uid,
          status: 'applied',
          appliedAt: serverTimestamp(),
        });
        alert('Candidatura enviada com sucesso!');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'applications');
      }
    },
    [user, demoMode, myApplications],
  );

  const handleAcquireCourse = useCallback(
    async (cursoId: string | number) => {
      if (!user) return;
      if (myAcquiredCourses.some((c) => c.curso_id === cursoId)) {
        alert('Você já possui este curso!');
        return;
      }
      if (demoMode) {
        setMyAcquiredCourses((prev) => [
          ...prev,
          { id: `demo-ac-${Date.now()}`, curso_id: cursoId, progress: 0 },
        ]);
        alert('Curso adicionado (modo demo local).');
        return;
      }
      try {
        await addDoc(collection(db, 'acquired_courses'), {
          curso_id: cursoId,
          user_uid: user.uid,
          progress: 0,
          acquiredAt: serverTimestamp(),
        });
        alert('Curso adicionado à sua lista!');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'acquired_courses');
      }
    },
    [user, myAcquiredCourses, demoMode],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      user,
      loading,
      userProfile,
      vagas,
      cursos,
      myApplications,
      myAcquiredCourses,
      searchQuery,
      setSearchQuery,
      selectedVaga,
      setSelectedVaga,
      selectedCurso,
      setSelectedCurso,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      descricaoProfissional,
      setDescricaoProfissional,
      handleUpdateProfile,
      handleApply,
      handleAcquireCourse,
      demoMode,
      applyDemoSession,
      clearDemoSession,
    }),
    [
      user,
      loading,
      userProfile,
      vagas,
      cursos,
      myApplications,
      myAcquiredCourses,
      searchQuery,
      selectedVaga,
      selectedCurso,
      isMobileMenuOpen,
      descricaoProfissional,
      handleUpdateProfile,
      handleApply,
      handleAcquireCourse,
      demoMode,
      applyDemoSession,
      clearDemoSession,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
