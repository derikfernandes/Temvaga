import { useState, useEffect } from 'react';
import { User, FileText, Briefcase, Target, MapPin, Phone, FileBadge, GraduationCap, Building, Clock, Info, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useAppState } from '../providers/AppStateProvider';
import { AudioRecorder } from '../components/AudioRecorder';
import { extractProfileData } from '../services/geminiService';

const Section = ({ title, icon: Icon, children, className = "" }: any) => (
  <div className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 ${className}`}>
    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
      <Icon className="w-5 h-5 text-gov-blue" />
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

const Input = ({ label, className = "", ...props }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-semibold text-slate-600">{label}</label>
    <input className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue transition-all" {...props} />
  </div>
);

const Select = ({ label, options, className = "", ...props }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-semibold text-slate-600">{label}</label>
    <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue transition-all" {...props}>
      <option value="">Selecione...</option>
      {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, className = "", ...props }: any) => (
  <label className={`flex items-center gap-2 cursor-pointer text-sm text-slate-700 ${className} mt-6`}>
    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-gov-blue focus:ring-gov-blue" {...props} />
    {label}
  </label>
);

const Textarea = ({ label, className = "", ...props }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-semibold text-slate-600">{label}</label>
    <textarea className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue transition-all min-h-[80px]" {...props} />
  </div>
);

export function ProfilePage() {
  const {
    user,
    userProfile,
    descricaoProfissional,
    setDescricaoProfissional,
    handleUpdateProfile,
  } = useAppState();

  const [activeTab, setActiveTab] = useState('identidade');
  const [formData, setFormData] = useState<any>({});
  const [isExtracting, setIsExtracting] = useState(false);

  // Progress logic
  const fieldsForProgress = [
    // Identidade
    'nome', 'pis', 'sexo', 'racaCor', 'nascimento', 'estadoCivil', 'nacionalidade', 'deficiencia',
    // Endereço
    'cep', 'logradouro', 'numero', 'municipio', 'uf', 'bairro',
    // Contato
    'emailPessoal', 'ddd', 'numeroTelefone',
    // Documentos
    'cpf', 'rgNumero', 'ctpsNumero', 'cnh',
    // Socioeconômico
    'situacaoCandidato', 'membrosFamilia', 'rendaFamiliar',
    // Capacidade / Formação
    'escolaridade', 'cursosTecnicos', 'cursosSuperiores', 'idiomas',
    // Experiência
    'expCompEmpresa', 'expCompOcupacao', 'expSemOcupacao',
    // Pretensão
    'ocupacaoDesejada', 'horarioDesejado', 'dispVeiculo', 'dispViagens'
  ];

  const filledFieldsCount = fieldsForProgress.filter(field => {
    const val = formData[field];
    return val !== undefined && val !== null && val !== '';
  }).length;
  const progressPercentage = Math.round((filledFieldsCount / fieldsForProgress.length) * 100) || 0;

  // Sincroniza o perfil salvo com o estado do formulário na inicialização
  useEffect(() => {
    if (userProfile && Object.keys(formData).length === 0) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  const handleExtractAI = async () => {
    if (!descricaoProfissional) return;
    setIsExtracting(true);
    try {
      const data = await extractProfileData(descricaoProfissional);
      setFormData((prev: any) => ({ ...prev, ...data }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const tabs = [
    { id: 'identidade', label: '1. Identidade e Pessoal', icon: User },
    { id: 'capacidade', label: '2. Capacidade (Formação/Exp.)', icon: Briefcase },
    { id: 'pretensao', label: '3. Pretensão e Disponibilidade', icon: Target },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gov-blue/10 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8 text-gov-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gov-blue-dark">
              {userProfile?.nome_completo as string || "Meu Perfil"}
            </h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleUpdateProfile()}
          className="px-6 py-3 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue-dark transition-all shadow-lg shadow-gov-blue/20 flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Salvar Alterações
        </button>
      </div>

      {/* Descrição Profissional Integrada ao IA */}
      <div className="bg-gradient-to-r from-gov-blue/5 to-gov-blue/10 border border-gov-blue/20 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-gov-blue" />
          <h3 className="text-lg font-bold text-gov-blue-dark">Resumo e Descrição Profissional (Para Match de IA)</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Use áudio ou texto para descrever em detalhes o que você busca. O sistema Crias AI utilizará isso para fazer o "matching inteligente" com as vagas.
        </p>
        <textarea
          rows={4}
          className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all text-slate-600 text-sm mb-2"
          placeholder="Conte sobre sua experiência, habilidades e o que você busca... (Ex: Designer UI/UX buscando vagas remotas)"
          value={descricaoProfissional}
          onChange={(e) => setDescricaoProfissional(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <AudioRecorder onTranscription={(text) => setDescricaoProfissional(text)} />
          <button
            type="button"
            onClick={() => void handleExtractAI()}
            disabled={isExtracting || !descricaoProfissional}
            className="flex items-center gap-2 px-4 py-2 bg-gov-blue/10 text-gov-blue rounded-xl font-bold hover:bg-gov-blue/20 transition-all text-sm disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extraindo dados...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Preencher Perfil com IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-700">Preenchimento do Perfil</span>
          <span className="text-sm font-bold text-gov-blue">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gov-blue h-3 rounded-full transition-all duration-1000 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap border
                ${isActive
                  ? 'bg-gov-blue text-white border-gov-blue shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Forms Content */}
      <div className="space-y-6">

        {/* TAB 1: IDENTIDADE E DADOS PESSOAIS */}
        {activeTab === 'identidade' && (
          <div className="transition-opacity duration-300">
            <Section title="1. Identificação do Trabalhador" icon={FileText}>
              <Input label="Nome do Trabalhador" name="nome" value={formData.nome || ''} onChange={handleChange} className="lg:col-span-2" />
              <Input label="PIS/PASEP/NIT" name="pis" value={formData.pis || ''} onChange={handleChange} />
              <Input label="Nome da Mãe" name="nomeMae" value={formData.nomeMae || ''} onChange={handleChange} />
              <Input label="Nome do Pai" name="nomePai" value={formData.nomePai || ''} onChange={handleChange} />
              <Input label="Nome Social" name="nomeSocial" value={formData.nomeSocial || ''} onChange={handleChange} />
              <Select label="Sexo" name="sexo" options={['Feminino', 'Masculino', 'Outro']} value={formData.sexo || ''} onChange={handleChange} />
              <Select label="Raça/Cor" name="racaCor" options={['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não Informado']} value={formData.racaCor || ''} onChange={handleChange} />
              <Input label="Data de Nascimento" type="date" name="nascimento" value={formData.nascimento || ''} onChange={handleChange} />
              <Select label="Estado Civil" name="estadoCivil" options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Separado(a)']} value={formData.estadoCivil || ''} onChange={handleChange} />
              <Input label="Nacionalidade" name="nacionalidade" value={formData.nacionalidade || ''} onChange={handleChange} />
              <Input label="Naturalidade (Município)" name="naturalidadeMunicipio" value={formData.naturalidadeMunicipio || ''} onChange={handleChange} />
              <Input label="Naturalidade (UF)" name="naturalidadeUf" maxLength={2} value={formData.naturalidadeUf || ''} onChange={handleChange} />
              <Select label="Possui Deficiência?" name="deficiencia" options={['Sim', 'Não']} value={formData.deficiencia || ''} onChange={handleChange} />
            </Section>

            <Section title="2. Endereço" icon={MapPin}>
              <Input label="CEP" name="cep" value={formData.cep || ''} onChange={handleChange} />
              <Select label="Tipo de Logradouro" name="tipoLogradouro" options={['Rua', 'Avenida', 'Rodovia', 'Travessa', 'Viela', 'Outro']} value={formData.tipoLogradouro || ''} onChange={handleChange} />
              <Input label="Logradouro" name="logradouro" value={formData.logradouro || ''} onChange={handleChange} />
              <Input label="Número" name="numero" value={formData.numero || ''} onChange={handleChange} />
              <Input label="Complemento / Zona Geográfica" name="complemento" value={formData.complemento || ''} onChange={handleChange} />
              <Input label="Bairro / Distrito" name="bairro" value={formData.bairro || ''} onChange={handleChange} />
              <Input label="Município" name="municipio" value={formData.municipio || ''} onChange={handleChange} />
              <Input label="UF" name="uf" maxLength={2} value={formData.uf || ''} onChange={handleChange} />
              <Input label="Referência de Acesso" name="referencia" value={formData.referencia || ''} onChange={handleChange} className="lg:col-span-2" />
              <Select label="Zona de Moradia" name="zonaMoradia" options={['Urbana', 'Rural']} value={formData.zonaMoradia || ''} onChange={handleChange} />
            </Section>

            <Section title="3. Contato" icon={Phone}>
              <Input label="E-mail Pessoal" type="email" name="emailPessoal" value={formData.emailPessoal || ''} onChange={handleChange} />
              <Input label="E-mail Profissional" type="email" name="emailProfissional" value={formData.emailProfissional || ''} onChange={handleChange} />
              <Checkbox label="Aceita receber informações?" name="aceitaEmailInfo" checked={formData.aceitaEmailInfo || false} onChange={handleChange} />

              <Select label="Tipo de Telefone" name="tipoTelefone" options={['Celular', 'Fixo', 'Recado']} value={formData.tipoTelefone || ''} onChange={handleChange} />
              <div className="flex gap-2">
                <Input label="DDD" name="ddd" maxLength={2} className="w-20" value={formData.ddd || ''} onChange={handleChange} />
                <Input label="Número do Telefone" name="numeroTelefone" className="flex-1" value={formData.numeroTelefone || ''} onChange={handleChange} />
              </div>
              <Input label="Ramal" name="ramal" value={formData.ramal || ''} onChange={handleChange} />
              <Input label="Nome do Contato" name="nomeContatoTelefone" value={formData.nomeContatoTelefone || ''} onChange={handleChange} />
              <Checkbox label="Aceita receber SMS?" name="aceitaSms" checked={formData.aceitaSms || false} onChange={handleChange} />
            </Section>

            <Section title="4. Documentação" icon={FileBadge}>
              <Input label="CPF (Obrigatório)" name="cpf" required value={formData.cpf || ''} onChange={handleChange} />
              <Input label="RG - Número" name="rgNumero" value={formData.rgNumero || ''} onChange={handleChange} />
              <div className="flex gap-2">
                <Input label="RG - Órgão Emissor" name="rgOrgao" className="flex-1" value={formData.rgOrgao || ''} onChange={handleChange} />
                <Input label="RG - UF" name="rgUf" maxLength={2} className="w-20" value={formData.rgUf || ''} onChange={handleChange} />
              </div>
              <Input label="CTPS - Número" name="ctpsNumero" value={formData.ctpsNumero || ''} onChange={handleChange} />
              <Input label="CTPS - Série" name="ctpsSerie" value={formData.ctpsSerie || ''} onChange={handleChange} />
              <div className="flex gap-2">
                <Input label="CTPS - UF" name="ctpsUf" maxLength={2} className="w-20" value={formData.ctpsUf || ''} onChange={handleChange} />
                <Input label="Data de Emissão (CTPS)" type="date" name="ctpsData" className="flex-1" value={formData.ctpsData || ''} onChange={handleChange} />
              </div>
            </Section>

            <Section title="6. Dados Gerais (Socioeconômicos)" icon={Info}>
              <Input label="Papel na Família" name="papelFamilia" value={formData.papelFamilia || ''} onChange={handleChange} />
              <Input label="Nº Membros na Família" type="number" name="membrosFamilia" value={formData.membrosFamilia || ''} onChange={handleChange} />
              <Input label="Nº Membros que Trabalham" type="number" name="membrosTrabalham" value={formData.membrosTrabalham || ''} onChange={handleChange} />
              <Input label="Renda Própria (R$)" type="number" name="rendaPropria" value={formData.rendaPropria || ''} onChange={handleChange} />
              <Input label="Renda Familiar (R$)" type="number" name="rendaFamiliar" value={formData.rendaFamiliar || ''} onChange={handleChange} />
              <div className="flex gap-2">
                <Input label="Qtd. Salários (Própria)" type="number" name="qtdSalariosPropria" className="flex-1" value={formData.qtdSalariosPropria || ''} onChange={handleChange} />
                <Input label="Qtd. Salários (Familiar)" type="number" name="qtdSalariosFamiliar" className="flex-1" value={formData.qtdSalariosFamiliar || ''} onChange={handleChange} />
              </div>
              <Select label="CNH (Categoria)" name="cnh" options={['Nenhuma', 'A', 'B', 'AB', 'C', 'D', 'E']} value={formData.cnh || ''} onChange={handleChange} />
              <Input label="Data da Primeira CNH" type="date" name="cnhData" value={formData.cnhData || ''} onChange={handleChange} />
              <Select label="Situação / Condição Atual" name="situacaoCandidato" options={['Empregado', 'Desempregado', 'Autônomo', 'Estudante']} value={formData.situacaoCandidato || ''} onChange={handleChange} />
              <Input label="Programa de Crédito que participa" name="programaCredito" value={formData.programaCredito || ''} onChange={handleChange} />
              <Select label="Sob risco de desemprego?" name="riscoDesemprego" options={['Sim', 'Não']} value={formData.riscoDesemprego || ''} onChange={handleChange} />
              <Select label="Beneficiário de Economia Solidária?" name="economiaSolidaria" options={['Sim', 'Não']} value={formData.economiaSolidaria || ''} onChange={handleChange} />
              <Select label="Beneficiário do Bolsa Família?" name="bolsaFamilia" options={['Sim', 'Não']} value={formData.bolsaFamilia || ''} onChange={handleChange} />
              <Select label="Gestor de Políticas Públicas?" name="gestorPoliticas" options={['Sim', 'Não']} value={formData.gestorPoliticas || ''} onChange={handleChange} />
            </Section>
          </div>
        )}

        {/* TAB 2: CAPACIDADE (FORMAÇÃO E EXPERIÊNCIA) */}
        {activeTab === 'capacidade' && (
          <div className="transition-opacity duration-300">
            <Section title="5. Formação Acadêmica e Complementar" icon={GraduationCap}>
              <Select label="Escolaridade" name="escolaridade" options={['Ensino Fundamental', 'Ensino Médio', 'Ensino Superior', 'Pós-graduação', 'Mestrado', 'Doutorado']} value={formData.escolaridade || ''} onChange={handleChange} />
              <Select label="É estudante?" name="isEstudante" options={['Sim', 'Não']} value={formData.isEstudante || ''} onChange={handleChange} />
              <Textarea label="Cursos Técnicos/Profissionalizantes" name="cursosTecnicos" placeholder="Nome do curso, instituição, ano..." className="lg:col-span-3" value={formData.cursosTecnicos || ''} onChange={handleChange} />
              <Textarea label="Cursos Superiores" name="cursosSuperiores" placeholder="Nome do curso, instituição, ano..." className="lg:col-span-3" value={formData.cursosSuperiores || ''} onChange={handleChange} />
              <Textarea label="Idiomas (Idioma e Fluência)" name="idiomas" placeholder="Ex: Inglês - Avançado, Espanhol - Básico" className="lg:col-span-3" value={formData.idiomas || ''} onChange={handleChange} />
              <Textarea label="Outras Formações (Campo Livre)" name="outrasFormacoes" className="lg:col-span-3" value={formData.outrasFormacoes || ''} onChange={handleChange} />
            </Section>

            <Section title="7.1 Experiência Profissional (Com Comprovação CNIS)" icon={Building} className="border-l-4 border-l-green-500">
              <Input label="Empresa (Nome Fantasia / CNPJ)" name="expCompEmpresa" value={formData.expCompEmpresa || ''} onChange={handleChange} className="lg:col-span-2" />
              <Input label="Ocupação" name="expCompOcupacao" value={formData.expCompOcupacao || ''} onChange={handleChange} />
              <Input label="Data de Admissão" type="date" name="expCompAdmissao" value={formData.expCompAdmissao || ''} onChange={handleChange} />
              <Input label="Data de Saída" type="date" name="expCompSaida" value={formData.expCompSaida || ''} onChange={handleChange} />
              <Input label="Tempo de Experiência" name="expCompTempo" placeholder="Ex: 2 anos e 3 meses" value={formData.expCompTempo || ''} onChange={handleChange} />
            </Section>

            <Section title="7.2 Experiência Profissional (Declarada)" icon={Briefcase} className="border-l-4 border-l-blue-500">
              <Input label="Fonte da Informação" name="expDecFonte" value={formData.expDecFonte || ''} onChange={handleChange} />
              <Input label="Tipo de Identificação" name="expDecTipoId" value={formData.expDecTipoId || ''} onChange={handleChange} />
              <Input label="Número de Identificação" name="expDecNumId" value={formData.expDecNumId || ''} onChange={handleChange} />
              <Input label="Ocupação" name="expDecOcupacao" value={formData.expDecOcupacao || ''} onChange={handleChange} />
              <Input label="Data de Admissão" type="date" name="expDecAdmissao" value={formData.expDecAdmissao || ''} onChange={handleChange} />
              <Input label="Data de Saída" type="date" name="expDecSaida" value={formData.expDecSaida || ''} onChange={handleChange} />
              <Select label="Era Aprendiz?" name="expDecAprendiz" options={['Sim', 'Não']} value={formData.expDecAprendiz || ''} onChange={handleChange} />
              <Textarea label="Observações" name="expDecObs" className="lg:col-span-2" value={formData.expDecObs || ''} onChange={handleChange} />
            </Section>

            <Section title="7.3 Experiência (Sem Comprovação)" icon={Briefcase} className="border-l-4 border-l-orange-500">
              <Input label="Ocupação" name="expSemOcupacao" value={formData.expSemOcupacao || ''} onChange={handleChange} />
              <Input label="Tempo de Trabalho (meses)" type="number" name="expSemTempo" value={formData.expSemTempo || ''} onChange={handleChange} />
              <Textarea label="Observações" name="expSemObs" className="lg:col-span-3" value={formData.expSemObs || ''} onChange={handleChange} />
            </Section>
          </div>
        )}

        {/* TAB 3: PRETENSÃO E DISPONIBILIDADE */}
        {activeTab === 'pretensao' && (
          <div className="transition-opacity duration-300">

            <Section title="8. Pretensão Profissional" icon={Target}>
              <Input label="Ocupação Desejada Principal" name="ocupacaoDesejada" className="lg:col-span-2" value={formData.ocupacaoDesejada || ''} onChange={handleChange} />
              <Select label="Horário de Trabalho Desejado" name="horarioDesejado" options={['Indiferente', 'Comercial', 'Turno']} value={formData.horarioDesejado || ''} onChange={handleChange} />

              <div className="lg:col-span-3 mt-4">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Lista de Ocupações Pretendidas Adicionais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <Input label="Código CBO" name="cbo1" value={formData.cbo1 || ''} onChange={handleChange} />
                  <Input label="Ocupação" name="ocup1" value={formData.ocup1 || ''} onChange={handleChange} />
                  <Checkbox label="Aceita Estágio" name="estagio1" checked={formData.estagio1 || false} onChange={handleChange} />
                  <Checkbox label="Exige Experiência Formal?" name="expFormal1" checked={formData.expFormal1 || false} onChange={handleChange} />
                  <Checkbox label="Aceita Experiência Informal?" name="expInformal1" checked={formData.expInformal1 || false} onChange={handleChange} />
                  <Input label="Horário Específico" name="horarioEsp1" placeholder="Ex: Matutino" value={formData.horarioEsp1 || ''} onChange={handleChange} />
                </div>
              </div>
            </Section>

            <Section title="Disponibilidades" icon={Clock}>
              <Select label="Possui veículo para trabalho?" name="dispVeiculo" options={['Sim', 'Não']} value={formData.dispVeiculo || ''} onChange={handleChange} />
              <Select label="Disponibilidade para viagens?" name="dispViagens" options={['Sim', 'Não']} value={formData.dispViagens || ''} onChange={handleChange} />
              <Select label="Disponibilidade para dormir no trabalho?" name="dispDormir" options={['Sim', 'Não']} value={formData.dispDormir || ''} onChange={handleChange} />
              <Select label="Disponibilidade para ausentar-se por longo período?" name="dispAusentar" options={['Sim', 'Não']} value={formData.dispAusentar || ''} onChange={handleChange} />
            </Section>
          </div>
        )}

      </div>
    </main>
  );
}
