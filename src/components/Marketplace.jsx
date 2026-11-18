import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, Building2, CheckCircle2,
  ClipboardList, Download, Factory, FileText, Handshake, Home, Info,
  Leaf, Plus, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Users,
  Wallet, Zap
} from 'lucide-react';

const MIN_WAGE_2026 = 1621;
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const fmt = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(value) || 0);
const today = new Date().toLocaleDateString('pt-BR');

const INITIAL_FAMILIES = [
  { id: 'FAM-001', name: 'Família Oliveira', city: 'Salvador', distributor: 'Neoenergia Coelba', income: 4200, people: 2, bill: 390, consumption: 420, tariffSocial: false, socialDiscount: false, pendingPublicBenefit: false, consumerUnit: 'UC-DEMO-001', formalMember: true, active: true },
  { id: 'FAM-002', name: 'Família Santos', city: 'Salvador', distributor: 'Neoenergia Coelba', income: 5100, people: 2, bill: 470, consumption: 510, tariffSocial: false, socialDiscount: false, pendingPublicBenefit: false, consumerUnit: 'UC-DEMO-002', formalMember: true, active: true },
  { id: 'FAM-003', name: 'Família Almeida', city: 'Lauro de Freitas', distributor: 'Neoenergia Coelba', income: 3600, people: 2, bill: 330, consumption: 360, tariffSocial: false, socialDiscount: false, pendingPublicBenefit: false, consumerUnit: 'UC-DEMO-003', formalMember: false, active: true },
  { id: 'FAM-004', name: 'Família Costa', city: 'Salvador', distributor: 'Neoenergia Coelba', income: 2900, people: 2, bill: 260, consumption: 280, tariffSocial: true, socialDiscount: false, pendingPublicBenefit: false, consumerUnit: 'UC-DEMO-004', formalMember: true, active: true },
];
const INITIAL_PLANTS = [
  { id: 'USI-001', name: 'Usina Solar Horizonte', city: 'Salvador', distributor: 'Neoenergia Coelba', surplus: 1800, entity: 'Associação Energia Viva', sponsor: 'Instituto Horizonte', active: true }
];
const INITIAL_SPONSORS = [
  { id: 'PAT-001', name: 'Instituto Horizonte', type: 'Instituto', contribution: 50000, support: 'Apoio à estrutura coletiva', active: true }
];

function readSaved(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function Stat({ icon: Icon, label, value, note }) {
  return <article className="mk-stat"><span className="mk-stat-icon"><Icon size={17} /></span><small>{label}</small><strong>{value}</strong><em>{note}</em></article>;
}

function LabelField({ label, children, hint }) {
  return <label className="mk-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function Marketplace() {
  const [families, setFamilies] = useState(() => readSaved('energia-viva-market-families', INITIAL_FAMILIES));
  const [plants, setPlants] = useState(() => readSaved('energia-viva-market-plants', INITIAL_PLANTS));
  const [sponsors, setSponsors] = useState(() => readSaved('energia-viva-market-sponsors', INITIAL_SPONSORS));
  const [allocations, setAllocations] = useState(() => readSaved('energia-viva-market-allocations', []));
  const [cycles, setCycles] = useState(() => readSaved('energia-viva-market-cycles', []));
  const [activeTab, setActiveTab] = useState('visao');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [familyForm, setFamilyForm] = useState({ name: '', city: 'Salvador', distributor: 'Neoenergia Coelba', income: '4200', people: '2', bill: '390', consumption: '420', consumerUnit: '', tariffSocial: false, socialDiscount: false, pendingPublicBenefit: false, formalMember: false });
  const [plantForm, setPlantForm] = useState({ name: '', city: 'Salvador', distributor: 'Neoenergia Coelba', surplus: '1500', entity: '', sponsor: '' });
  const [sponsorForm, setSponsorForm] = useState({ name: '', type: 'Empresa', contribution: '10000', support: 'Patrocínio institucional' });
  const [cycleForm, setCycleForm] = useState({ familyId: '', reference: new Date().toISOString().slice(0, 7), kwh: '100', before: '400', after: '300' });
  const [selectedPlant, setSelectedPlant] = useState('USI-001');

  useEffect(() => localStorage.setItem('energia-viva-market-families', JSON.stringify(families)), [families]);
  useEffect(() => localStorage.setItem('energia-viva-market-plants', JSON.stringify(plants)), [plants]);
  useEffect(() => localStorage.setItem('energia-viva-market-sponsors', JSON.stringify(sponsors)), [sponsors]);
  useEffect(() => localStorage.setItem('energia-viva-market-allocations', JSON.stringify(allocations)), [allocations]);
  useEffect(() => localStorage.setItem('energia-viva-market-cycles', JSON.stringify(cycles)), [cycles]);

  const plant = plants.find(item => item.id === selectedPlant) || plants[0];
  const eligibleFamilies = useMemo(() => families.map(family => {
    const perCapita = Number(family.income) / Math.max(1, Number(family.people));
    const burden = Number(family.bill) / Math.max(1, Number(family.income)) * 100;
    const incomeOk = perCapita > MIN_WAGE_2026 && perCapita <= MIN_WAGE_2026 * 2;
    const noPublicBenefit = !family.tariffSocial && !family.socialDiscount && !family.pendingPublicBenefit;
    const socialNeed = burden >= 8;
    const sameDistributor = Boolean(plant) && plant.distributor !== 'Outra / validar' && family.distributor !== 'Outra / validar' && family.distributor === plant.distributor;
    const memberOk = family.formalMember === true;
    const eligible = Boolean(family.active && family.consumerUnit && incomeOk && noPublicBenefit && socialNeed && sameDistributor && memberOk);
    const reason = !family.active ? 'Cadastro inativo' : !family.consumerUnit ? 'Unidade consumidora pendente' : !incomeOk ? 'Fora da faixa de renda proposta' : !noPublicBenefit ? 'Verificar benefício público' : !socialNeed ? 'Comprometimento abaixo de 8%' : !sameDistributor ? 'Distribuidora incompatível' : !memberOk ? 'Adesão formal pendente' : 'Apta para proposta';
    return { ...family, perCapita, burden, incomeOk, noPublicBenefit, socialNeed, sameDistributor, memberOk, eligible, reason };
  }), [families, plant]);
  const matchingFamilies = eligibleFamilies.filter(f => f.eligible).sort((a, b) => b.burden - a.burden);
  const totalSurplus = plants.reduce((sum, item) => sum + (Number(item.surplus) || 0), 0);
  const allocatedKwh = allocations.reduce((sum, item) => sum + (Number(item.kwh) || 0), 0);
  const averageSaving = allocations.length ? allocations.reduce((sum, item) => sum + item.estimatedSaving, 0) / allocations.length : 0;
  const confirmedKwh = cycles.reduce((sum, item) => sum + Number(item.kwh || 0), 0);
  const confirmedSavings = cycles.reduce((sum, item) => sum + Number(item.saving || 0), 0);
  const activeFamilies = families.filter(f => f.active).length;
  const filteredFamilies = eligibleFamilies.filter(f => `${f.name} ${f.city} ${f.consumerUnit}`.toLowerCase().includes(query.toLowerCase()));

  const setFamily = (key, value) => setFamilyForm(current => ({ ...current, [key]: value }));
  const setPlant = (key, value) => setPlantForm(current => ({ ...current, [key]: value }));
  const setSponsor = (key, value) => setSponsorForm(current => ({ ...current, [key]: value }));
  const setCycle = (key, value) => setCycleForm(current => ({ ...current, [key]: value }));

  function addFamily(event) {
    event.preventDefault();
    if (!familyForm.name.trim() || !familyForm.consumerUnit.trim()) { setNotice('Informe o nome e a unidade consumidora para continuar.'); return; }
    const entry = { ...familyForm, id: `FAM-${String(Date.now()).slice(-6)}`, income: Number(familyForm.income), people: Number(familyForm.people), bill: Number(familyForm.bill), consumption: Number(familyForm.consumption), active: true };
    setFamilies(current => [entry, ...current]);
    setFamilyForm({ name: '', city: 'Salvador', distributor: plant?.distributor || 'Neoenergia Coelba', income: '4200', people: '2', bill: '390', consumption: '420', consumerUnit: '', tariffSocial: false, socialDiscount: false, pendingPublicBenefit: false, formalMember: false });
    setNotice('Família cadastrada. A elegibilidade foi recalculada com os critérios do piloto.');
    setActiveTab('familias');
  }

  function addPlant(event) {
    event.preventDefault();
    if (!plantForm.name.trim() || !plantForm.entity.trim()) { setNotice('Informe o nome da usina e a entidade de geração compartilhada.'); return; }
    const entry = { ...plantForm, id: `USI-${String(Date.now()).slice(-6)}`, surplus: Number(plantForm.surplus), active: true };
    setPlants(current => [entry, ...current]);
    setSelectedPlant(entry.id);
    setPlantForm({ name: '', city: 'Salvador', distributor: 'Neoenergia Coelba', surplus: '1500', entity: '', sponsor: '' });
    setNotice('Usina adicionada ao ambiente de simulação.');
  }

  function addSponsor(event) {
    event.preventDefault();
    if (!sponsorForm.name.trim()) { setNotice('Informe o nome da empresa ou instituição patrocinadora.'); return; }
    setSponsors(current => [{ ...sponsorForm, id: `PAT-${String(Date.now()).slice(-6)}`, contribution: Number(sponsorForm.contribution), active: true }, ...current]);
    setSponsorForm({ name: '', type: 'Empresa', contribution: '10000', support: 'Patrocínio institucional' });
    setNotice('Patrocinador registrado no painel demonstrativo.');
  }

  function runMatching() {
    if (!plant) { setNotice('Cadastre uma usina antes de calcular o rateio.'); return; }
    const available = Number(plant.surplus) || 0;
    const eligible = matchingFamilies;
    if (!eligible.length) { setAllocations([]); setNotice('Nenhuma família atende simultaneamente aos critérios sociais e regulatórios simulados.'); return; }
    const totalDemand = eligible.reduce((sum, f) => sum + Math.max(0, Number(f.bill) / 0.85), 0);
    let remaining = available;
    const proposed = eligible.map(f => {
      const estimatedDemand = Math.max(0, Number(f.consumption) || 0);
      const proportional = totalDemand > 0 ? available * estimatedDemand / totalDemand : 0;
      const kwh = Math.min(estimatedDemand, proportional, remaining);
      remaining -= kwh;
      return { id: `ALT-${f.id}`, familyId: f.id, family: f.name, consumerUnit: f.consumerUnit, distributor: f.distributor, kwh: Math.floor(kwh), burden: f.burden, estimatedSaving: Math.floor(kwh * 0.65), status: 'Proposta simulada', date: today, plant: plant.name };
    }).filter(item => item.kwh > 0);
    setAllocations(proposed);
    setNotice(`${proposed.length} proposta(s) de rateio calculada(s). Nenhum crédito foi enviado à distribuidora.`);
    setActiveTab('rateio');
  }

  function addCycle(event) {
    event.preventDefault();
    const family = families.find(item => item.id === cycleForm.familyId);
    if (!family) { setNotice('Cadastre ou selecione uma família antes de registrar a conferência.'); return; }
    const before = Number(cycleForm.before); const after = Number(cycleForm.after);
    const entry = { id: `CIC-${String(Date.now()).slice(-6)}`, familyId: family.id, family: family.name, reference: cycleForm.reference, kwh: Number(cycleForm.kwh), before, after, saving: before - after, recordedAt: new Date().toISOString(), nature: 'Conferência manual demonstrativa' };
    setCycles(current => [entry, ...current]);
    setNotice('Conferência registrada no histórico local. Use somente valores verificados na fatura.');
  }

  function exportData() {
    const payload = { produto: 'Energia Viva — Marketplace de Energia Social', natureza: 'Demonstração acadêmica; não representa alocação real de créditos.', geradoEm: new Date().toISOString(), familias: families, usinas: plants, patrocinadores: sponsors, propostasDeRateio: allocations, conferenciasDeFatura: cycles }; 
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'energia-viva-marketplace-demonstracao.json'; anchor.click(); URL.revokeObjectURL(url);
    setNotice('Relatório demonstrativo exportado.');
  }

  const nav = [
    ['visao', 'Visão geral', Activity], ['familias', 'Famílias', Users], ['usinas', 'Usinas e parceiros', Factory], ['rateio', 'Compatibilidade e rateio', SlidersHorizontal], ['impacto', 'Faturas e impacto', FileText]
  ];

  return <section className="marketplace-view">
    <div className="mk-hero">
      <div><span className="mk-kicker"><Zap size={13} /> MARKETPLACE DE ENERGIA SOCIAL · ODS 7</span><h2>Energia renovável com <em>destinação social.</em></h2><p>Conecte geração compartilhada, patrocinadores e famílias com pressão no orçamento causada pela conta de luz.</p><div className="mk-hero-tags"><span><ShieldCheck size={13} /> Triagem social</span><span><Handshake size={13} /> Geração compartilhada</span><span><Leaf size={13} /> Impacto mensurável</span></div></div>
      <div className="mk-hero-mark"><Zap size={34} /><b>ENERGIA<br/>VIVA</b><small>MARKETPLACE · PILOTO</small></div>
    </div>

    <div className="mk-notice"><AlertTriangle size={17} /><div><b>Ambiente demonstrativo</b><span>Cadastros, compatibilidade, rateio e economia são simulações locais. Não há transferência de créditos nem integração com a distribuidora. A operação real depende de validação jurídica, adesão formal ao SCEE e procedimentos da distribuidora.</span></div></div>

    <div className="mk-stats">
      <Stat icon={Users} label="Famílias cadastradas" value={activeFamilies} note="registros ativos no piloto" />
      <Stat icon={BadgeCheck} label="Elegíveis nesta usina" value={matchingFamilies.length} note="após filtros sociais e regulatórios" />
      <Stat icon={SunIcon} label="Excedente disponível" value={`${fmt(totalSurplus)} kWh`} note="informado nas usinas demonstrativas" />
      <Stat icon={Wallet} label="Economia conferida" value={money(confirmedSavings)} note="soma dos registros manuais" />
    </div>

    <div className="mk-workspace">
      <aside className="mk-sidebar" aria-label="Seções do marketplace"><span className="mk-side-label">GESTÃO DO MARKETPLACE</span>{nav.map(([id, label, Icon]) => <button type="button" key={id} className={activeTab === id ? 'active' : ''} aria-pressed={activeTab === id} onClick={() => setActiveTab(id)}><Icon size={16}/>{label}<ArrowRight size={13}/></button>)}<div className="mk-side-foot"><Info size={14}/><span>O sistema organiza informações e propostas. A entidade coletiva e a distribuidora continuam responsáveis pelos procedimentos oficiais.</span></div></aside>
      <div className="mk-content">
        {activeTab === 'visao' && <>
          <div className="mk-section-head"><div><span className="mk-overline">CENTRAL DE OPERAÇÕES</span><h3>Resumo do piloto</h3><p>Visão consolidada dos participantes e dos recursos cadastrados.</p></div><button className="mk-button secondary" onClick={exportData}><Download size={15}/> Exportar dados</button></div>
          <div className="mk-two-col">
            <article className="mk-card"><div className="mk-card-head"><div><span className="mk-overline">PÚBLICO PRIORITÁRIO</span><h4>Critério de elegibilidade</h4></div><Users size={18}/></div><div className="mk-rule-list"><div><CheckCircle2 size={15}/><span>Renda per capita acima de 1 e até 2 salários mínimos de 2026.</span></div><div><CheckCircle2 size={15}/><span>Sem Tarifa Social ou Desconto Social ativo e sem análise pública pendente.</span></div><div><CheckCircle2 size={15}/><span>Conta de energia igual ou superior a 8% da renda familiar.</span></div><div><CheckCircle2 size={15}/><span>Unidade consumidora ativa, mesma distribuidora e adesão formal à entidade.</span></div></div><small className="mk-footnote">Os 8% são parâmetro proposto, não regra oficial. O consumo médio deve refletir os últimos 3 a 6 ciclos; a faixa de renda não cria benefício público.</small></article>
            <article className="mk-card"><div className="mk-card-head"><div><span className="mk-overline">FLUXO DO PROCESSO</span><h4>Da adesão ao impacto</h4></div><ClipboardList size={18}/></div><div className="mk-flow"><div><i>01</i><span><b>Cadastro e triagem</b><small>Dados mínimos, renda e fatura</small></span></div><div><i>02</i><span><b>Validação de compatibilidade</b><small>Distribuidora e vínculo coletivo</small></span></div><div><i>03</i><span><b>Proposta de rateio</b><small>Consumo histórico e excedente</small></span></div><div><i>04</i><span><b>Conferência de fatura</b><small>Economia efetivamente observada</small></span></div></div></article>
          </div>
          <div className="mk-card mk-table-card"><div className="mk-card-head"><div><span className="mk-overline">ÚLTIMAS PROPOSTAS</span><h4>Alocações simuladas</h4></div><button className="mk-link" onClick={() => setActiveTab('rateio')}>Abrir rateio <ArrowRight size={14}/></button></div>{allocations.length ? <AllocationTable allocations={allocations.slice(0, 4)}/> : <div className="mk-empty"><Zap size={20}/><b>Nenhuma proposta calculada</b><span>Selecione uma usina e execute o motor de compatibilidade para gerar propostas de alocação.</span><button className="mk-button" onClick={() => setActiveTab('rateio')}>Ir para compatibilidade</button></div>}</div>
        </>}

        {activeTab === 'familias' && <>
          <div className="mk-section-head"><div><span className="mk-overline">PORTAL DA FAMÍLIA</span><h3>Cadastro e elegibilidade</h3><p>Registre famílias e acompanhe os motivos de aprovação ou pendência.</p></div><button className="mk-button" onClick={() => setActiveTab('novo-cadastro')}><Plus size={15}/> Novo cadastro</button></div>
          <div className="mk-card"><div className="mk-toolbar"><label className="mk-search"><Search size={15}/><input aria-label="Buscar família, cidade ou unidade consumidora" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar família, cidade ou unidade consumidora"/></label><span className="mk-count" aria-live="polite">{filteredFamilies.length} registros</span></div><div className="mk-family-list">{filteredFamilies.map(f => <article className="mk-family-row" key={f.id}><div className="mk-avatar"><Home size={17}/></div><div className="mk-family-main"><b>{f.name}</b><small>{f.city} · {f.consumerUnit} · {f.distributor}</small><div className="mk-family-tags"><span>Renda per capita: {money(f.perCapita)}</span><span>Consumo médio: {fmt(f.consumption)} kWh</span><span>Conta/renda: {f.burden.toFixed(1).replace('.', ',')}%</span></div></div><div className="mk-family-status"><b className={f.eligible ? 'ok' : 'pending'}>{f.eligible ? 'APTA' : 'PENDENTE'}</b><small>{f.reason}</small></div></article>)}</div></div>
          {activeTab === 'novo-cadastro' && null}
        </>}

        {activeTab === 'novo-cadastro' && <>
          <div className="mk-section-head"><div><span className="mk-overline">NOVO PARTICIPANTE</span><h3>Cadastrar família</h3><p>Preencha somente os dados necessários à triagem inicial.</p></div><button className="mk-button secondary" onClick={() => setActiveTab('familias')}>Voltar para famílias</button></div>
          <form className="mk-card mk-form" onSubmit={addFamily}>
            <div className="mk-form-grid"><LabelField label="Nome de referência"><input required value={familyForm.name} onChange={e => setFamily('name', e.target.value)} placeholder="Ex.: Família Silva"/></LabelField><LabelField label="Unidade consumidora (código)" hint="Não informe senha ou dados bancários."><input required value={familyForm.consumerUnit} onChange={e => setFamily('consumerUnit', e.target.value)} placeholder="Código da UC"/></LabelField><LabelField label="Município"><input value={familyForm.city} onChange={e => setFamily('city', e.target.value)}/></LabelField><LabelField label="Distribuidora"><select value={familyForm.distributor} onChange={e => setFamily('distributor', e.target.value)}><option>Neoenergia Coelba</option><option>Equatorial Bahia</option><option>Outra / validar</option></select></LabelField><LabelField label="Renda familiar mensal (R$)"><input required type="number" min="0" value={familyForm.income} onChange={e => setFamily('income', e.target.value)}/></LabelField><LabelField label="Número de moradores"><input required type="number" min="1" max="30" value={familyForm.people} onChange={e => setFamily('people', e.target.value)}/></LabelField><LabelField label="Valor médio da conta (R$)"><input required type="number" min="0" value={familyForm.bill} onChange={e => setFamily('bill', e.target.value)}/></LabelField><LabelField label="Consumo médio (kWh/mês)" hint="Média informada a partir dos últimos 3 a 6 ciclos."><input required type="number" min="0" value={familyForm.consumption} onChange={e => setFamily('consumption', e.target.value)}/></LabelField></div>
            <div className="mk-check-grid"><label><input type="checkbox" checked={familyForm.tariffSocial} onChange={e => setFamily('tariffSocial', e.target.checked)}/> Recebe Tarifa Social</label><label><input type="checkbox" checked={familyForm.socialDiscount} onChange={e => setFamily('socialDiscount', e.target.checked)}/> Recebe Desconto Social</label><label><input type="checkbox" checked={familyForm.pendingPublicBenefit} onChange={e => setFamily('pendingPublicBenefit', e.target.checked)}/> Possível direito a benefício público pendente</label><label><input type="checkbox" checked={familyForm.formalMember} onChange={e => setFamily('formalMember', e.target.checked)}/> Adesão formal à entidade coletiva confirmada</label></div>
            <div className="mk-form-foot"><span><Info size={14}/> Marque adesão formal somente após documentação efetiva. O cadastro não substitui análise oficial.</span><button className="mk-button" type="submit"><Plus size={15}/> Salvar família</button></div>
          </form>
        </>}

        {activeTab === 'usinas' && <>
          <div className="mk-section-head"><div><span className="mk-overline">EMPRESAS E GERAÇÃO RENOVÁVEL</span><h3>Usinas e patrocinadores</h3><p>Cadastre a unidade geradora, entidade coletiva e apoio institucional.</p></div><span className="mk-chip"><Factory size={13}/> {plants.length} usina(s)</span></div>
          <div className="mk-two-col">
            <form className="mk-card mk-form" onSubmit={addPlant}><div className="mk-card-head"><div><span className="mk-overline">GERAÇÃO DISTRIBUÍDA</span><h4>Adicionar usina</h4></div><SunIcon size={18}/></div><LabelField label="Nome da usina"><input required value={plantForm.name} onChange={e => setPlant('name', e.target.value)} placeholder="Nome da unidade geradora"/></LabelField><div className="mk-form-grid"><LabelField label="Município"><input value={plantForm.city} onChange={e => setPlant('city', e.target.value)}/></LabelField><LabelField label="Distribuidora"><select value={plantForm.distributor} onChange={e => setPlant('distributor', e.target.value)}><option>Neoenergia Coelba</option><option>Equatorial Bahia</option><option>Outra / validar</option></select></LabelField><LabelField label="Excedente mensal estimado (kWh)"><input type="number" min="0" value={plantForm.surplus} onChange={e => setPlant('surplus', e.target.value)}/></LabelField><LabelField label="Entidade de geração compartilhada"><input required value={plantForm.entity} onChange={e => setPlant('entity', e.target.value)} placeholder="Associação, cooperativa ou consórcio"/></LabelField></div><LabelField label="Patrocinador relacionado"><select value={plantForm.sponsor} onChange={e => setPlant('sponsor', e.target.value)}><option value="">Não informado</option>{sponsors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></LabelField><button className="mk-button" type="submit"><Plus size={15}/> Adicionar usina</button></form>
            <form className="mk-card mk-form" onSubmit={addSponsor}><div className="mk-card-head"><div><span className="mk-overline">APOIO INSTITUCIONAL</span><h4>Cadastrar patrocinador</h4></div><Handshake size={18}/></div><LabelField label="Empresa ou instituição"><input required value={sponsorForm.name} onChange={e => setSponsor('name', e.target.value)} placeholder="Nome da organização"/></LabelField><div className="mk-form-grid"><LabelField label="Tipo"><select value={sponsorForm.type} onChange={e => setSponsor('type', e.target.value)}><option>Empresa</option><option>Instituto</option><option>Fundação</option><option>Organização social</option></select></LabelField><LabelField label="Apoio previsto (R$)"><input type="number" min="0" value={sponsorForm.contribution} onChange={e => setSponsor('contribution', e.target.value)}/></LabelField></div><LabelField label="Natureza do apoio"><select value={sponsorForm.support} onChange={e => setSponsor('support', e.target.value)}><option>Patrocínio institucional</option><option>Doação de recursos</option><option>Disponibilização de ativo</option><option>Fundo de impacto / edital</option></select></LabelField><button className="mk-button" type="submit"><Plus size={15}/> Registrar patrocinador</button><small className="mk-footnote">O apoio não deve ser precificado por kWh nem gerar contraprestação pela alocação de créditos.</small></form>
          </div>
          <div className="mk-card mk-table-card"><div className="mk-card-head"><div><span className="mk-overline">ATIVOS CADASTRADOS</span><h4>Unidades geradoras</h4></div></div><div className="mk-plant-list">{plants.map(p => <button key={p.id} className={`mk-plant-row ${selectedPlant === p.id ? 'selected' : ''}`} onClick={() => setSelectedPlant(p.id)}><span className="mk-avatar solar"><SunIcon size={17}/></span><span><b>{p.name}</b><small>{p.city} · {p.distributor} · {p.entity}</small></span><strong>{fmt(p.surplus)} kWh<small>excedente/mês</small></strong></button>)}</div></div>
          <div className="mk-card mk-table-card"><div className="mk-card-head"><div><span className="mk-overline">REDE DE PARCEIROS</span><h4>Patrocinadores</h4></div></div>{sponsors.length ? sponsors.map(s => <div className="mk-sponsor-row" key={s.id}><span className="mk-avatar"><Building2 size={17}/></span><span><b>{s.name}</b><small>{s.type} · {s.support}</small></span><strong>{money(s.contribution)}</strong></div>) : <div className="mk-empty">Nenhum patrocinador cadastrado.</div>}</div>
        </>}

        {activeTab === 'impacto' && <>
          <div className="mk-section-head"><div><span className="mk-overline">PAINEL DE IMPACTO</span><h3>Faturas e economia observada</h3><p>Registre a conferência manual das faturas para construir uma linha de base de impacto.</p></div><button className="mk-button secondary" onClick={exportData}><Download size={14}/> Exportar histórico</button></div>
          <div className="mk-stats mk-impact-stats"><Stat icon={Zap} label="Energia conferida" value={`${fmt(confirmedKwh)} kWh`} note="informação lançada manualmente"/><Stat icon={Wallet} label="Economia registrada" value={money(confirmedSavings)} note="diferença entre faturas comparáveis"/><Stat icon={Users} label="Ciclos registrados" value={cycles.length} note="conferências no histórico local"/><Stat icon={Activity} label="Famílias com histórico" value={new Set(cycles.map(c => c.familyId)).size} note="participantes com ao menos um registro"/></div>
          <form className="mk-card mk-form" onSubmit={addCycle}><div className="mk-card-head"><div><span className="mk-overline">CONFERÊNCIA MANUAL</span><h4>Registrar ciclo de faturamento</h4></div><FileText size={18}/></div><div className="mk-form-grid"><LabelField label="Família"><select required value={cycleForm.familyId} onChange={e => setCycle('familyId', e.target.value)}><option value="">Selecione uma família</option>{families.map(f => <option key={f.id} value={f.id}>{f.name} · {f.consumerUnit}</option>)}</select></LabelField><LabelField label="Mês de referência"><input type="month" required value={cycleForm.reference} onChange={e => setCycle('reference', e.target.value)}/></LabelField><LabelField label="Energia compensada conferida (kWh)"><input type="number" min="0" required value={cycleForm.kwh} onChange={e => setCycle('kwh', e.target.value)}/></LabelField><LabelField label="Valor comparável antes (R$)"><input type="number" min="0" step="0.01" required value={cycleForm.before} onChange={e => setCycle('before', e.target.value)}/></LabelField><LabelField label="Valor depois da compensação (R$)"><input type="number" min="0" step="0.01" required value={cycleForm.after} onChange={e => setCycle('after', e.target.value)}/></LabelField></div><div className="mk-form-foot"><span><Info size={14}/> A diferença é apenas uma referência. Para medir impacto, compare faturas equivalentes e considere consumo, tarifas, tributos e itens não compensáveis.</span><button className="mk-button" type="submit"><Plus size={15}/> Registrar conferência</button></div></form>
          <div className="mk-card mk-table-card"><div className="mk-card-head"><div><span className="mk-overline">HISTÓRICO</span><h4>Ciclos de faturamento</h4></div><span className="mk-count">{cycles.length} registro(s)</span></div>{cycles.length ? <div className="mk-table-scroll"><table className="mk-table"><thead><tr><th>Referência</th><th>Família</th><th>Energia conferida</th><th>Antes</th><th>Depois</th><th>Diferença</th></tr></thead><tbody>{cycles.map(c => <tr key={c.id}><td>{c.reference}</td><td><b>{c.family}</b></td><td>{fmt(c.kwh)} kWh</td><td>{money(c.before)}</td><td>{money(c.after)}</td><td><b>{money(c.saving)}</b></td></tr>)}</tbody></table></div> : <div className="mk-empty"><FileText size={20}/><b>Nenhuma fatura conferida</b><span>O sistema não acessa a distribuidora. Registre somente dados que tenham sido verificados na fatura.</span></div>}</div>
          <small className="mk-footnote">Os dados são armazenados apenas neste navegador. A comprovação oficial exige faturas, dados da distribuidora, metodologia de comparação e auditoria dos ciclos; não trate uma estimativa como medição direta de emissões evitadas ou de economia garantida.</small>
        </>}

        {activeTab === 'rateio' && <>
          <div className="mk-section-head"><div><span className="mk-overline">MOTOR DE COMPATIBILIDADE</span><h3>Compatibilidade e rateio</h3><p>Filtre a mesma distribuidora, adesão coletiva, critérios sociais e consumo médio dos últimos ciclos antes de simular uma proposta.</p></div></div>
          <div className="mk-card mk-match-control"><div className="mk-match-select"><LabelField label="Usina de referência"><select value={selectedPlant || ''} onChange={e => setSelectedPlant(e.target.value)}>{plants.map(p => <option key={p.id} value={p.id}>{p.name} · {p.distributor}</option>)}</select></LabelField><div className="mk-surplus"><small>Excedente informado</small><b>{fmt(plant?.surplus || 0)} kWh/mês</b></div></div><div className="mk-match-filters"><span><CheckCircle2 size={14}/> Mesma distribuidora</span><span><CheckCircle2 size={14}/> Adesão formal</span><span><CheckCircle2 size={14}/> Faixa de renda e triagem</span><span><CheckCircle2 size={14}/> Conta/renda ≥ 8%</span></div><button className="mk-button" onClick={runMatching}><RefreshCw size={15}/> Calcular proposta de rateio</button></div>
          <div className="mk-card mk-table-card"><div className="mk-card-head"><div><span className="mk-overline">RESULTADO DA TRIAGEM</span><h4>Famílias e compatibilidade</h4></div><span className="mk-count">{matchingFamilies.length} apta(s) · {eligibleFamilies.length - matchingFamilies.length} pendente(s)</span></div><div className="mk-compat-list">{eligibleFamilies.map(f => <div key={f.id} className="mk-compat-row"><span className={`mk-compat-icon ${f.eligible ? 'ok' : ''}`}>{f.eligible ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}</span><span><b>{f.name}</b><small>{f.distributor} · {f.consumerUnit}</small></span><em>{f.reason}</em><strong>{f.burden.toFixed(1).replace('.', ',')}%</strong></div>)}</div></div>
          <div className="mk-card mk-table-card"><div className="mk-card-head"><div><span className="mk-overline">PROPOSTA DE ALOCAÇÃO</span><h4>Resultado do rateio simulado</h4></div><span className="mk-count">{fmt(allocatedKwh)} kWh propostos</span></div>{allocations.length ? <AllocationTable allocations={allocations}/> : <div className="mk-empty"><SlidersHorizontal size={20}/><b>Rateio ainda não calculado</b><span>O cálculo usa o excedente informado e o consumo médio registrado para cada família, com limite de alocação pela demanda estimada.</span></div>}<small className="mk-footnote">A estimativa de economia usa R$ 0,65/kWh apenas como premissa ilustrativa editável no código. O valor efetivo depende da tarifa, componentes não compensáveis, regras de transição e fatura da distribuidora.</small></div>
        </>}
      </div>
    </div>
    <div className="mk-legal-foot"><ShieldCheck size={15}/><p><b>Governança e conformidade:</b> antes do piloto real, validar a estrutura de geração compartilhada conforme Lei nº 14.300/2022, mesma área de concessão/distribuidora, contratos, regras da ANEEL, política LGPD, remuneração administrativa e procedimentos da distribuidora. O marketplace não compra, vende ou transfere livremente créditos entre CPFs e CNPJs.</p></div>
    {notice && <div className="mk-toast" role="status"><CheckCircle2 size={15}/>{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso">×</button></div>}
  </section>;
}

function SunIcon({ size = 17 }) { return <span className="mk-sun-icon"><Zap size={size}/></span>; }

function AllocationTable({ allocations }) {
  return <div className="mk-table-scroll"><table className="mk-table"><thead><tr><th>Família</th><th>Unidade consumidora</th><th>Alocação sugerida</th><th>Economia estimada</th><th>Status</th></tr></thead><tbody>{allocations.map(item => <tr key={item.id}><td><b>{item.family}</b><small>{item.plant}</small></td><td>{item.consumerUnit}</td><td>{fmt(item.kwh)} kWh</td><td>{money(item.estimatedSaving)}/mês</td><td><span className="mk-status-demo">{item.status}</span></td></tr>)}</tbody></table></div>;
}
