export const WORLD_LIMIT = 60;
export const ROAD_GRID = [-56, -28, 0, 28, 56];

export function groundHeight(x, z) {
  const mainSlope = (z + 56) * 0.045;
  const naturalVariation = Math.sin(x * 0.065) * Math.cos(z * 0.052) * 0.48 + Math.sin((x + z) * 0.11) * 0.14;
  const hillside = Math.max(0, z - 14) * 0.016;
  return mainSlope + naturalVariation + hillside;
}

const COLORS = ['#bf785a', '#c8a274', '#708b88', '#b96e66', '#7d8b68', '#9b8292', '#bd8e61', '#78877b', '#a58e77'];

const SPECIAL_PLOTS = {
  '0-1-0': { id: 'bakery', type: 'bakery', title: 'Padaria da Comunidade', description: 'Pequeno comércio de bairro, ponto de encontro e serviço essencial para os moradores.', impact: 'Fortalece a economia local e ajuda a manter serviços próximos das residências.', recommendation: 'Pode receber iluminação LED e um sistema fotovoltaico dimensionado para o consumo do comércio.', width: 8.5, depth: 8.5 },
  '0-2-1': { id: 'market', type: 'market', title: 'Mercadinho do Bairro', description: 'Comércio local que atende às necessidades cotidianas da comunidade.', impact: 'Gera oportunidades de trabalho e reduz deslocamentos para compras básicas.', recommendation: 'A eficiência energética de refrigeração e iluminação pode reduzir o consumo elétrico.', width: 8.8, depth: 8.6 },
  '1-1-2': { id: 'barbershop', type: 'barbershop', title: 'Barbearia da Viela', description: 'Pequeno negócio de serviços pessoais, integrado à rotina e à economia local.', impact: 'Valoriza o empreendedorismo e a circulação de renda dentro do bairro.', recommendation: 'Iluminação LED, ventilação eficiente e equipamentos de menor consumo ajudam a reduzir despesas.', width: 8.2, depth: 8.2 },
  '3-0-1': { id: 'community-shop', type: 'shop', title: 'Loja Comunitária', description: 'Pequeno estabelecimento de apoio aos moradores e trabalhadores da região.', impact: 'Reforça a oferta de serviços cotidianos em escala de proximidade.', recommendation: 'Pode adotar iluminação eficiente e avaliar a viabilidade de geração solar no telhado.', width: 8.2, depth: 8.2 },
  '2-1-0': { id: 'school', type: 'school', title: 'Escola Comunitária', description: 'Equipamento público de educação e convivência para crianças e jovens.', impact: 'Amplia o acesso à educação e pode servir como ponto de mobilização comunitária.', recommendation: 'Telhado com geração solar e iluminação eficiente podem reduzir custos de operação.', width: 10, depth: 10 },
  '2-2-1': { id: 'clinic', type: 'clinic', title: 'Unidade de Saúde', description: 'Espaço de atendimento básico e orientação à população.', impact: 'Apoia o cuidado local e serviços essenciais.', recommendation: 'Sistemas de energia de backup e eficiência podem aumentar a confiabilidade do serviço.', width: 9.5, depth: 9.5 },
  '3-2-0': { id: 'energy-hub', type: 'energy', title: 'Ponto de Energia Comunitária', description: 'Espaço demonstrativo com geração solar, armazenamento e informações sobre energia limpa.', impact: 'Mostra como soluções coletivas podem apoiar a transição energética do território.', recommendation: 'Estudar geração compartilhada, baterias para cargas essenciais e gestão comunitária.' , width: 10, depth: 10 }
};

const FULL_BLOCKS = {
  '1-0': {
    id: 'sports-court', type: 'sports', title: 'Quadra Comunitária',
    description: 'Espaço de esporte, lazer e convivência dos moradores.',
    impact: 'Promove atividades coletivas e fortalece os vínculos comunitários.',
    recommendation: 'Iluminação LED eficiente e, quando viável, luminárias solares podem ampliar o uso noturno.',
    width: 20, depth: 18
  },
  '1-3': {
    id: 'community-square', type: 'square', title: 'Praça do Encontro',
    description: 'Área pública com bancos, árvores e espaço de convivência.',
    impact: 'Oferece um espaço de descanso, encontro e atividades culturais.',
    recommendation: 'Priorizar iluminação eficiente, arborização e soluções de energia de baixo impacto.',
    width: 20, depth: 18
  }
};

export function createDistrictLayout(homes = []) {
  const houseLots = [];
  const places = [];
  const fullBlocks = [];
  let lotNumber = 0;

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x0 = ROAD_GRID[col];
      const x1 = ROAD_GRID[col + 1];
      const z0 = ROAD_GRID[row];
      const z1 = ROAD_GRID[row + 1];
      const blockKey = `${row}-${col}`;
      const fullBlock = FULL_BLOCKS[blockKey];

      if (fullBlock) {
        fullBlocks.push({
          ...fullBlock,
          x: (x0 + x1) / 2,
          z: (z0 + z1) / 2,
          width: fullBlock.width,
          depth: fullBlock.depth
        });
        continue;
      }

      // Compact rows leave narrow pedestrian passages inside each block.
      const offsets = [9.4, 18.6];
      offsets.forEach((zOffset, localRow) => {
        offsets.forEach((xOffset, localCol) => {
          const key = `${row}-${col}-${localRow * 2 + localCol}`;
          const x = x0 + xOffset;
          const z = z0 + zOffset;
          const special = SPECIAL_PLOTS[key];
          if (special) {
            places.push({ ...special, x, z });
          } else {
            const index = lotNumber;
            houseLots.push({
              id: `house-${String(index + 1).padStart(2, '0')}`,
              x,
              z,
              width: 6.7 + (index % 3) * 0.25,
              depth: 6.8 + ((index + 1) % 3) * 0.22,
              floors: 1 + (index % 4 === 0 ? 2 : index % 3 === 0 ? 1 : 0),
              color: COLORS[index % COLORS.length],
              hasDemoSolar: index % 13 === 4,
              variation: index % 7
            });
            lotNumber += 1;
          }
        });
      });
    }
  }

  houseLots.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
  const mappedHouses = houseLots.map((plot, index) => {
    const home = homes[index] || null;
    return {
      ...plot,
      home,
      homeId: home?.id || null,
      name: home?.name || `Residência ${String(index + 1).padStart(2, '0')}`,
      family: home?.family || 'Moradores da comunidade'
    };
  });

  const obstacleList = [
    ...mappedHouses.map((item) => ({ x: item.x, z: item.z, width: item.width, depth: item.depth })),
    ...places.map((item) => ({ x: item.x, z: item.z, width: item.width, depth: item.depth })),
    ...fullBlocks.map((item) => ({ x: item.x, z: item.z, width: item.width, depth: item.depth }))
  ];

  return { houses: mappedHouses, places, fullBlocks, obstacles: obstacleList };
}

export function isBlockedPosition(x, z, obstacles, radius = 0.85) {
  if (Math.abs(x) > WORLD_LIMIT - 2 || Math.abs(z) > WORLD_LIMIT - 2) return true;
  return obstacles.some((item) => (
    Math.abs(x - item.x) < item.width / 2 + radius
    && Math.abs(z - item.z) < item.depth / 2 + radius
  ));
}
