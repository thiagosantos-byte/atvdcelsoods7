export const MINIMUM_WAGE_2026 = 1621;
export const SOCIAL_TARIFF_LIMIT = MINIMUM_WAGE_2026 / 2;
export const DEMO_CO2_FACTOR = 0.08; // kg CO2/kWh — premissa didática, não fator oficial.

export const SOLUTIONS = [
  {
    id: 'solar', name: 'Solar fotovoltaica', short: 'Painéis no telhado', icon: 'sun',
    description: 'Gera eletricidade no próprio imóvel e reduz a energia comprada da rede.',
    generation: 210, investment: 8900, monthlyCost: 0, category: 'Geração',
    social: 'Geração distribuída; regras de conexão e compensação dependem da regulamentação aplicável.'
  },
  {
    id: 'efficiency', name: 'Eficiência energética', short: 'LED e equipamentos eficientes', icon: 'leaf',
    description: 'Troca lâmpadas e equipamentos ineficientes por opções de menor consumo.',
    consumptionFactor: 0.78, investment: 680, monthlyCost: 0, category: 'Eficiência',
    social: 'O resultado depende do perfil de uso e da potência dos equipamentos substituídos.'
  },
  {
    id: 'shared_solar', name: 'Solar compartilhada', short: 'Créditos comunitários', icon: 'community',
    description: 'Simula créditos de uma usina comunitária distribuídos entre residências.',
    credit: 85, investment: 1250, monthlyCost: 18, category: 'Geração compartilhada',
    social: 'Créditos e rateio dependem do arranjo contratual, da distribuidora e das regras do SCEE.'
  },
  {
    id: 'street_lights', name: 'Luminária solar', short: 'Iluminação pública solar', icon: 'lamp',
    description: 'Adiciona um ponto de iluminação solar autônomo à rua da comunidade.',
    generation: 9, investment: 950, monthlyCost: 0, category: 'Infraestrutura',
    social: 'A autonomia depende do dimensionamento, insolação, bateria e manutenção.'
  },
  {
    id: 'heater', name: 'Aquecedor solar', short: 'Água aquecida pelo sol', icon: 'water',
    description: 'Reduz o uso do chuveiro elétrico ao aquecer água com energia solar térmica.',
    saving: 55, investment: 1450, monthlyCost: 0, category: 'Uso térmico',
    social: 'Economia simulada; depende de clima, hábitos, volume do reservatório e instalação.'
  },
  {
    id: 'biodigester', name: 'Biodigestor', short: 'Biogás e biofertilizante', icon: 'recycle',
    description: 'Representa o aproveitamento de resíduos orgânicos para produzir biogás.',
    biogas: 42, investment: 3200, monthlyCost: 25, category: 'Biomassa',
    social: 'Produção estimada em kWh-equivalentes térmicos; não é contabilizada como eletricidade.'
  },
  {
    id: 'offgrid', name: 'Sistema solar off-grid', short: 'Painéis e bateria', icon: 'battery',
    description: 'Simula geração e armazenamento local para cargas essenciais.',
    generation: 165, storage: 5, investment: 11900, monthlyCost: 0, category: 'Autonomia',
    social: 'O dimensionamento real exige estudo de carga, autonomia, inversor, bateria e segurança.'
  }
];

export const INITIAL_HOMES = [
  { id: 'casa-01', name: 'Casa 01', family: 'Família de Ana', people: 4, income: 2600, perCapita: 650, consumption: 220, tariff: 0.92, taxesPct: 18, publicLighting: 18, otherCharges: 12, cadUnico: true, bpc: false, medicalDevice: false, installations: [] },
  { id: 'casa-02', name: 'Casa 02', family: 'Família de João', people: 3, income: 3300, perCapita: 1100, consumption: 185, tariff: 0.92, taxesPct: 18, publicLighting: 16, otherCharges: 10, cadUnico: false, bpc: false, medicalDevice: false, installations: [] },
  { id: 'casa-03', name: 'Casa 03', family: 'Família de Maria', people: 5, income: 3100, perCapita: 620, consumption: 265, tariff: 0.92, taxesPct: 18, publicLighting: 20, otherCharges: 15, cadUnico: true, bpc: false, medicalDevice: false, installations: [] },
  { id: 'casa-04', name: 'Casa 04', family: 'Família de Davi', people: 2, income: 4200, perCapita: 2100, consumption: 150, tariff: 0.92, taxesPct: 18, publicLighting: 15, otherCharges: 10, cadUnico: false, bpc: false, medicalDevice: false, installations: [] },
  { id: 'casa-05', name: 'Casa 05', family: 'Família de Lúcia', people: 4, income: 1900, perCapita: 475, consumption: 205, tariff: 0.92, taxesPct: 18, publicLighting: 18, otherCharges: 12, cadUnico: true, bpc: false, medicalDevice: false, installations: [] },
  { id: 'casa-06', name: 'Casa 06', family: 'Família de Pedro', people: 3, income: 2800, perCapita: 933, consumption: 175, tariff: 0.92, taxesPct: 18, publicLighting: 17, otherCharges: 11, cadUnico: false, bpc: false, medicalDevice: false, installations: [] }
];

export function isTariffSocialEligible(home) {
  const lowIncomeCad = home.cadUnico && home.perCapita <= SOCIAL_TARIFF_LIMIT;
  const medicalCad = home.cadUnico && home.income <= MINIMUM_WAGE_2026 * 3 && home.medicalDevice;
  return lowIncomeCad || medicalCad || home.bpc;
}

export function calculateHome(home) {
  const installed = home.installations || [];
  const has = (id) => installed.includes(id);
  let load = home.consumption;
  if (has('efficiency')) load *= 0.78;
  if (has('heater')) load = Math.max(0, load - 55);
  const solarGeneration = (has('solar') ? 210 : 0) + (has('offgrid') ? 165 : 0);
  const solarCredit = has('shared_solar') ? 85 : 0;
  const renewableUsed = Math.min(load, solarGeneration + solarCredit);
  const gridImport = Math.max(0, load - renewableUsed);
  const eligible = isTariffSocialEligible(home);
  const socialExempt = eligible ? Math.min(80, gridImport) : 0;
  const baseEnergy = home.consumption * home.tariff;
  const baseTax = baseEnergy * (home.taxesPct / 100);
  const baseBill = baseEnergy + baseTax + home.publicLighting + home.otherCharges;
  const afterEnergy = (gridImport - socialExempt) * home.tariff;
  // Tributos e cobranças fixas permanecem na estimativa; a tributação real varia por estado e distribuidora.
  const afterTax = gridImport * home.tariff * (home.taxesPct / 100);
  const monthlyOperating = installed.reduce((sum, id) => sum + (SOLUTIONS.find(s => s.id === id)?.monthlyCost || 0), 0);
  const afterBill = afterEnergy + afterTax + home.publicLighting + home.otherCharges + monthlyOperating;
  const monthlySavings = baseBill - afterBill;
  const investment = installed.reduce((sum, id) => sum + (SOLUTIONS.find(s => s.id === id)?.investment || 0), 0);
  const netSavings = Math.max(0, monthlySavings);
  const paybackMonths = investment > 0 && netSavings > 0 ? investment / netSavings : null;
  const biogas = has('biodigester') ? 42 : 0;
  const storage = has('offgrid') ? 5 : 0;
  const renewablePct = load > 0 ? Math.min(100, (renewableUsed / load) * 100) : 0;
  const co2Avoided = (Math.min(home.consumption - load, home.consumption) + renewableUsed) * DEMO_CO2_FACTOR;
  return {
    load, gridImport, solarGeneration, solarCredit, renewableUsed, renewablePct,
    eligible, socialExempt, baseBill, afterBill, monthlySavings: monthlySavings - monthlyOperating,
    annualSavings: (monthlySavings - monthlyOperating) * 12, investment,
    paybackMonths, biogas, storage, co2Avoided,
    incomeShareBefore: home.income > 0 ? (baseBill / home.income) * 100 : 0,
    incomeShareAfter: home.income > 0 ? (afterBill / home.income) * 100 : 0,
    taxes: afterTax, fixedCharges: home.publicLighting + home.otherCharges
  };
}

export function applyScenario(scenario) {
  const copy = INITIAL_HOMES.map(h => ({ ...h, installations: [] }));
  if (scenario === 'transition') {
    copy[0].installations = ['efficiency', 'solar'];
    copy[1].installations = ['efficiency'];
    copy[2].installations = ['heater'];
    copy[4].installations = ['shared_solar'];
  }
  if (scenario === 'integrated') {
    copy.forEach((h, i) => {
      h.installations = ['solar', 'efficiency'];
      if (i % 2 === 0) h.installations.push('heater');
      if (i === 1 || i === 4) h.installations.push('offgrid');
      if (i === 2 || i === 5) h.installations.push('biodigester');
      if (i === 0 || i === 3) h.installations.push('shared_solar');
      if (i === 0) h.installations.push('street_lights');
    });
  }
  return copy;
}

export function calculateCommunity(homes) {
  const results = homes.map(calculateHome);
  const totalFamilies = homes.length;
  const installedFamilies = homes.filter(h => h.installations.length > 0).length;
  const consumed = results.reduce((s, r) => s + r.load, 0);
  const generation = results.reduce((s, r) => s + r.solarGeneration + r.solarCredit, 0);
  const renewableUsed = results.reduce((s, r) => s + r.renewableUsed, 0);
  const grid = results.reduce((s, r) => s + r.gridImport, 0);
  const savings = results.reduce((s, r) => s + r.monthlySavings, 0);
  const investment = results.reduce((s, r) => s + r.investment, 0);
  const co2 = results.reduce((s, r) => s + r.co2Avoided, 0);
  const eligible = homes.filter(h => calculateHome(h).eligible).length;
  const lamps = homes.filter(h => h.installations.includes('street_lights')).length * 4;
  const biogas = results.reduce((s, r) => s + r.biogas, 0);
  const stored = results.reduce((s, r) => s + r.storage, 0);
  const beneficiaries = homes.filter((h, i) => h.installations.length > 0 || results[i].eligible).length;
  return {
    totalFamilies, installedFamilies, consumed, generation: generation + lamps * 9,
    grid, savings, investment, co2, eligible, lamps, biogas, stored, beneficiaries,
    renewablePct: consumed > 0 ? Math.min(100, (renewableUsed / consumed) * 100) : 0,
    billBefore: results.reduce((s, r) => s + r.baseBill, 0),
    billAfter: results.reduce((s, r) => s + r.afterBill, 0), results
  };
}
