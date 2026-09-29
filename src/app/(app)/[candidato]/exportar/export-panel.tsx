"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import JSZip from "jszip";
import { Send, FileArchive, Download } from "lucide-react";
import { exportarPorHorarioAction } from "@/server/actions/exportar";
import { prepararConferenciaAction } from "@/server/actions/conferencia";
import { horariosPorTipo, type Horario } from "@/lib/horarios";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Input, Select } from "@/components/ui/input";
import { hojeBR } from "@/lib/dates";

const LEGENDA_INSTITUICAO =
  "08h: madrugada (00h–08h) · 09h30: residual da noite anterior (17h–23h59 do dia anterior) · 14h: manhã (08h–14h) · 18h: tarde (14h–18h).";
const LEGENDA_PESSOA =
  "9h: Rádio (tarde/noite anterior) · 14h: Rádio (dia atual) · 14h30: Televisão (noite anterior + dia atual) · 17h: Online (dia atual).";

export function ExportPanel({ candidatoId, tipo }: { candidatoId: string; tipo: "pessoa" | "instituicao" }) {
  const horarios = horariosPorTipo(tipo);
  const [data, setData] = useState(hojeBR);
  const [horario, setHorario] = useState<Horario>(horarios[0]);
  const [mensagens, setMensagens] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingConferencia, startTransitionConferencia] = useTransition();

  function gerar() {
    setMensagens(null);
    startTransition(async () => {
      const resultado = await exportarPorHorarioAction(candidatoId, data, horario);
      if (!resultado.ok) {
        toast.error(resultado.message ?? "Falha ao exportar.");
        return;
      }
      setMensagens(resultado.mensagens ?? []);
    });
  }

  function baixarConferencia() {
    startTransitionConferencia(async () => {
      const resultado = await prepararConferenciaAction(candidatoId, data, horario);
      if (!resultado.ok) {
        toast.error(resultado.message ?? "Falha ao gerar a conferência.");
        return;
      }

      const zip = new JSZip();
      const pasta = zip.folder(`${data}/${resultado.candidatoSlug}/${horario}`)!;
      pasta.file("negativos.txt", resultado.negativos);
      pasta.file("neutros.txt", resultado.neutros);
      pasta.file("positivos.txt", resultado.positivos);
      pasta.file("resumo.txt", resultado.resumo);
      pasta.file("historico.json", JSON.stringify(resultado.historico, null, 2));

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conferencia_${data}_${resultado.candidatoSlug}_${horario}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const nomeArquivo = `mensagens_${data}_${horario}.json`;
  const comando = `python disparar_mensagens.py ${nomeArquivo}`;

  function baixar() {
    if (!mensagens) return;
    const blob = new Blob([JSON.stringify(mensagens, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm font-medium">Data do disparo</label>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1 w-auto" />
        </div>
        <div>
          <label className="block text-sm font-medium">Envio</label>
          <Select value={horario} onChange={(e) => setHorario(e.target.value as Horario)} className="mt-1 w-28">
            {horarios.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={gerar} loading={pending} disabled={!data}>
          <Send className="h-4 w-4" /> {pending ? "Gerando…" : "Gerar mensagens"}
        </Button>
        <Button onClick={baixarConferencia} loading={pendingConferencia} disabled={!data} variant="outline">
          <FileArchive className="h-4 w-4" /> {pendingConferencia ? "Gerando…" : "Baixar conferência (.zip)"}
        </Button>
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        {tipo === "instituicao" ? LEGENDA_INSTITUICAO : LEGENDA_PESSOA}
      </p>

      {mensagens && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">{mensagens.length} mensagem(ns) geradas.</p>
            <Button onClick={baixar} variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> Baixar JSON
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] p-3">
            <code className="overflow-x-auto whitespace-nowrap text-xs">{comando}</code>
            <CopyButton texto={comando}>Copiar comando</CopyButton>
          </div>

          <div className="space-y-2">
            {mensagens.map((m, i) => (
              <div key={i} className="relative">
                <pre className="whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 pr-20 text-xs">
                  {m}
                </pre>
                <CopyButton texto={m} className="absolute right-2 top-2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
