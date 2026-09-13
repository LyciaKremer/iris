import "server-only";
import { askClaude } from "@/lib/anthropic";

// Lista provisória — a PMJP ainda não passou a lista oficial de
// secretarias/pastas. Edite esta lista quando ela chegar; o resto do
// código não depende dos nomes exatos aqui dentro.
export const TAXONOMIA_SECRETARIAS = [
  "Educação",
  "Saúde",
  "Mobilidade e Trânsito",
  "Infraestrutura e Obras",
  "Meio Ambiente",
  "Assistência Social",
  "Cultura",
  "Turismo",
  "Segurança e Guarda Municipal",
  "Habitação",
  "Esporte e Lazer",
  "Administração e Finanças",
  "Comercial/Publicidade institucional",
  "Outro",
] as const;

// Itens classificados nesta categoria são propaganda paga da prefeitura,
// não fato jornalístico — devem ser filtrados fora dos alertas.
export const SECRETARIA_COMERCIAL = "Comercial/Publicidade institucional";

async function classificarSecretaria(texto: string): Promise<string> {
  const listaSecretarias = TAXONOMIA_SECRETARIAS.map((s) => `- ${s}`).join("\n");

  const prompt = `Você é um analista de clipping da Prefeitura Municipal de João Pessoa (PMJP). Classifique o texto abaixo usando OBRIGATORIAMENTE uma das opções da lista — nenhuma outra palavra ou categoria.

Secretarias/categorias possíveis:
${listaSecretarias}

REGRAS:
- Escolha a secretaria/área da prefeitura mais relacionada ao assunto principal do texto.
- Se o texto for um comercial pago ou publicidade institucional da prefeitura (não uma notícia/fala jornalística sobre um fato), responda "${SECRETARIA_COMERCIAL}".
- Se nenhuma opção se encaixar bem, responda "Outro".
- Responda APENAS com o nome exato da opção, copiado da lista acima. Nada mais.

Texto:
${texto}

Secretaria/categoria:`;

  return (await askClaude(prompt, 20)).trim();
}

/**
 * Porta de validar_secretaria() (secretaria.py) — sem cache interno; quem
 * chama decide se a linha já tem `secretaria` gravada.
 */
export async function validarSecretaria(texto: string): Promise<string> {
  if (!texto) return "Outro";

  let resposta: string;
  try {
    resposta = (await classificarSecretaria(texto)).trim();
  } catch (erro) {
    console.error(`[ERRO] Falha ao classificar secretaria: ${erro}`);
    resposta = "Outro";
  }

  const secretariaValida = TAXONOMIA_SECRETARIAS.find(
    (s) => s.toLowerCase() === resposta.toLowerCase(),
  );

  if (!secretariaValida) {
    console.warn(`[AVISO] Secretaria inválida retornada: '${resposta}' — usando 'Outro'.`);
    return "Outro";
  }

  return secretariaValida;
}
