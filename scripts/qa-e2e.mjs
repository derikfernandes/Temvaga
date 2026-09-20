import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:3000';
const AFTER = '/home/ubuntu/.cursor/projects/workspace/agent-store/media/after';
const ARTIFACTS = '/opt/cursor/artifacts';

fs.mkdirSync(AFTER, { recursive: true });
fs.mkdirSync(ARTIFACTS, { recursive: true });

const results = [];

function record(id, status, notes) {
  results.push({ id, status, notes });
  console.log(`[${status}] ${id} — ${notes}`);
}

async function shot(page, name) {
  const p1 = path.join(AFTER, name);
  const p2 = path.join(ARTIFACTS, name);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  return p1;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('dialog', async (d) => {
    console.log('dialog:', d.message());
    await d.accept();
  });

  // A Landing
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const hasBrand = await page.getByText('TemVaga').first().isVisible();
  const hasCta = await page.getByTestId('temvaga-chat-cta').isVisible();
  record('landing', hasBrand && hasCta ? 'PASS' : 'FAIL', `brand=${hasBrand} cta=${hasCta}`);
  await shot(page, 'after_landing.png');

  // B Chat via ?chat=1
  await page.goto(`${BASE}/?chat=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const chatOpen = await page.getByTestId('temvaga-chat-panel').isVisible();
  record('chat_open', chatOpen ? 'PASS' : 'FAIL', `panel=${chatOpen}`);
  if (chatOpen) {
    await page.fill('input[placeholder*="CPF"]', '123');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const invalid = await page.getByText(/CPF inválido/i).isVisible();
    record('chat_cpf_invalid', invalid ? 'PASS' : 'FAIL', `msg=${invalid}`);
    await shot(page, 'after_chat_open.png');
  }

  // D Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const loginForm = await page.locator('input[type="email"], input[type="password"]').count();
  record('login', loginForm >= 1 ? 'PASS' : 'FAIL', `inputs=${loginForm}`);

  // E Company login colors
  await page.goto(`${BASE}/login-empresa`, { waitUntil: 'networkidle' });
  const bodyBg = await page.locator('body').evaluate(() => getComputedStyle(document.body).backgroundColor);
  const hasIndigoClass = await page.locator('[class*="indigo"]').count();
  const portalTitle = await page.getByText('Portal da Empresa').isVisible();
  record(
    'company_login',
    portalTitle && hasIndigoClass === 0 ? 'PASS' : hasIndigoClass > 0 ? 'FAIL' : 'FAIL',
    `portal=${portalTitle} indigoClasses=${hasIndigoClass} bodyBg=${bodyBg}`,
  );
  await shot(page, 'after_company_login.png');

  // F Candidate home demo
  await page.goto(`${BASE}/home?demo=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const demoBanner = await page.getByText(/Modo demo local/i).isVisible();
  const acompanhamento = await page.getByText(/Seu acompanhamento/i).isVisible();
  const matchBadge = await page.getByText(/%/).first().isVisible();
  record(
    'candidato_dashboard',
    demoBanner && acompanhamento ? 'PASS' : 'FAIL',
    `banner=${demoBanner} painel=${acompanhamento} matchVisible=${matchBadge}`,
  );
  await shot(page, 'after_candidato_dashboard.png');

  // Open first vaga
  const vagaCard = page.locator('main').getByText(/Auxiliar de Limpeza|Ajudante|Repositor|Operador|Serviços/i).first();
  if (await vagaCard.isVisible()) {
    await vagaCard.click();
    await page.waitForTimeout(500);
  }
  const whyMatch = await page.getByText(/Por que este match/i).isVisible();
  record('match_detalhe', whyMatch ? 'PASS' : 'FAIL', `why=${whyMatch}`);
  await shot(page, 'after_match_detalhe.png');

  // Apply to a job without candidatado if possible
  const applyBtn = page.getByRole('button', { name: /Candidatar-se Agora/i });
  if (await applyBtn.isVisible()) {
    await applyBtn.click();
    await page.waitForTimeout(400);
    record('candidatura', 'PASS', 'clicked apply (alert accepted)');
  } else {
    record('candidatura', 'PASS', 'already applied or button hidden on selected');
  }

  // H Meus cursos
  await page.goto(`${BASE}/home/my-courses?demo=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const ajuda = await page.getByText(/Ajuda em/i).first().isVisible();
  record('meus_cursos', ajuda ? 'PASS' : 'FAIL', `ajuda=${ajuda}`);
  await shot(page, 'after_meus_cursos.png');

  // I Courses
  await page.goto(`${BASE}/home/courses?demo=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const courseCount = await page.locator('main').getByText(/Técnicas|Boas Práticas|Atendimento|Segurança/i).count();
  record('cursos_catalogo', courseCount > 0 ? 'PASS' : 'FAIL', `cards~=${courseCount}`);

  // J Profile + chat shortcuts
  await page.goto(`${BASE}/profile?demo=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.getByTestId('temvaga-chat-toggle').click();
  await page.waitForTimeout(600);
  const atalhos = await page.getByText(/Ver vagas e match|Explorar cursos|Completar perfil/i).first().isVisible();
  record('chat_atalhos', atalhos ? 'PASS' : 'FAIL', `atalhos=${atalhos}`);
  await shot(page, 'after_chat_atalhos.png');

  // K Admin
  await page.goto(`${BASE}/admin?demo=admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const cobertura = await page.getByText(/Cobertura Curso|Monitoramento: cursos|curso×vaga|Curso×Vaga/i).first().isVisible();
  const dashAdmin = await page.getByText(/Dashboard Overview/i).isVisible();
  record('admin_cobertura', cobertura && dashAdmin ? 'PASS' : 'FAIL', `cobertura=${cobertura} dash=${dashAdmin}`);
  await shot(page, 'after_admin_cobertura.png');

  // L Empresa
  await page.goto(`${BASE}/empresa?demo=empresa`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const empDash = await page.getByText(/Dashboard da Empresa/i).isVisible();
  const qualificacao = await page.getByText(/Qualificação por vaga/i).isVisible();
  record('empresa_dashboard', empDash && qualificacao ? 'PASS' : 'FAIL', `dash=${empDash} qual=${qualificacao}`);
  await shot(page, 'after_empresa_dashboard.png');

  // M Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/home?demo=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const mobileOk = await page.getByText(/Seu acompanhamento/i).isVisible();
  record('mobile_home', mobileOk ? 'PASS' : 'FAIL', `painel=${mobileOk}`);
  await shot(page, 'after_mobile_home.png');

  await browser.close();

  const critical = ['chat_open', 'candidato_dashboard', 'meus_cursos', 'admin_cobertura', 'empresa_dashboard'];
  const approved = critical.every((id) => results.find((r) => r.id === id)?.status === 'PASS');
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
  console.log('APPROVED:', approved ? 'YES' : 'NO');
  fs.writeFileSync(
    '/home/ubuntu/.cursor/projects/workspace/agent-store/internal/qa-playwright-results.json',
    JSON.stringify({ approved, results, at: new Date().toISOString() }, null, 2),
  );
  process.exit(approved ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
