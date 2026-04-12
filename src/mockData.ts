import { Empresa, Curso, Vaga, VagaCursoQualificacao } from './types';

export const empresas: Empresa[] = [
  { id: 1, nome: 'Serviços Gerais Brilhante', nome_fantasia: 'Brilhante', cnpj: '11.222.333/0001-44' },
  { id: 2, nome: 'Supermercado Preço Bom', nome_fantasia: 'Preço Bom', cnpj: '55.666.777/0001-88' },
  { id: 3, nome: 'Restaurante Comida Caseira', nome_fantasia: 'Sabor de Casa', cnpj: '99.000.111/0001-22' },
];

export const cursos: Curso[] = [
  { 
    id: 1, 
    nome: 'Técnicas de Limpeza Profissional', 
    quem_criou: 'Brilhante', 
    data_de_criacao: '2023-10-01T10:00:00Z', 
    tags: 'limpeza,higiene,serviços gerais',
    conteudo: '# Técnicas de Limpeza Profissional\n\nAprenda o essencial para atuar na área:\n- Uso correto de produtos químicos\n- Equipamentos de proteção (EPIs)\n- Organização de cronogramas de limpeza\n- Higienização de ambientes hospitalares e comerciais.',
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br'
  },
  { 
    id: 2, 
    nome: 'Boas Práticas na Cozinha', 
    quem_criou: 'Sabor de Casa', 
    data_de_criacao: '2023-11-15T14:30:00Z', 
    tags: 'cozinha,alimentos,higiene',
    conteudo: '# Boas Práticas na Cozinha\n\nFundamentos para ajudantes e auxiliares:\n- Manipulação segura de alimentos\n- Prevenção de contaminação cruzada\n- Organização da despensa e estoque\n- Limpeza e conservação de utensílios.',
    url: 'https://www.gov.br/anvisa/pt-br'
  },
  { 
    id: 3, 
    nome: 'Atendimento ao Cliente e Caixa', 
    quem_criou: 'Preço Bom', 
    data_de_criacao: '2023-12-05T09:00:00Z', 
    tags: 'atendimento,caixa,vendas',
    conteudo: '# Atendimento ao Cliente e Caixa\n\nPrepare-se para o comércio:\n- Técnicas de atendimento cordial\n- Operação de sistemas de caixa\n- Fechamento de caixa e sangria\n- Lidar com diferentes formas de pagamento.',
    url: 'https://www.sebrae.com.br'
  },
  { 
    id: 4, 
    nome: 'Reposição e Logística Básica', 
    quem_criou: 'Preço Bom', 
    data_de_criacao: '2024-01-20T11:00:00Z', 
    tags: 'estoque,reposição,mercado',
    conteudo: '# Reposição e Logística Básica\n\nOrganize o ponto de venda:\n- Layout de gôndolas e prateleiras\n- Controle de validade (PVPS)\n- Recebimento de mercadorias\n- Precificação e etiquetas.',
    url: 'https://www.sebrae.com.br'
  },
  { 
    id: 5, 
    nome: 'Como Falar em Público', 
    quem_criou: 'Google', 
    data_de_criacao: '2024-02-10T16:00:00Z', 
    tags: 'comunicação,entrevista,softskill',
    conteudo: '# Comunicação para Entrevistas\n\nDestaque-se no processo seletivo:\n- Como se apresentar\n- Linguagem corporal\n- Respondendo perguntas comuns\n- Dicas para o primeiro emprego.',
    url: 'https://skillshop.exceedlms.com/student/collection/757289-public-speaking?locale=pt-PT'
  },
  { 
    id: 6, 
    nome: 'Segurança no Trabalho (NR-06)', 
    quem_criou: 'Brilhante', 
    data_de_criacao: '2024-03-01T08:00:00Z', 
    tags: 'segurança,epi,trabalho',
    conteudo: '# Segurança no Trabalho\n\nSua saúde em primeiro lugar:\n- Importância do uso de EPIs\n- Prevenção de acidentes comuns\n- Postura e ergonomia no trabalho braçal\n- Primeiros socorros básicos.',
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br'
  },
];

export const vagas: Vaga[] = [
  { 
    id: 1, 
    empresa_id: 1, 
    titulo: 'Auxiliar de Limpeza', 
    descricao: 'Responsável pela manutenção e limpeza de escritórios e áreas comuns. Não exige experiência anterior, oferecemos treinamento no local.',
    empresa: empresas[0]
  },
  { 
    id: 2, 
    empresa_id: 3, 
    titulo: 'Ajudante de Cozinha', 
    descricao: 'Auxiliar no preparo de ingredientes, limpeza da cozinha e organização de utensílios. Desejável vontade de aprender e pontualidade.',
    empresa: empresas[2]
  },
  { 
    id: 3, 
    empresa_id: 2, 
    titulo: 'Repositor de Mercadorias', 
    descricao: 'Reposição de produtos nas gôndolas, verificação de validade e organização do estoque. Vaga ideal para primeiro emprego.',
    empresa: empresas[1]
  },
  { 
    id: 4, 
    empresa_id: 2, 
    titulo: 'Operador de Caixa', 
    descricao: 'Atendimento ao cliente, registro de mercadorias e recebimento de pagamentos. Necessário ensino fundamental completo.',
    empresa: empresas[1]
  },
  { 
    id: 5, 
    empresa_id: 1, 
    titulo: 'Auxiliar de Serviços Gerais', 
    descricao: 'Atividades diversas de manutenção, limpeza e apoio operacional. Buscamos pessoas proativas e com disposição física.',
    empresa: empresas[0]
  },
];

// Relacionamentos manuais para o mock
export const vagaCursoQualificacao: VagaCursoQualificacao[] = [
  { vaga_id: 1, curso_id: 1, bonus_aprovacao: 40 }, // Limpeza -> Técnicas de Limpeza
  { vaga_id: 1, curso_id: 6, bonus_aprovacao: 20 }, // Limpeza -> Segurança
  { vaga_id: 2, curso_id: 2, bonus_aprovacao: 45 }, // Cozinha -> Boas Práticas
  { vaga_id: 3, curso_id: 4, bonus_aprovacao: 35 }, // Repositor -> Logística Básica
  { vaga_id: 4, curso_id: 3, bonus_aprovacao: 50 }, // Caixa -> Atendimento e Caixa
  { vaga_id: 5, curso_id: 6, bonus_aprovacao: 30 }, // Serviços Gerais -> Segurança
];
