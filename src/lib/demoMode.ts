/**
 * Modo demo local: só ativa com Firebase placeholder + ?demo=1 (ou localStorage).
 * Não substitui Firestore em produção — serve para QA visual sem credenciais.
 */

export type DemoRole = 'candidato' | 'admin' | 'empresa';

const PLACEHOLDER_PROJECT = 'local-dev-placeholder';

export function isFirebasePlaceholder(): boolean {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return !projectId || projectId === PLACEHOLDER_PROJECT;
}

export function readDemoRoleFromLocation(search = window.location.search): DemoRole | null {
  const params = new URLSearchParams(search);
  const raw = params.get('demo');
  if (!raw) return null;
  if (raw === '1' || raw === 'true' || raw === 'candidato') return 'candidato';
  if (raw === 'admin') return 'admin';
  if (raw === 'empresa') return 'empresa';
  return 'candidato';
}

export function isDemoModeActive(): boolean {
  return isFirebasePlaceholder() && readDemoRoleFromLocation() !== null;
}

export function persistDemoRole(role: DemoRole) {
  try {
    localStorage.setItem('temvaga_demo_role', role);
  } catch {
    /* ignore */
  }
}

export function clearDemoMode() {
  try {
    localStorage.removeItem('temvaga_demo_role');
  } catch {
    /* ignore */
  }
}
