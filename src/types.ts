export interface Empresa {
  id: number;
  nome: string;
  nome_fantasia?: string;
  cnpj: string;
}

export interface Curso {
  id: number;
  nome: string;
  quem_criou: string;
  data_de_criacao: string;
  tags: string; // Comma separated tags
  conteudo?: string; // Markdown or plain text content
  url?: string; // External course link
}

export interface Vaga {
  id: number;
  empresa_id: number;
  titulo: string;
  descricao: string;
  empresa?: Empresa;
}

export interface VagaCursoQualificacao {
  vaga_id: number;
  curso_id: number;
  bonus_aprovacao: number; // Percentage bonus for this course on this job
}
