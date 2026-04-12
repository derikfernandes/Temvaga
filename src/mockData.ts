import { Empresa, Curso, Vaga, VagaCursoQualificacao } from './types';

export const empresas: Empresa[] = [
  { id: 1, nome: 'Tech Solutions S.A.', nome_fantasia: 'TechSol', cnpj: '12.345.678/0001-90' },
  { id: 2, nome: 'Inovação Digital Ltda', nome_fantasia: 'InovaDigi', cnpj: '98.765.432/0001-10' },
  { id: 3, nome: 'Educação Global', nome_fantasia: 'EduGlobal', cnpj: '45.678.901/0001-22' },
];

export const cursos: Curso[] = [
  { 
    id: 1, 
    nome: 'React Avançado', 
    quem_criou: 'EduGlobal', 
    data_de_criacao: '2023-10-01T10:00:00Z', 
    tags: 'react,frontend,javascript,typescript',
    conteudo: '# React Avançado\n\nNeste curso você aprenderá:\n- Hooks customizados\n- Context API e Gerenciamento de Estado\n- Performance com useMemo e useCallback\n- Testes unitários com Jest e React Testing Library.',
    url: 'https://react.dev'
  },
  { 
    id: 2, 
    nome: 'Node.js com Express', 
    quem_criou: 'TechSol', 
    data_de_criacao: '2023-11-15T14:30:00Z', 
    tags: 'node,backend,javascript,api',
    conteudo: '# Node.js com Express\n\nDomine o backend com:\n- Arquitetura MVC\n- Autenticação JWT\n- Integração com MongoDB e PostgreSQL\n- Deploy em nuvem.',
    url: 'https://expressjs.com'
  },
  { 
    id: 3, 
    nome: 'Design de Interface (UI)', 
    quem_criou: 'InovaDigi', 
    data_de_criacao: '2023-12-05T09:00:00Z', 
    tags: 'design,ui,ux,figma',
    conteudo: '# Design de Interface (UI)\n\nCrie interfaces incríveis:\n- Teoria das cores\n- Tipografia para web\n- Prototipagem no Figma\n- Design System e Componentização.',
    url: 'https://www.figma.com/resource-library/design-basics/'
  },
  { 
    id: 4, 
    nome: 'Python para Ciência de Dados', 
    quem_criou: 'EduGlobal', 
    data_de_criacao: '2024-01-20T11:00:00Z', 
    tags: 'python,data science,ai,ml',
    conteudo: '# Python para Ciência de Dados\n\nExplore o mundo dos dados:\n- Pandas e NumPy\n- Visualização com Matplotlib e Seaborn\n- Introdução ao Machine Learning\n- Limpeza e tratamento de dados.',
    url: 'https://www.python.org'
  },
  { 
    id: 5, 
    nome: 'Como Falar em Público', 
    quem_criou: 'Google', 
    data_de_criacao: '2024-02-10T16:00:00Z', 
    tags: 'apresentação, comunicação, softskill',
    conteudo: '# Comunicação\n\nFalar em Público\n- Primeiro Emprego\n',
    url: 'https://skillshop.exceedlms.com/student/collection/757289-public-speaking?locale=pt-PT'
  },
  { 
    id: 6, 
    nome: 'Segurança da Informação', 
    quem_criou: 'InovaDigi', 
    data_de_criacao: '2024-03-01T08:00:00Z', 
    tags: 'security,cybersecurity,network',
    conteudo: '# Segurança da Informação\n\nProteja seus sistemas:\n- Fundamentos de criptografia\n- Segurança em redes\n- Prevenção de ataques comuns (SQLi, XSS)\n- Normas e conformidade (LGPD).',
    url: 'https://www.owasp.org'
  },
];

export const vagas: Vaga[] = [
  { 
    id: 1, 
    empresa_id: 1, 
    titulo: 'Desenvolvedor Frontend Sênior', 
    descricao: 'Buscamos especialista em React e TypeScript para atuar em projetos internacionais. Conhecimento em Tailwind CSS é um diferencial.',
    empresa: empresas[0]
  },
  { 
    id: 2, 
    empresa_id: 2, 
    titulo: 'Designer UX/UI Pleno', 
    descricao: 'Oportunidade para atuar no redesenho de nossa plataforma principal. Necessário domínio de Figma e conceitos de usabilidade.',
    empresa: empresas[1]
  },
  { 
    id: 3, 
    empresa_id: 1, 
    titulo: 'Engenheiro de Dados', 
    descricao: 'Trabalhe com grandes volumes de dados utilizando Python e ferramentas de Big Data. Foco em automação e pipelines.',
    empresa: empresas[0]
  },
  { 
    id: 4, 
    empresa_id: 3, 
    titulo: 'Gerente de Produto (PM)', 
    descricao: 'Liderança de times multidisciplinares seguindo metodologias ágeis. Foco em entrega de valor e métricas de sucesso.',
    empresa: empresas[2]
  },
];

// Relacionamentos manuais para o mock
export const vagaCursoQualificacao: VagaCursoQualificacao[] = [
  { vaga_id: 1, curso_id: 1, bonus_aprovacao: 35 }, // Frontend -> React Avançado
  { vaga_id: 2, curso_id: 3, bonus_aprovacao: 28 }, // Designer -> UI Design
  { vaga_id: 3, curso_id: 4, bonus_aprovacao: 42 }, // Engenheiro de Dados -> Python Data Science
  { vaga_id: 4, curso_id: 5, bonus_aprovacao: 20 }, // PM -> Gestão Ágil
];
