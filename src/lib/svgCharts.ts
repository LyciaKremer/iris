/**
 * Gráficos SVG simples (sem lib de canvas) — renderizados direto no
 * navegador (embutidos como markup, não rasterizados). Isso evita por
 * completo a classe de bug que a versão em .docx teve (PNG rejeitado pelo
 * Word): aqui o SVG nunca sai do contexto do navegador, que já sabe
 * renderizar SVG nativamente.
 */

export const CORES_SENTIMENTO: Record<string, string> = {
  Positivo: "#2e7d32",
  Negativo: "#c62828",
  Neutro: "#1565c0",
};

// Atributo XML válido (não uma declaração CSS solta).
const FONTE = 'font-family="Arial, Helvetica, sans-serif"';

function escapar(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncar(texto: string, limite: number): string {
  return texto.length <= limite ? texto : texto.slice(0, limite - 1) + "…";
}

/** Barras horizontais — ranking simples (temas, veículos, cidades). */
export function svgBarrasHorizontais(
  dados: { nome: string; valor: number }[],
  titulo: string,
  cor = "#455a64",
): string {
  const largura = 700;
  const alturaLinha = 28;
  const margemEsquerda = 220;
  const margemDireita = 60;
  const topo = 50;
  const altura = topo + dados.length * alturaLinha + 20;
  const maxValor = Math.max(1, ...dados.map((d) => d.valor));
  const larguraBarraMax = largura - margemEsquerda - margemDireita;

  const barras = dados
    .map((d, i) => {
      const y = topo + i * alturaLinha;
      const w = (d.valor / maxValor) * larguraBarraMax;
      return `
      <text x="${margemEsquerda - 8}" y="${y + alturaLinha / 2 + 4}" text-anchor="end" font-size="13" ${FONTE}>${escapar(truncar(d.nome, 28))}</text>
      <rect x="${margemEsquerda}" y="${y + 4}" width="${w}" height="${alturaLinha - 8}" fill="${cor}" />
      <text x="${margemEsquerda + w + 6}" y="${y + alturaLinha / 2 + 4}" font-size="12" ${FONTE}>${d.valor}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
    <rect width="${largura}" height="${altura}" fill="var(--card)" />
    <text x="${largura / 2}" y="24" text-anchor="middle" font-size="16" font-weight="bold" ${FONTE} fill="currentColor">${escapar(titulo)}</text>
    <g fill="currentColor">${barras}</g>
  </svg>`;
}

/** Barras horizontais empilhadas — sentimento por veículo, sentimento por candidato. */
export function svgBarrasEmpilhadas(
  linhas: { nome: string; partes: { rotulo: string; valor: number; cor: string }[] }[],
  titulo: string,
  eixoPercentual = false,
): string {
  const largura = 760;
  const alturaLinha = 30;
  const margemEsquerda = 220;
  const margemDireita = 60;
  const topo = 60;
  const altura = topo + linhas.length * alturaLinha + 40;
  const larguraBarraMax = largura - margemEsquerda - margemDireita;
  const maxTotal = eixoPercentual ? 100 : Math.max(1, ...linhas.map((l) => l.partes.reduce((s, p) => s + p.valor, 0)));

  const barras = linhas
    .map((linha, i) => {
      const y = topo + i * alturaLinha;
      let acumulado = 0;
      const segmentos = linha.partes
        .map((p) => {
          const w = (p.valor / maxTotal) * larguraBarraMax;
          const x = margemEsquerda + (acumulado / maxTotal) * larguraBarraMax;
          acumulado += p.valor;
          return `<rect x="${x}" y="${y + 4}" width="${w}" height="${alturaLinha - 8}" fill="${p.cor}" />`;
        })
        .join("");
      return `
      <text x="${margemEsquerda - 8}" y="${y + alturaLinha / 2 + 4}" text-anchor="end" font-size="13" ${FONTE} fill="currentColor">${escapar(truncar(linha.nome, 28))}</text>
      ${segmentos}`;
    })
    .join("");

  const legenda = linhas.length
    ? linhas[0].partes
        .map(
          (p, i) =>
            `<rect x="${margemEsquerda + i * 110}" y="${topo - 30}" width="12" height="12" fill="${p.cor}" />
             <text x="${margemEsquerda + i * 110 + 16}" y="${topo - 20}" font-size="12" ${FONTE} fill="currentColor">${escapar(p.rotulo)}</text>`,
        )
        .join("")
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
    <rect width="${largura}" height="${altura}" fill="var(--card)" />
    <text x="${largura / 2}" y="24" text-anchor="middle" font-size="16" font-weight="bold" ${FONTE} fill="currentColor">${escapar(titulo)}</text>
    ${legenda}
    ${barras}
  </svg>`;
}

/** Barras horizontais divergentes (positivo/negativo a partir do zero) —
 * saldo de sentimento por candidato (% positivo − % negativo). */
export function svgBarrasDivergentes(
  dados: { nome: string; valor: number }[],
  titulo: string,
  rotuloEixo: string,
): string {
  const largura = 700;
  const alturaLinha = 28;
  const margemEsquerda = 200;
  const margemDireita = 60;
  const topo = 50;
  const altura = topo + dados.length * alturaLinha + 40;
  const larguraGrafico = largura - margemEsquerda - margemDireita;
  const maxAbs = Math.max(1, ...dados.map((d) => Math.abs(d.valor)));
  const zeroX = margemEsquerda + larguraGrafico / 2;
  const escala = larguraGrafico / 2 / maxAbs;

  const barras = dados
    .map((d, i) => {
      const y = topo + i * alturaLinha;
      const w = Math.abs(d.valor) * escala;
      const x = d.valor >= 0 ? zeroX : zeroX - w;
      const cor = d.valor >= 0 ? "#2e7d32" : "#c62828";
      return `
      <text x="${margemEsquerda - 8}" y="${y + alturaLinha / 2 + 4}" text-anchor="end" font-size="13" ${FONTE} fill="currentColor">${escapar(truncar(d.nome, 26))}</text>
      <rect x="${x}" y="${y + 4}" width="${w}" height="${alturaLinha - 8}" fill="${cor}" />`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
    <rect width="${largura}" height="${altura}" fill="var(--card)" />
    <text x="${largura / 2}" y="24" text-anchor="middle" font-size="16" font-weight="bold" ${FONTE} fill="currentColor">${escapar(titulo)}</text>
    <line x1="${zeroX}" y1="${topo - 10}" x2="${zeroX}" y2="${topo + dados.length * alturaLinha}" stroke="currentColor" opacity="0.3" />
    ${barras}
    <text x="${largura / 2}" y="${altura - 8}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6" ${FONTE}>${escapar(rotuloEixo)}</text>
  </svg>`;
}

/** Pizza simples — volume por tipo de veículo. */
export function svgPizza(dados: { nome: string; valor: number; cor: string }[], titulo: string): string {
  const largura = 420;
  const altura = 340;
  const cx = 170;
  const cy = 190;
  const raio = 110;
  const total = dados.reduce((s, d) => s + d.valor, 0) || 1;

  let anguloAtual = -Math.PI / 2;
  const fatias = dados
    .map((d) => {
      const fracao = d.valor / total;
      const anguloFim = anguloAtual + fracao * 2 * Math.PI;
      const x1 = cx + raio * Math.cos(anguloAtual);
      const y1 = cy + raio * Math.sin(anguloAtual);
      const x2 = cx + raio * Math.cos(anguloFim);
      const y2 = cy + raio * Math.sin(anguloFim);
      const grandeArco = fracao > 0.5 ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${raio} ${raio} 0 ${grandeArco} 1 ${x2} ${y2} Z`;
      anguloAtual = anguloFim;
      return `<path d="${path}" fill="${d.cor}" stroke="var(--card)" stroke-width="1.5" />`;
    })
    .join("");

  const legenda = dados
    .map((d, i) => {
      const pct = Math.round((d.valor / total) * 100);
      const y = 30 + i * 20;
      return `<rect x="${largura - 150}" y="${y}" width="12" height="12" fill="${d.cor}" />
              <text x="${largura - 132}" y="${y + 10}" font-size="12" ${FONTE} fill="currentColor">${escapar(d.nome)} (${pct}%)</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
    <rect width="${largura}" height="${altura}" fill="var(--card)" />
    <text x="${largura / 2}" y="24" text-anchor="middle" font-size="16" font-weight="bold" ${FONTE} fill="currentColor">${escapar(titulo)}</text>
    ${fatias}
    ${legenda}
  </svg>`;
}

/** Linha do tempo — uma série por sentimento (evolução do sentimento por dia). */
export function svgLinha(
  eixoX: string[],
  series: { rotulo: string; valores: number[]; cor: string }[],
  titulo: string,
): string {
  const largura = 760;
  const altura = 340;
  const margemEsquerda = 50;
  const margemDireita = 30;
  const topo = 60;
  const base = 280;
  const larguraGrafico = largura - margemEsquerda - margemDireita;
  const maxValor = Math.max(1, ...series.flatMap((s) => s.valores));
  const passoX = eixoX.length > 1 ? larguraGrafico / (eixoX.length - 1) : 0;

  const linhas = series
    .map((serie) => {
      const pontos = serie.valores
        .map((v, i) => {
          const x = margemEsquerda + i * passoX;
          const y = base - (v / maxValor) * (base - topo);
          return `${x},${y}`;
        })
        .join(" ");
      return `<polyline points="${pontos}" fill="none" stroke="${serie.cor}" stroke-width="2.5" />`;
    })
    .join("");

  const rotulosX = eixoX
    .map((r, i) => {
      if (eixoX.length > 10 && i % Math.ceil(eixoX.length / 10) !== 0) return "";
      const x = margemEsquerda + i * passoX;
      return `<text x="${x}" y="${base + 18}" text-anchor="middle" font-size="10" ${FONTE} fill="currentColor">${escapar(r.slice(5))}</text>`;
    })
    .join("");

  const legenda = series
    .map(
      (s, i) =>
        `<rect x="${margemEsquerda + i * 100}" y="${topo - 30}" width="12" height="12" fill="${s.cor}" />
         <text x="${margemEsquerda + i * 100 + 16}" y="${topo - 20}" font-size="12" ${FONTE} fill="currentColor">${escapar(s.rotulo)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
    <rect width="${largura}" height="${altura}" fill="var(--card)" />
    <text x="${largura / 2}" y="24" text-anchor="middle" font-size="16" font-weight="bold" ${FONTE} fill="currentColor">${escapar(titulo)}</text>
    ${legenda}
    <line x1="${margemEsquerda}" y1="${base}" x2="${largura - margemDireita}" y2="${base}" stroke="currentColor" opacity="0.2" />
    ${linhas}
    ${rotulosX}
  </svg>`;
}

/** Barras verticais — volume diário, com dias de pico destacados em vermelho. */
export function svgBarrasVerticais(
  dados: { rotulo: string; valor: number; destaque?: boolean }[],
  titulo: string,
): string {
  const largura = 760;
  const altura = 340;
  const margemEsquerda = 50;
  const margemDireita = 30;
  const topo = 50;
  const base = 280;
  const larguraGrafico = largura - margemEsquerda - margemDireita;
  const maxValor = Math.max(1, ...dados.map((d) => d.valor));
  const larguraBarra = Math.max(2, larguraGrafico / dados.length - 2);

  const barras = dados
    .map((d, i) => {
      const x = margemEsquerda + i * (larguraGrafico / dados.length);
      const h = (d.valor / maxValor) * (base - topo);
      const cor = d.destaque ? "#c62828" : "currentColor";
      return `<rect x="${x}" y="${base - h}" width="${larguraBarra}" height="${h}" fill="${cor}" />`;
    })
    .join("");

  const rotulosX = dados
    .map((d, i) => {
      if (dados.length > 12 && i % Math.ceil(dados.length / 12) !== 0) return "";
      const x = margemEsquerda + i * (larguraGrafico / dados.length) + larguraBarra / 2;
      return `<text x="${x}" y="${base + 16}" text-anchor="middle" font-size="9" ${FONTE} fill="currentColor">${escapar(d.rotulo.slice(5))}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
    <rect width="${largura}" height="${altura}" fill="var(--card)" />
    <text x="${largura / 2}" y="24" text-anchor="middle" font-size="16" font-weight="bold" ${FONTE} fill="currentColor">${escapar(titulo)}</text>
    <line x1="${margemEsquerda}" y1="${base}" x2="${largura - margemDireita}" y2="${base}" stroke="currentColor" opacity="0.2" />
    ${barras}
    ${rotulosX}
  </svg>`;
}
