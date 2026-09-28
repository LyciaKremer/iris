import "server-only";
import sharp from "sharp";

/**
 * Rasteriza um SVG (string) em PNG — usado pra embutir os gráficos no
 * .docx, já que a lib `docx` só aceita imagem raster, não SVG.
 *
 * `.flatten()` remove o canal alfa (compõe sobre branco, o mesmo fundo que
 * cada gráfico já desenha) — nenhum gráfico precisa de transparência de
 * verdade, e PNG RGBA (o padrão do sharp ao rasterizar SVG) é uma causa
 * conhecida de "formato de imagem inválido ou incompatível" em algumas
 * versões do Word. RGB de 24 bits evita essa classe de problema.
 */
export async function svgParaPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).flatten({ background: "#ffffff" }).png().toBuffer();
}
