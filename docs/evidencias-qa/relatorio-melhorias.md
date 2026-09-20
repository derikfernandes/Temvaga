# Relatório de melhorias — TemVaga

Comparação **baseline (`main`)** × **versão aprovada pós-QA** (branch `cursor/melhorias-matching-dashboard-ed72`).  
Prints “depois” só foram gravados após o checklist crítico passar (Playwright E2E + unitários).

- **PR:** https://github.com/derikfernandes/Temvaga/pull/13  
- **Plano:** [docs/plano-melhorias.md](./plano-melhorias.md)  
- **QA interno:** `internal/qa-playwright-results.json`, `internal/qa-checklist.md`

---

## Resumo executivo

Nesta rodada entregamos matching currículo × vaga × cursos **explicável** (heurística local 0–100, sem dependência de Vertex no caminho crítico), painéis de acompanhamento (candidato / empresa / admin), cruzamento e monitoramento de cursos vs vagas, e UX do chat mais clara — mantendo a linguagem visual gov.br/TemVaga.

QA: **9/9 unitários** + E2E Playwright com **fluxos críticos aprovados**. Auth Firebase real ficou **bloqueado** neste ambiente (sem `VITE_FIREBASE_*`); fluxos autenticados foram validados com **modo demo local** (`?demo=1|admin|empresa`), que só liga com Firebase placeholder.

---

## Matching

### O que mudou
- De matching lexical simples (`calculateMatchScore` contando palavras) para `explainJobMatch`: tokens + stopwords PT, sinônimos de domínio, peso de título/descrição, cobertura de cursos recomendados e progresso, affinity por tags.
- UI mostra **%**, nível, motivos (“Por que este match?”) e gaps de curso.
- `resolveRecommendedCourses` usa `vaga.cursos_recomendados` (Firestore) com fallback do mock.

### Heurística (resumo)
1. Normaliza texto (minúsculas, acentos, stopwords).  
2. Sobreposição com título (até ~35 pts) e descrição/skills (até ~25).  
3. Cobertura dos cursos recomendados + progresso (até ~30).  
4. Tags dos cursos adquiridos (até ~10).  
5. Normaliza 0–100 e gera `reasons[]` + `gaps[]`.  
Documentação viva: `src/utils/jobMatch.ts` e plano.

### Evidência visual
| Antes (main) | Depois (aprovado) |
|--------------|-------------------|
| Sem painel de match na home autenticada (redirect login) | Match % + motivos + cursos com status |
| ![baseline home redirect](../media/baseline/baseline_home_redirect.png) | ![after match](../media/after/after_match_detalhe.png) |
| | Dashboard candidato com gaps: ![after dashboard](../media/after/after_candidato_dashboard.png) |

### QA
- Unitários matching/gaps: **PASS** (9).  
- Detalhe “Por que este match?”: **PASS** (reteste).  
- Ordenação/badge na lista: **PASS**.

---

## Dashboards

### O que mudou
- **Candidato:** `CandidateDashboard` — perfil %, cursos, candidaturas, gaps vs melhor vaga.  
- **Admin:** card de cobertura curso×vaga + tabela de monitoramento; cores gov (sem purple).  
- **Empresa:** cobertura de vagas com cursos, qualificação por vaga, atalhos.

### Evidência visual
| Área | Antes | Depois |
|------|-------|--------|
| Admin | Redirect login ![baseline admin](../media/baseline/baseline_admin.png) | Cobertura + overview ![after admin](../media/after/after_admin_cobertura.png) |
| Empresa | Redirect login-empresa ![baseline empresa](../media/baseline/baseline_empresa.png) | Dashboard com qualificação ![after empresa](../media/after/after_empresa_dashboard.png) |
| Candidato | Redirect login ![baseline home](../media/baseline/baseline_home_redirect.png) | Acompanhamento ![after candidato](../media/after/after_candidato_dashboard.png) |

### QA
- Admin cobertura: **PASS**  
- Empresa dashboard: **PASS**  
- Candidato acompanhamento: **PASS**

---

## Cursos (monitoramento / cruzamento)

### O que mudou
- Utilitário `courseJobGap.ts` (cobertura por vaga, gaps do candidato, vagas ajudadas por curso).  
- **Meus cursos:** progresso médio + “Ajuda em N vaga(s)”.  
- Admin/empresa listam vínculos curso×vaga.

### Evidência visual
| Antes | Depois |
|-------|--------|
| Sem vínculo vaga↔curso na UI de “meus cursos” (e home autenticada inacessível no baseline local) | ![after meus cursos](../media/after/after_meus_cursos.png) |

### QA
- Meus cursos com “Ajuda em…”: **PASS**  
- Catálogo de cursos: **PASS**

---

## Chat / UX

### O que mudou
- Copy mais clara; progresso de cadastro (passo X/N + barra); atalhos pós-login.  
- FAB sempre visível; abertura via CTA / FAB / `?chat=1`; z-index alto.  
- Portal empresa: indigo → tokens gov.br.

### Evidência visual
| Antes | Depois |
|-------|--------|
| Landing ![baseline landing](../media/baseline/baseline_landing.png) | Landing + FAB ![after landing](../media/after/after_landing.png) |
| Chat no baseline não abriu de forma confiável ![baseline chat](../media/baseline/baseline_chat_landing.png) | Chat aberto + CPF inválido ![after chat](../media/after/after_chat_open.png) |
| | Atalhos logado ![after atalhos](../media/after/after_chat_atalhos.png) |
| Login empresa roxo ![baseline company](../media/baseline/baseline_company_login.png) | Login empresa gov blue ![after company](../media/after/after_company_login.png) |

### QA
- Chat abre (`?chat=1` / FAB): **PASS** (corrigido após 1ª falha de QA).  
- CPF inválido: **PASS**  
- Atalhos: **PASS**  
- Company login sem indigo: **PASS**

---

## UI / responsivo / outros

### O que mudou
- Hierarquia gov.br preservada; remoção de purple/indigo em admin e empresa.  
- Modo demo local para QA sem Firebase (não substitui Firestore em produção).  
- `npm test` (Vitest) no matching.

### Evidência visual
- Mobile home (~390px): ![after mobile](../media/after/after_mobile_home.png)

### QA
- Responsivo básico home: **PASS**  
- `npm run lint`: **PASS**  
- Auth Firebase real: **BLOQUEADO** (sem credenciais no ambiente)

---

## Resultado consolidado do QA

| Fluxo | Resultado |
|-------|----------|
| Landing / login / company login | PASS |
| Chat abrir + CPF inválido + atalhos | PASS (após correção FAB/`?chat=1`) |
| Dashboard candidato + match detalhe | PASS |
| Meus cursos / catálogo | PASS |
| Admin cobertura curso×vaga | PASS |
| Empresa dashboard | PASS |
| Candidatura (demo) | PASS |
| Mobile | PASS |
| Unitários matching | PASS (9) |
| Lint | PASS |
| Auth Firebase produção | BLOQUEADO |

**Correções feitas durante QA:** chat não abria de forma confiável → FAB permanente + `?chat=1` + z-index; demo não mudava de papel na SPA → `DemoModeSync` reativo à query; login empresa roxo → tokens gov.

**Aprovação pós-QA:** SIM — prints em `media/after/` são da build aprovada.

---

## Paths das mídias

### Baseline (`main`)
- `/home/ubuntu/.cursor/projects/workspace/agent-store/media/baseline/baseline_landing.png`
- `.../baseline_login.png`
- `.../baseline_company_login.png`
- `.../baseline_chat_landing.png`
- `.../baseline_home_redirect.png`
- `.../baseline_admin.png`
- `.../baseline_empresa.png`

### Depois (aprovado)
- `/home/ubuntu/.cursor/projects/workspace/agent-store/media/after/after_landing.png`
- `.../after_chat_open.png`
- `.../after_company_login.png`
- `.../after_candidato_dashboard.png`
- `.../after_match_detalhe.png`
- `.../after_meus_cursos.png`
- `.../after_chat_atalhos.png`
- `.../after_admin_cobertura.png`
- `.../after_empresa_dashboard.png`
- `.../after_mobile_home.png`

---

## Próximos passos (fora desta rodada)

1. Credenciais Firebase reais para QA de auth candidato/empresa/admin em produção.  
2. Persistência/atualização de progresso de curso (>0 além do seed).  
3. Re-rank opcional via Vertex com fallback local (não no caminho crítico).  
4. Alertas de novas vagas alinhadas / gaps.  
5. Não migrar para Data Connect neste momento.


---

## Nota de publicação (Context / FUSE)

Neste worker os artefatos estão em:

- Project store FUSE: `/cursor/stores/bc-2d930076-d9a6-423d-9537-3256da853fef/`
- Symlink: `/home/ubuntu/.cursor/projects/workspace/agent-store` → store acima

Se o Context do coordenador não refletir o FUSE (split-brain observado), cópia espelho também foi publicada no repositório (mesmo PR #13), pasta:

- `docs/evidencias-qa/plano-melhorias.md`
- `docs/evidencias-qa/relatorio-melhorias.md`
- `docs/evidencias-qa/baseline/*.png`
- `docs/evidencias-qa/after/*.png`
