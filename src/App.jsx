import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, BatteryCharging, BookOpen, Check,
  ChevronDown, ChevronRight, CircleHelp, Cloud, Download, ExternalLink, Eye,
  Factory, FileText, Gauge, GraduationCap, Home, Info, Leaf, Lightbulb,
  Menu, Moon, Play, Plus, RotateCcw, Save, Settings2, ShieldCheck, Sun,
  Trees, Wallet, Waves, X, Zap, Store
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';
import CommunityScene from './components/CommunityScene.jsx';
import Marketplace from './components/Marketplace.jsx';
import {
  applyScenario, calculateCommunity, calculateHome, DEMO_CO2_FACTOR,
  INITIAL_HOMES, MINIMUM_WAGE_2026, SOLUTIONS, SOCIAL_TARIFF_LIMIT
} from './lib/simulation.js';
import { saveSimulation } from './lib/supabase.js';

const NAV_ITEMS = [
  { id: 'territorio', label: 'Território 3D', icon: Home },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
  { id: 'indicadores', label: 'Indicadores', icon: Activity },
  { id: 'conhecimento', label: 'Conhecimento', icon: BookOpen }
];
const SOURCE_ITEMS = [
  { name: 'ONU — Objetivo 7', description: 'Metas globais de energia acessível, confiável, moderna e sustentável.', url: 'https://sdgs.un.org/goals/goal7', type: 'ONU' },
  { name: 'IPEA — ODS 7 no Brasil', description: 'Adequação nacional das metas e conceitos utilizados no monitoramento.', url: 'https://www.ipea.gov.br/ods/ods7.html', type: 'Pesquisa pública' },
  { name: 'ANEEL — Tarifa Social', description: 'Critérios de elegibilidade e regra de gratuidade dos primeiros 80 kWh para beneficiários.', url: 'https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social', type: 'Regulação' },
  { name: 'Lei nº 14.300/2022', description: 'Marco legal da microgeração, minigeração distribuída e Sistema de Compensação de Energia Elétrica.', url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14300.htm', type: 'Legislação' },
  { name: 'INPI — Patentes Verdes', description: 'Trâmite prioritário para pedidos de patente relacionados a tecnologias ambientalmente sustentáveis.', url: 'https://www.gov.br/inpi/pt-br/servicos/patentes/tramite-prioritario/projetos-piloto/Patentes_verdes/', type: 'Propriedade intelectual' },
  { name: 'Decreto nº 12.797/2025', description: 'Define o salário mínimo nacional de R$ 1.621,00 a partir de 1º de janeiro de 2026.', url: 'https://legis.senado.gov.br/norma/41882097/publicacao/41888369', type: 'Legislação' },
  { name: 'Revolusolar', description: 'Experiência brasileira em energia solar social, eficiência, formação e inclusão energética.', url: 'https://revolusolar.org.br/', type: 'Iniciativa social' },
  { name: 'Litro de Luz Brasil', description: 'Tecnologias de iluminação solar de baixo custo e capacitação comunitária.', url: 'https://www.litrodeluz.com/', type: 'Tecnologia social' }
];
const RANK_BASE = {
  efficiency: [5, 5, 5], solar: [3, 3, 3], shared_solar: [3, 3, 2],
  street_lights: [4, 4, 4], heater: [4, 4, 4], biodigester: [2, 3, 3], offgrid: [2, 3, 3]
};
const RANK_LABEL = ['Acessibilidade financeira', 'Viabilidade técnica', 'Viabilidade jurídica'];
const money = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
const money2 = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(n) ? n : 0);
const number = (n, digits = 0) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number.isFinite(n) ? n : 0);

function Metric({ label, value, detail, icon: Icon, tone = 'mint' }) {
  return <div className={`metric metric-${tone}`}>
    <div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17} /></span></div>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>;
}

function Toggle({ checked, onChange, label }) {
  return <button type="button" className={`toggle ${checked ? 'is-on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
    <span />
  </button>;
}

function Field({ label, value, onChange, min = 0, step = 1, suffix, prefix, help }) {
  return <label className="field">
    <span>{label}</span>
    <div className="field-input-wrap">{prefix && <i>{prefix}</i>}<input type="number" min={min} step={step} value={value} onChange={e => onChange(Math.max(min, Number(e.target.value)))} />{suffix && <i>{suffix}</i>}</div>
    {help && <small>{help}</small>}
  </label>;
}

function SolutionGlyph({ id }) {
  const common = { size: 18, strokeWidth: 1.8 };
  if (id === 'solar') return <Sun {...common} />;
  if (id === 'efficiency') return <Leaf {...common} />;
  if (id === 'shared_solar') return <Trees {...common} />;
  if (id === 'street_lights') return <Lightbulb {...common} />;
  if (id === 'heater') return <Waves {...common} />;
  if (id === 'biodigester') return <RotateCcw {...common} />;
  return <BatteryCharging {...common} />;
}

function ScenarioCard({ id, active, title, description, number: num, onClick }) {
  return <button className={`scenario-card ${active ? 'active' : ''}`} onClick={onClick} aria-pressed={active}>
    <span className="scenario-number">{num}</span>
    <span className="scenario-copy"><b>{title}</b><small>{description}</small></span>
    {active ? <Check size={17} /> : <ChevronRight size={17} />}
  </button>;
}

function Modal({ title, children, onClose, wide = false }) {
  const modalRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    modalRef.current?.querySelector('button')?.focus();
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      previousFocus?.focus?.();
    };
  }, []);

  function keepFocusInside(event) {
    if (event.key !== 'Tab') return;
    const items = [...(modalRef.current?.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') || [])];
    if (!items.length) { event.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={modalRef} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onKeyDown={keepFocusInside}>
      <div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button></div>
      {children}
    </section>
  </div>;
}

export default function App() {
  const [homes, setHomes] = useState(() => {
    try {
      const saved = localStorage.getItem('energia-viva-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.homes) && parsed.homes.length === INITIAL_HOMES.length) return parsed.homes;
      }
    } catch { /* inicia com dados demonstrativos */ }
    return INITIAL_HOMES;
  });
  const [selectedId, setSelectedId] = useState('casa-01');
  const [activeView, setActiveView] = useState('territorio');
  const [scenario, setScenario] = useState('precario');
  const [theme, setTheme] = useState(() => localStorage.getItem('energia-viva-theme-neo') || 'light');
  const [lowMotion, setLowMotion] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [presentationStep, setPresentationStep] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState('');
  const [rankWeights, setRankWeights] = useState([40, 35, 25]);
  const [communityTitle, setCommunityTitle] = useState('Comunidade Horizonte');
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const selectedHome = homes.find(h => h.id === selectedId) || homes[0];
  const selectedResult = useMemo(() => calculateHome(selectedHome), [selectedHome]);
  const community = useMemo(() => calculateCommunity(homes), [homes]);
  const scenarioNames = { precario: 'Infraestrutura precária', transition: 'Transição energética', integrated: 'Soluções integradas' };

  useEffect(() => {
    localStorage.setItem('energia-viva-state', JSON.stringify({ homes, scenario, communityTitle }));
  }, [homes, scenario, communityTitle]);
  useEffect(() => { localStorage.setItem('energia-viva-theme-neo', theme); }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  function changeHome(id, updater) {
    setHomes(prev => prev.map(h => h.id === id ? updater(h) : h));
    setScenario('custom');
  }
  function toggleSolution(solutionId) {
    if (solutionId === 'street_lights' && homes.some(h => h.id !== selectedId && h.installations.includes('street_lights'))) {
      changeHome(selectedId, h => ({ ...h, installations: h.installations.includes(solutionId) ? h.installations.filter(x => x !== solutionId) : [...h.installations, solutionId] }));
      return;
    }
    changeHome(selectedId, h => ({
      ...h,
      installations: h.installations.includes(solutionId) ? h.installations.filter(x => x !== solutionId) : [...h.installations, solutionId]
    }));
  }
  function setScenarioMode(next) {
    const nextHomes = applyScenario(next === 'precario' ? 'precario' : next);
    setHomes(nextHomes);
    setScenario(next);
    setSelectedId('casa-01');
    setToast(`Cenário aplicado: ${scenarioNames[next]}`);
  }
  function resetSimulation() {
    setHomes(INITIAL_HOMES.map(h => ({ ...h, installations: [] })));
    setScenario('precario');
    setSelectedId('casa-01');
    setToast('Simulação reiniciada.');
  }
  function updateField(field, value) {
    changeHome(selectedId, h => ({ ...h, [field]: value }));
  }
  async function persistRemote() {
    setSaveBusy(true); setSaveMessage('');
    try {
      const result = await saveSimulation({ title: communityTitle, scenario, homes, savedAt: new Date().toISOString() });
      setSaveMessage(result.saved ? 'Simulação sincronizada com o Supabase.' : 'Supabase não configurado: a simulação já está salva neste navegador.');
    } catch (error) {
      setSaveMessage(`Não foi possível sincronizar: ${error.message}`);
    } finally { setSaveBusy(false); }
  }
  function exportReport() {
    const report = {
      produto: 'Energia Viva — Simulador ODS 7',
      aviso: 'Todos os números abaixo são resultados de simulação, baseados nas premissas visíveis na aplicação; não são dados oficiais nem proposta de engenharia.',
      comunidade: communityTitle,
      cenario: scenarioNames[scenario] || 'Personalizado',
      geradoEm: new Date().toLocaleString('pt-BR'),
      indicadores: community,
      residencias: homes.map(h => ({ nome: h.name, familia: h.family, rendaMensal: h.income, consumoBaseKwh: h.consumption, tecnologias: h.installations, resultado: calculateHome(h) }))
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio-energia-viva.json'; a.click(); URL.revokeObjectURL(url);
    setToast('Relatório de simulação exportado.');
  }
  function startPresentation() { setPresentation(true); setPresentationStep(0); }
  function stepPresentation(direction) {
    const next = Math.max(0, Math.min(3, presentationStep + direction));
    setPresentationStep(next);
    if (next === 1) setScenarioMode('precario');
    if (next === 2) setScenarioMode('transition');
    if (next === 3) setScenarioMode('integrated');
  }

  const rank = useMemo(() => SOLUTIONS.map(solution => {
    const base = RANK_BASE[solution.id];
    const score = base.reduce((s, v, i) => s + v * rankWeights[i], 0) / Math.max(1, rankWeights.reduce((a, b) => a + b, 0));
    return { ...solution, score };
  }).sort((a, b) => b.score - a.score), [rankWeights]);
  const chartData = homes.map((home, i) => {
    const result = calculateHome(home);
    return { casa: `0${i + 1}`, consumo: Math.round(result.load), rede: Math.round(result.gridImport), renovavel: Math.round(result.renewableUsed) };
  });
  const impactData = [
    { month: 'Atual', antes: Math.round(community.billBefore), depois: Math.round(community.billAfter) },
    { month: 'Ano projetado', antes: Math.round(community.billBefore * 12), depois: Math.round(community.billAfter * 12) }
  ];
  const eligible = selectedResult.eligible;
  const installedCount = selectedHome.installations.length;

  return <div className={`app-shell theme-${theme} ${lowMotion ? 'reduced-motion' : ''}`}><a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark"><Zap size={20} fill="currentColor" /></div>
        <div><strong>ENERGIA<span>VIVA</span></strong><small>COMUNIDADE · ODS 7</small></div>
      </div>
      <nav className="main-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map(item => <button type="button" key={item.id} className={activeView === item.id ? 'nav-active' : ''} aria-current={activeView === item.id ? 'page' : undefined} onClick={() => setActiveView(item.id)}>
          <item.icon size={16} /><span>{item.label}</span>
        </button>)}
      </nav>
      <div className="top-actions">
        <span className="simulation-state"><i /> SIMULAÇÃO LOCAL</span>
        <button className="icon-button" aria-label="Alternar tema claro ou escuro" title="Alternar tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button className="icon-button" aria-label="Configurações de acessibilidade" title="Acessibilidade e preferências" onClick={() => setShowSettings(true)}><Settings2 size={18} /></button>
      </div>
    </header>

    <main className="main-content" id="main-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span>OBJETIVO DE DESENVOLVIMENTO SUSTENTÁVEL 07</span><span className="eyebrow-line" /></div>
          <h1>Energia acessível. <em>Futuro compartilhado.</em></h1>
          <p>{activeView === 'marketplace' ? 'Gestão demonstrativa de famílias, usinas, patrocinadores e propostas de geração compartilhada.' : 'Explore uma comunidade brasileira e simule caminhos para uma transição energética mais justa. Os resultados são estimativas didáticas baseadas nas premissas editáveis.'}</p>
        </div>
        {activeView !== 'marketplace' && <div className="heading-actions">
          <button className="button button-quiet" onClick={exportReport}><Download size={16} /> Exportar cenário</button>
          <button className="button button-primary" onClick={startPresentation}><Play size={15} fill="currentColor" /> Modo apresentação</button>
        </div>}
      </div>

      {activeView !== 'marketplace' && <section className="metric-strip" aria-label="Indicadores principais da comunidade">
        <Metric label="Energia consumida" value={`${number(community.consumed)} kWh`} detail="por mês · estimativa" icon={Zap} tone="mint" />
        <Metric label="Geração renovável" value={`${number(community.generation)} kWh`} detail={`${number(community.renewablePct, 1)}% da carga simulada`} icon={Sun} tone="gold" />
        <Metric label="Economia mensal" value={money(community.savings)} detail="após intervenções simuladas" icon={Wallet} tone="blue" />
        <Metric label="Famílias alcançadas" value={`${community.beneficiaries}/${community.totalFamilies}`} detail="com benefício ou tecnologia" icon={Home} tone="violet" />
      </section>}

      {activeView === 'territorio' && <>
        <section className="scenario-bar">
          <div className="scenario-intro"><span className="micro-label">EXPERIMENTE A TRANSFORMAÇÃO</span><b>Escolha um cenário</b><small>Os elementos e os indicadores serão atualizados na comunidade 3D.</small></div>
          <div className="scenario-options">
            <ScenarioCard id="precario" number="01" title="Infraestrutura precária" description="Ponto de partida" active={scenario === 'precario'} onClick={() => setScenarioMode('precario')} />
            <ScenarioCard id="transition" number="02" title="Transição energética" description="Primeiras intervenções" active={scenario === 'transition'} onClick={() => setScenarioMode('transition')} />
            <ScenarioCard id="integrated" number="03" title="Soluções integradas" description="Comunidade transformada" active={scenario === 'integrated'} onClick={() => setScenarioMode('integrated')} />
          </div>
          <button className="icon-button reset-button" title="Reiniciar simulação" aria-label="Reiniciar simulação" onClick={resetSimulation}><RotateCcw size={17} /></button>
        </section>

        <section className="workspace-grid">
          <div className="scene-column">
            <div className="section-toolbar">
              <div><span className="status-kicker"><i /> TERRITÓRIO INTERATIVO</span><h2>{communityTitle}</h2></div>
              <div className="scene-toolbar-actions">
                <span className="scene-state">{scenarioNames[scenario] || 'Cenário personalizado'}</span>
                <button className="small-action" onClick={() => setShowSettings(true)}><Settings2 size={14} /> Ajustar</button>
              </div>
            </div>
            <CommunityScene homes={homes} selectedId={selectedId} onSelect={setSelectedId} lowMotion={lowMotion} />
            <div className="home-picker" aria-label="Selecionar residência">
              <div className="picker-label"><span>RESIDÊNCIAS</span><small>Selecione também por teclado</small></div>
              <div className="home-pills">
                {homes.map((home, index) => <button type="button" key={home.id} className={`home-pill ${selectedId === home.id ? 'selected' : ''}`} onClick={() => setSelectedId(home.id)} aria-label={`Selecionar ${home.name}, ${home.family}, ${home.installations.length} tecnologias ativas`} aria-pressed={selectedId === home.id}>
                  <span className="home-pill-number">0{index + 1}</span><span className="home-pill-main"><b>{home.name}</b><small>{home.family} · {home.installations.length} tecnologia{home.installations.length === 1 ? '' : 's'}</small></span>{home.installations.length > 0 && <i aria-hidden="true" />}
                </button>)}
              </div>
              <span className="sr-only" role="status" aria-live="polite">{selectedHome.name} selecionada. {selectedHome.installations.length} tecnologias ativas.</span>
            </div>
          </div>

          <aside className="intervention-panel">
            <div className="panel-head">
              <div><span className="micro-label">PAINEL DE INTERVENÇÃO</span><h2>{selectedHome.name}</h2><p>{selectedHome.family} · {selectedHome.people} moradores</p></div>
              <span className="house-status">{installedCount ? `${installedCount} ATIVA${installedCount > 1 ? 'S' : ''}` : 'SEM INTERVENÇÃO'}</span>
            </div>
            <div className="panel-stat-grid">
              <div><small>Consumo atual</small><b>{number(selectedResult.load)} <small>kWh/mês</small></b></div>
              <div><small>Conta estimada</small><b>{money2(selectedResult.afterBill)}</b></div>
            </div>
            <div className="panel-divider" />
            <div className="subsection-title"><b>Tecnologias disponíveis</b><span>{installedCount}/7 ativas</span></div>
            <div className="solution-list">
              {SOLUTIONS.map(solution => {
                const active = selectedHome.installations.includes(solution.id);
                return <div className={`solution-row ${active ? 'solution-active' : ''}`} key={solution.id}>
                  <div className="solution-icon"><SolutionGlyph id={solution.id} /></div>
                  <div className="solution-copy"><b>{solution.name}</b><small>{solution.short}</small></div>
                  <button className={`install-button ${active ? 'installed' : ''}`} onClick={() => toggleSolution(solution.id)} aria-label={`${active ? 'Desinstalar' : 'Instalar'} ${solution.name}`}>
                    {active ? <><Check size={14} /> Ativo</> : <><Plus size={15} /> Instalar</>}
                  </button>
                </div>;
              })}
            </div>
            <div className={`tariff-card ${eligible ? 'eligible' : ''}`}>
              <div className="tariff-symbol"><ShieldCheck size={18} /></div>
              <div className="tariff-copy"><b>Tarifa Social de Energia</b><small>{eligible ? 'Critérios básicos simulados atendidos' : 'Verifique os critérios de elegibilidade'}</small></div>
              <span className={`eligibility-tag ${eligible ? 'yes' : 'no'}`}>{eligible ? 'ELEGÍVEL' : 'ANALISAR'}</span>
              <button className="tariff-details" onClick={() => setShowCalculator(true)}>Ver critérios e renda <ChevronRight size={14} /></button>
            </div>
            <div className="panel-note"><Info size={14} /><span>Instalações nesta maquete são demonstrativas. Projetos reais exigem avaliação técnica, segurança elétrica e autorização quando aplicável.</span></div>
          </aside>
        </section>
        <section className="below-grid">
          <div className="comparison-panel">
            <div className="section-headline"><div><span className="micro-label">RESIDÊNCIA SELECIONADA</span><h2>Antes e depois das intervenções</h2></div><button className="text-action" onClick={() => setShowCalculator(true)}>Editar premissas <ChevronRight size={14} /></button></div>
            <div className="bill-comparison">
              <div className="bill-side"><span>Conta estimada antes</span><b>{money2(selectedResult.baseBill)}</b><small>Consumo sem intervenções</small></div>
              <div className="bill-arrow"><ArrowDownRight size={23} /></div>
              <div className="bill-side bill-after"><span>Conta estimada depois</span><b>{money2(selectedResult.afterBill)}</b><small>{selectedResult.monthlySavings >= 0 ? `${money2(selectedResult.monthlySavings)} de economia/mês` : `${money2(Math.abs(selectedResult.monthlySavings))} de custo adicional/mês`}</small></div>
            </div>
            <div className="progress-line"><span style={{ width: `${Math.min(100, selectedResult.incomeShareBefore)}%` }} /><i style={{ left: `${Math.min(100, selectedResult.incomeShareAfter)}%` }} /></div>
            <div className="progress-caption"><span>Comprometimento da renda após: <b>{number(selectedResult.incomeShareAfter, 1)}%</b></span><span>Antes: {number(selectedResult.incomeShareBefore, 1)}%</span></div>
          </div>
          <div className="impact-panel">
            <div className="section-headline"><div><span className="micro-label">RETORNO SIMULADO</span><h2>Impacto na residência</h2></div><span className="impact-leaf"><Leaf size={18} /></span></div>
            <div className="impact-values">
              <div><small>Investimento inicial</small><b>{money(selectedResult.investment)}</b></div>
              <div><small>Economia anual</small><b>{money(selectedResult.annualSavings)}</b></div>
              <div><small>Retorno estimado</small><b>{selectedResult.paybackMonths ? `${number(selectedResult.paybackMonths / 12, 1)} anos` : 'Indefinido'}</b></div>
              <div><small>CO₂ evitado*</small><b>{number(selectedResult.co2Avoided, 1)} kg/mês</b></div>
            </div>
            <small className="fine-print">*Indicador aproximado com fator ilustrativo de {number(DEMO_CO2_FACTOR, 2)} kg CO₂/kWh. Não representa inventário oficial de emissões.</small>
          </div>
        </section>
      </>}

      {activeView === 'marketplace' && <Marketplace />}

      {activeView === 'indicadores' && <section className="analytics-view">
        <div className="analytics-heading"><div><span className="micro-label">LEITURA DO TERRITÓRIO</span><h2>Indicadores de transformação</h2><p>Resultados calculados a partir das premissas e intervenções selecionadas.</p></div><button className="button button-quiet" onClick={exportReport}><Download size={16} /> Exportar dados</button></div>
        <div className="analytics-metrics">
          <Metric label="Consumo final" value={`${number(community.consumed)} kWh`} detail="demanda elétrica mensal" icon={Zap} />
          <Metric label="Geração e créditos" value={`${number(community.generation)} kWh`} detail="inclui créditos simulados" icon={Sun} tone="gold" />
          <Metric label="Energia da rede" value={`${number(community.grid)} kWh`} detail="após compensações modeladas" icon={Factory} tone="blue" />
          <Metric label="Armazenamento" value={`${number(community.stored)} kWh`} detail="capacidade nominal simulada" icon={BatteryCharging} tone="violet" />
        </div>
        <div className="analytics-grid">
          <div className="chart-panel"><div className="section-headline"><div><span className="micro-label">ENERGIA POR RESIDÊNCIA</span><h3>Consumo e energia renovável</h3></div><span className="chart-unit">kWh/mês</span></div>
          <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }} barGap={4}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey="casa" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)' }} /><Legend /><Bar dataKey="consumo" name="Consumo" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} /><Bar dataKey="renovavel" name="Renovável utilizada" fill="var(--chart-secondary)" radius={[4, 4, 0, 0]} /><Bar dataKey="rede" name="Energia da rede" fill="var(--chart-tertiary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="chart-panel"><div className="section-headline"><div><span className="micro-label">ECONOMIA PROJETADA</span><h3>Conta estimada da comunidade</h3></div><span className="chart-unit">R$</span></div>
          <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={impactData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}><defs><linearGradient id="billAfter" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-secondary)" stopOpacity={0.2} /><stop offset="100%" stopColor="var(--chart-secondary)" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><Tooltip formatter={(v) => money2(v)} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)' }} /><Legend /><Area type="monotone" dataKey="antes" name="Antes" stroke="var(--chart-primary)" fill="var(--chart-primary)" fillOpacity={0.08} strokeWidth={2} /><Area type="monotone" dataKey="depois" name="Depois" stroke="var(--chart-secondary)" fill="url(#billAfter)" strokeWidth={2.4} /></AreaChart></ResponsiveContainer></div>
          </div>
        </div>
        <div className="indicator-lower-grid">
          <div className="impact-summary"><span className="micro-label">RESULTADOS DA COMUNIDADE</span><h3>Impacto acumulado no cenário</h3><div className="impact-summary-grid"><div><b>{number(community.co2, 1)} kg</b><small>CO₂ evitado estimado/mês</small></div><div><b>{community.eligible}</b><small>residências com critérios TSEE simulados</small></div><div><b>{community.lamps}</b><small>pontos de iluminação solar no modelo</small></div><div><b>{number(community.biogas)} kWh-eq</b><small>biogás térmico estimado/mês</small></div><div><b>{number(community.beneficiaries)}</b><small>famílias alcançadas</small></div><div><b>{money(community.investment)}</b><small>investimento demonstrativo total</small></div></div></div>
          <div className="ranking-panel"><div className="section-headline"><div><span className="micro-label">PRIORIZAÇÃO</span><h3>Ranking de soluções</h3></div><span className="rank-note">Escala de 1 a 5</span></div><p className="ranking-intro">Pontuação ilustrativa baseada em três dimensões. Ajuste os pesos para priorizar a realidade local.</p>
            <div className="weight-controls">{RANK_LABEL.map((label, i) => <label key={label}><span>{label} <b>{rankWeights[i]}%</b></span><input type="range" min="0" max="100" step="5" value={rankWeights[i]} onChange={e => setRankWeights(prev => prev.map((v, idx) => idx === i ? Number(e.target.value) : v))} /></label>)}</div>
            <div className="ranking-list">{rank.map((s, index) => <div className="ranking-item" key={s.id}><span className="rank-pos">{index + 1}</span><span className="rank-name">{s.name}</span><span className="rank-track"><i style={{ width: `${(s.score / 5) * 100}%` }} /></span><b>{number(s.score, 1)}</b></div>)}</div>
            <small className="fine-print">Critérios e notas são hipóteses de avaliação para comparação didática; não constituem parecer técnico, jurídico ou financeiro.</small>
          </div>
        </div>
      </section>}

      {activeView === 'conhecimento' && <section className="knowledge-view">
        <div className="knowledge-hero"><div><span className="micro-label">CONHECIMENTO PARA AGIR</span><h2>Energia é infraestrutura.<br /><em>Também é direito e oportunidade.</em></h2><p>O ODS 7 propõe acesso universal à energia moderna, confiável, sustentável e a preços acessíveis até 2030.</p></div><div className="ods-seal"><span>ODS</span><b>07</b><small>ENERGIA LIMPA<br />E ACESSÍVEL</small></div></div>
        <div className="goal-grid">
          <article><span>7.1</span><h3>Acesso universal</h3><p>Assegurar acesso universal a serviços de energia confiáveis, modernos e a preços acessíveis.</p></article>
          <article><span>7.2</span><h3>Energias renováveis</h3><p>Aumentar substancialmente a participação das fontes renováveis na matriz energética.</p></article>
          <article><span>7.3</span><h3>Eficiência energética</h3><p>Ampliar a taxa de melhoria da eficiência energética.</p></article>
          <article><span>7.a / 7.b</span><h3>Cooperação e infraestrutura</h3><p>Fortalecer tecnologia, investimento e infraestrutura moderna e sustentável.</p></article>
        </div>
        <div className="education-grid">
          <article className="education-card tariff-education"><div className="education-icon"><ShieldCheck size={21} /></div><span className="micro-label">POLÍTICA PÚBLICA</span><h3>Tarifa Social de Energia Elétrica</h3><p>A ANEEL apresenta como critérios, entre outros, inscrição no CadÚnico com renda familiar mensal por pessoa de até meio salário mínimo, determinadas situações com uso continuado de equipamentos elétricos por pessoa com deficiência e famílias com beneficiário do BPC.</p><div className="fact-highlight"><b>Até 80 kWh/mês</b><span>Consumo com gratuidade da parcela de energia para beneficiários, conforme a regra divulgada pela ANEEL. Tributos e contribuição de iluminação pública podem continuar na fatura.</span></div><a href="https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social" target="_blank" rel="noreferrer">Consultar critérios oficiais <ExternalLink size={13} /></a></article>
          <article className="education-card law-education"><div className="education-icon"><FileText size={21} /></div><span className="micro-label">MARCO REGULATÓRIO</span><h3>Lei nº 14.300/2022</h3><p>Institui o marco legal da microgeração e minigeração distribuída, o Sistema de Compensação de Energia Elétrica (SCEE) e o Programa de Energia Renovável Social (PERS).</p><div className="fact-highlight"><b>Geração distribuída</b><span>A compensação de créditos e as regras de conexão variam conforme o enquadramento regulatório e a situação do projeto. A simulação não calcula componentes tarifários legais específicos.</span></div><a href="https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14300.htm" target="_blank" rel="noreferrer">Ler a legislação <ExternalLink size={13} /></a></article>
          <article className="education-card patent-education"><div className="education-icon"><Lightbulb size={21} /></div><span className="micro-label">INOVAÇÃO E PROPRIEDADE INTELECTUAL</span><h3>INPI e Patentes Verdes</h3><p>O INPI oferece trâmite prioritário para pedidos de patente relacionados a tecnologias ambientalmente sustentáveis, abrangendo áreas como energia alternativa, conservação de energia e gestão de resíduos.</p><div className="fact-highlight"><b>Inovação protegida</b><span>A proteção patentária depende dos requisitos legais de patenteabilidade; a classificação como tecnologia verde não significa concessão automática de patente.</span></div><a href="https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/tramite-prioritario-para-patentes-verdes-o-que-e-e-como-solicitar" target="_blank" rel="noreferrer">Conhecer o programa <ExternalLink size={13} /></a></article>
        </div>
        <div className="initiatives-section"><div className="section-headline"><div><span className="micro-label">REFERÊNCIAS DE CAMPO</span><h2>Iniciativas que inspiram</h2></div></div><div className="initiative-cards"><article><div className="initiative-mark revolu">R</div><div><h3>Revolusolar</h3><p>Atua com energia solar social, eficiência energética, capacitação profissional e participação comunitária em uma transição energética inclusiva.</p><a href="https://revolusolar.org.br/" target="_blank" rel="noreferrer">Acessar iniciativa <ExternalLink size={13} /></a></div></article><article><div className="initiative-mark litro">L</div><div><h3>Litro de Luz Brasil</h3><p>Desenvolve soluções de iluminação solar acessíveis e promove capacitação para instalação, replicação e manutenção com protagonismo dos moradores.</p><a href="https://www.litrodeluz.com/" target="_blank" rel="noreferrer">Acessar iniciativa <ExternalLink size={13} /></a></div></article></div></div>
        <div className="sources-panel"><div className="section-headline"><div><span className="micro-label">BASE DOCUMENTAL</span><h2>Fontes e referências</h2></div><span className="source-updated">Links consultados em nov. 2026</span></div><div className="source-list">{SOURCE_ITEMS.map((source, i) => <a className="source-item" href={source.url} target="_blank" rel="noreferrer" key={source.name}><span className="source-number">0{i + 1}</span><span><b>{source.name}</b><small>{source.description}</small></span><span className="source-type">{source.type}</span><ExternalLink size={15} /></a>)}</div></div>
      </section>}

      <footer className="site-footer"><div><strong>ENERGIA<span>VIVA</span></strong><small>Simulador comunitário · ODS 7</small></div><p>Ferramenta educacional de simulação. Não substitui avaliação técnica, análise da distribuidora, orientação jurídica ou cálculo oficial de fatura.</p><span>VERSÃO 1.0 · 2026</span></footer>
    </main>

    {showCalculator && <Modal title="Premissas da residência" onClose={() => setShowCalculator(false)} wide>
      <div className="calculator-modal-content">
        <div className="modal-intro"><p>Edite os dados para recalcular a conta estimada e a possível elegibilidade à Tarifa Social. Os campos são parâmetros demonstrativos, não dados de uma família real.</p></div>
        <div className="calculator-grid">
          <div className="calculator-section"><span className="micro-label">PERFIL DA FAMÍLIA</span><Field label="Renda familiar mensal" prefix="R$" value={selectedHome.income} onChange={v => updateField('income', v)} step={50} /><Field label="Renda por pessoa" prefix="R$" value={selectedHome.perCapita} onChange={v => updateField('perCapita', v)} step={25} /><Field label="Número de moradores" value={selectedHome.people} onChange={v => updateField('people', Math.max(1, v))} min={1} /><label className="check-field"><input type="checkbox" checked={selectedHome.cadUnico} onChange={e => updateField('cadUnico', e.target.checked)} /> Família inscrita no CadÚnico</label><label className="check-field"><input type="checkbox" checked={selectedHome.bpc} onChange={e => updateField('bpc', e.target.checked)} /> Há beneficiário do BPC na família (idoso 65+ ou pessoa com deficiência)</label><label className="check-field"><input type="checkbox" checked={selectedHome.medicalDevice} onChange={e => updateField('medicalDevice', e.target.checked)} /> Pessoa com deficiência utiliza equipamento elétrico de uso continuado</label>
            <div className={`eligibility-result ${eligible ? 'good' : 'attention'}`}><ShieldCheck size={20} /><div><b>{eligible ? 'Critérios básicos simulados atendidos' : 'Critérios básicos não identificados'}</b><small>{eligible ? 'A simulação aplica gratuidade sobre até 80 kWh da parcela de energia.' : 'Confira os critérios oficiais, os documentos e a situação cadastral antes de concluir.'}</small></div></div>
            <small className="fine-print">Referência de cálculo: salário mínimo nacional de 2026 = R$ 1.621,00; meio salário mínimo = R$ 810,50 por pessoa. O CadÚnico precisa atender às condições oficiais de atualização e titularidade aplicáveis.</small>
          </div>
          <div className="calculator-section"><span className="micro-label">CONSUMO E COBRANÇAS</span><Field label="Consumo mensal" value={selectedHome.consumption} onChange={v => updateField('consumption', v)} suffix="kWh" /><Field label="Tarifa de energia" prefix="R$" value={selectedHome.tariff} onChange={v => updateField('tariff', v)} step={0.01} /><Field label="Tributos estimados" value={selectedHome.taxesPct} onChange={v => updateField('taxesPct', v)} suffix="%" /><Field label="Iluminação pública" prefix="R$" value={selectedHome.publicLighting} onChange={v => updateField('publicLighting', v)} /><Field label="Outras cobranças fixas" prefix="R$" value={selectedHome.otherCharges} onChange={v => updateField('otherCharges', v)} />
            <div className="bill-breakdown"><div><span>Conta-base estimada</span><b>{money2(selectedResult.baseBill)}</b></div><div><span>Conta após soluções</span><b>{money2(selectedResult.afterBill)}</b></div><div><span>Consumo faturável após TSEE e geração</span><b>{number(Math.max(0, selectedResult.gridImport - selectedResult.socialExempt))} kWh</b></div></div>
            <small className="fine-print">Modelo simplificado. Tributos, bandeiras, custo de disponibilidade, componentes tarifários e compensação de créditos podem variar. Para uma conta real, consulte a fatura e a distribuidora.</small>
          </div>
        </div>
      </div>
    </Modal>}

    {showSettings && <Modal title="Preferências e comunidade" onClose={() => setShowSettings(false)}>
      <div className="settings-content"><label className="field"><span>Nome do território</span><input className="text-input" value={communityTitle} onChange={e => setCommunityTitle(e.target.value)} /></label>
        <div className="setting-row"><div><b>Reduzir animações</b><small>Desativa movimentos não essenciais e reduz transições visuais.</small></div><Toggle checked={lowMotion} onChange={setLowMotion} label="Reduzir animações" /></div>
        <div className="setting-row"><div><b>Tema claro</b><small>Use superfícies claras e texto escuro para ampliar o contraste.</small></div><Toggle checked={theme === 'light'} onChange={v => setTheme(v ? 'light' : 'dark')} label="Ativar tema claro" /></div>
        <div className="setting-row"><div><b>Persistência local</b><small>Alterações são salvas automaticamente neste navegador.</small></div><span className="local-state"><Check size={14} /> Ativa</span></div>
        <button className="button button-primary full-width" onClick={persistRemote} disabled={saveBusy}><Save size={16} /> {saveBusy ? 'Salvando...' : 'Sincronizar com Supabase'}</button>
        {saveMessage && <div className="save-message"><Info size={15} /> {saveMessage}</div>}
        <small className="fine-print">A sincronização remota depende da configuração das variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e da criação da tabela descrita em supabase/schema.sql.</small>
      </div>
    </Modal>}

    {presentation && <div className="presentation-overlay"><div className="presentation-top"><div className="brand-lockup"><div className="brand-mark"><Zap size={20} fill="currentColor" /></div><div><strong>ENERGIA<span>VIVA</span></strong><small>MODO APRESENTAÇÃO</small></div></div><button className="icon-button" onClick={() => setPresentation(false)} aria-label="Sair da apresentação"><X size={21} /></button></div><div className="presentation-content"><span className="micro-label">ETAPA {presentationStep + 1} DE 4</span><h2>{['O território e o desafio', '01 · Infraestrutura precária', '02 · Transição energética', '03 · Soluções integradas'][presentationStep]}</h2><p>{[
      'Uma comunidade fictícia, com seis residências e equipamentos coletivos, serve como laboratório para visualizar desafios de acesso, custo e qualidade da energia.',
      'No cenário inicial, as casas não contam com intervenções sustentáveis. Observe o consumo-base, a estimativa da conta e a parcela da renda comprometida.',
      'A eficiência, os primeiros sistemas solares e o aquecimento de água mostram como intervenções graduais podem reduzir a dependência da rede.',
      'A combinação de tecnologias amplia a geração local, o armazenamento e os benefícios comunitários. Compare os indicadores, os custos e os limites da simulação.'
    ][presentationStep]}</p><div className="presentation-scenario-dots"><i className={presentationStep >= 1 ? 'complete' : 'current'} /><i className={presentationStep >= 2 ? 'complete' : ''} /><i className={presentationStep >= 3 ? 'complete' : ''} /></div><div className="presentation-controls"><button className="button button-quiet" onClick={() => stepPresentation(-1)} disabled={presentationStep === 0}>Voltar</button><button className="button button-primary" onClick={() => presentationStep === 3 ? setPresentation(false) : stepPresentation(1)}>{presentationStep === 3 ? 'Concluir' : 'Próxima etapa'} <ChevronRight size={16} /></button></div></div><div className="presentation-foot">Energia Viva · Simulação educativa alinhada ao ODS 7</div></div>}

    {toast && <div className="toast-message" role="status"><Check size={16} /> {toast}</div>}
  </div>;
}
