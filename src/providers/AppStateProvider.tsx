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
import { cursos as mockCursos, vagas as mockVagas } from '../mockData';
import {
  isDemoModeActive,
  persistDemoRole,
  readDemoRoleFromLocation,
  type DemoRole,
} from '../lib/demoMode';

type AppStateValue = {
  user: FirebaseUser | null;
  loading: boolean;
  userProfile: Record<string, unknown> | null;
  myApplications: Array<Record<string, unknown> & { id: string; vaga_id?: string | number }>;
  myAcquiredCourses: Array<Record<string, unknown> & { id: string; curso_id?: string | number }>;
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
};

const AppStateContext = createContext<AppStateValue | null>(null);

function buildDemoUser(role: DemoRole): FirebaseUser {
  return {
    uid: `demo-${role}`,
    email: `demo-${role}@temvaga.local`,
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as FirebaseUser['metadata'],
    providerData: [],
    refreshToken: '',
    tenantId: null,
    displayName: role === 'empresa' ? 'Empresa Demo' : 'Candidato Demo',
    photoURL: null,
    phoneNumber: null,
    providerId: 'demo',
    delete: async () => undefined,
    getIdToken: async () => 'demo-token',
    getIdTokenResult: async () => ({}) as never,
    reload: async () => undefined,
    toJSON: () => ({}),
  } as FirebaseUser;
}

function buildDemoProfile(role: DemoRole): Record<string, unknown> {
  if (role === 'admin') {
    return { role: 'admin', nome_completo: 'Admin Demo', email: 'demo-admin@temvaga.local' };
  }
  if (role === 'empresa') {
    return {
      role: 'empresa',
      nome_completo: 'Empresa Demo Ltda',
      email: 'demo-empresa@temvaga.local',
      nome_fantasia: 'Demo Serviços',
    };
  }
  return {
    role: 'candidato',
    nome_completo: 'Maria Demo',
    email: 'demo-candidato@temvaga.local',
    cpf: '00000000000',
    descricao_profissional:
      'Experiência em limpeza profissional, higiene de escritórios e uso de EPI. Busco vaga de auxiliar de limpeza ou serviços gerais.',
    experiencia_profissional: '2 anos como auxiliar de limpeza em condomínios',
    ocupacaoDesejada: 'Auxiliar de Limpeza',
    escolaridade: 'Ensino médio completo',
  };
}

const approvedMockCursos: Curso[] = mockCursos.map((c) => ({ ...c, status: 'approved' as const }));
const approvedMockVagas: Vaga[] = mockVagas.map((v) => ({
  ...v,
  status: 'approved' as const,
  cursos_recomendados: undefined,
}));

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [demoMode] = useState(() => isDemoModeActive());
  const [demoRole] = useState<DemoRole | null>(() => readDemoRoleFromLocation());

  const [user, setUser] = useState<FirebaseUser | null>(() =>
    demoMode && demoRole ? buildDemoUser(demoRole) : null,
  );
  const [loading, setLoading] = useState(!demoMode);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(() =>
    demoMode && demoRole ? buildDemoProfile(demoRole) : null,
  );
  const [myApplications, setMyApplications] = useState<
    Array<Record<string, unknown> & { id: string; vaga_id?: string | number }>
  >(() => (demoMode ? [{ id: 'demo-app-1', vaga_id: 1, status: 'applied' }] : []));
  const [myAcquiredCourses, setMyAcquiredCourses] = useState<
    Array<Record<string, unknown> & { id: string; curso_id?: string | number }>
  >(() =>
    demoMode
      ? [
          { id: 'demo-ac-1', curso_id: 1, progress: 60 },
          { id: 'demo-ac-6', curso_id: 6, progress: 100 },
        ]
      : [],
  );
  const [vagas, setVagas] = useState<Vaga[]>(() => (demoMode ? approvedMockVagas : []));
  const [cursos, setCursos] = useState<Curso[]>(() => (demoMode ? approvedMockCursos : []));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [descricaoProfissional, setDescricaoProfissional] = useState(
    () => (demoMode && demoRole ? String(buildDemoProfile(demoRole).descricao_profissional || '') : ''),
  );

  useEffect(() => {
    if (demoMode && demoRole) {
      persistDemoRole(demoRole);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [demoMode, demoRole]);

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
