# Plano de melhorias — TemVaga (Dashboard / acompanhamento)

Atualizado pós-QA desta rodada. Firestore permanece fonte de verdade; matching local explicável.

## Diagnóstico rápido

| Área | Estado atual | Dor |
|------|--------------|-----|
| Matching | Lexical simples | Pouco sensível; sem cursos; não explica |
| Cursos × vagas | Mock + `cursos_recomendados` | Gaps pouco visíveis |
| Dashboard candidato | Só lista | Sem progresso unificado |
| Chat / UI | Fluxo CPF ok | Pouca hierarquia de passo |
| QA | Sem testes de matching | Regressão silenciosa |

## Fases

### Fase 1 — Matching + acompanhamento + cursos×vagas ✅ (esta rodada)

**Entregue**
- Heurística explicável + testes Vitest
- Painel candidato + match %/motivos/gaps
- Admin/empresa: cobertura curso×vaga
- Meus cursos ↔ vagas

**Critérios**
- [x] Score e motivos na lista/detalhe
- [x] Gaps acionáveis
- [x] Unitários passam
- [x] QA E2E fluxos críticos + evidências `media/`

### Fase 2 — UX chat/UI + dashboards ✅ (máximo viável)

**Entregue**
- Chat: progresso cadastro, FAB, `?chat=1`, atalhos
- Cores gov no portal empresa/admin
- Demo local para QA sem Firebase

**Critérios**
- [x] Progresso no cadastro via chat
- [x] Atalhos pós-login
- [x] Meus cursos “ajuda em N vagas”
- [x] QA inclui chat + responsivo

### Fase 3 — Depois
- Progresso de curso persistente; Vertex só como re-rank opcional; alertas; sem inventar Data Connect.

## Status da rodada

| Item | Status |
|------|--------|
| Plano | Feito |
| Matching / dashboards / cursos / chat | Feito |
| QA E2E + media | Aprovado |
| Relatório comparação | `docs/relatorio-melhorias.md` |
| PR draft | https://github.com/derikfernandes/Temvaga/pull/13 |
