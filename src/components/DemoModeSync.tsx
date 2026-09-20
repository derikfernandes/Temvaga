import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../providers/AppStateProvider';
import {
  isFirebasePlaceholder,
  persistDemoRole,
  readDemoRoleFromLocation,
  type DemoRole,
} from '../lib/demoMode';
import { cursos as mockCursos, vagas as mockVagas } from '../mockData';
import type { Curso, Vaga } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';

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
const approvedMockVagas: Vaga[] = mockVagas.map((v) => ({ ...v, status: 'approved' as const }));

/** Mantém o modo demo alinhado à query string (?demo=1|admin|empresa). */
export function DemoModeSync() {
  const location = useLocation();
  const { applyDemoSession, clearDemoSession } = useAppState();
  const lastRoleRef = useRef<DemoRole | 'off' | null>(null);

  useEffect(() => {
    if (!isFirebasePlaceholder()) return;
    const role = readDemoRoleFromLocation(location.search);
    const nextKey: DemoRole | 'off' = role ?? 'off';
    if (lastRoleRef.current === nextKey) return;
    lastRoleRef.current = nextKey;

    if (role) {
      persistDemoRole(role);
      applyDemoSession({
        user: buildDemoUser(role),
        profile: buildDemoProfile(role),
        vagas: approvedMockVagas,
        cursos: approvedMockCursos,
        applications: [{ id: 'demo-app-1', vaga_id: 1, status: 'applied' }],
        acquiredCourses: [
          { id: 'demo-ac-1', curso_id: 1, progress: 60 },
          { id: 'demo-ac-6', curso_id: 6, progress: 100 },
        ],
        descricao: String(buildDemoProfile(role).descricao_profissional || ''),
      });
    } else {
      clearDemoSession();
    }
  }, [location.search, applyDemoSession, clearDemoSession]);

  return null;
}
