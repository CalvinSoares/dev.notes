import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, FileUp, RefreshCw, ShieldCheck, Smartphone, Upload, Wifi } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { applySyncPackage, createSyncPackage, downloadSyncPackage, getDeviceIdentity, makePairingToken, parseSyncPackage, previewSyncPackage, readLocalSyncData, saveDeviceName, type SyncHostInfo, type SyncIdentity, type SyncPackage, type SyncPreview } from "@core/lib/sync";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatHostExpiry(value: number) {
  return new Date(value * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function SummaryItem({ label, value, tone }: { label: string; value: number; tone: "blue" | "green" | "orange" | "purple" }) {
  return <RetroCard accent={tone} className="!p-4"><p className="text-2xl font-bold text-retro-text">{value}</p><p className="mt-1 text-[12px] text-retro-comment">{label}</p></RetroCard>;
}

export function SyncPage() {
  const [identity, setIdentity] = useState<SyncIdentity>(() => getDeviceIdentity());
  const [packageData, setPackageData] = useState<SyncPackage | null>(null);
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [hostInfo, setHostInfo] = useState<SyncHostInfo | null>(null);
  const [remoteAddress, setRemoteAddress] = useState("");
  const [remoteToken, setRemoteToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [applied, setApplied] = useState(false);
  const desktop = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  useEffect(() => () => {
    if (desktop) void invoke("stop_sync_host");
  }, [desktop]);

  const sourceIsThisDevice = packageData?.source.deviceId === identity.deviceId;
  const totalIncoming = useMemo(() => packageData ? Object.values(packageData.collections).reduce((total, records) => total + records.length, 0) : 0, [packageData]);

  const setIncomingPackage = async (parsed: SyncPackage, name: string) => {
    const local = await readLocalSyncData();
    setPackageData(parsed);
    setPreview(previewSyncPackage(local, parsed));
    setFileName(name);
    setApplied(false);
  };

  const handleExport = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const syncPackage = await createSyncPackage(identity);
      downloadSyncPackage(syncPackage);
      setMessage("Pacote criado. Transfira o arquivo .dunots para o outro notebook.");
    } catch {
      setError("Não foi possível criar o pacote de sincronização.");
    } finally {
      setBusy(false);
    }
  };

  const handleStartHost = async () => {
    if (!desktop) {
      setError("O pareamento pela rede está disponível no executável desktop. No navegador, use o pacote .dunots.");
      return;
    }
    setPairingBusy(true);
    setError("");
    setMessage("");
    try {
      const syncPackage = await createSyncPackage(identity);
      const info = await invoke<SyncHostInfo>("start_sync_host", { package: JSON.stringify(syncPackage), token: makePairingToken() });
      setHostInfo(info);
      setMessage("Compartilhamento iniciado. Informe o endereço e o token ao outro notebook.");
    } catch {
      setError("Não foi possível iniciar o compartilhamento. Verifique se o firewall permite a rede privada.");
    } finally {
      setPairingBusy(false);
    }
  };

  const handleStopHost = async () => {
    if (!desktop) return;
    await invoke("stop_sync_host");
    setHostInfo(null);
    setMessage("Compartilhamento encerrado.");
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copiado para a área de transferência.");
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
    }
  };

  const handleConnect = async () => {
    const address = remoteAddress.trim().replace(/\/+$/, "");
    const token = remoteToken.trim();
    if (!address || !token) {
      setError("Informe o endereço e o token exibidos no outro notebook.");
      return;
    }
    setPairingBusy(true);
    setError("");
    setMessage("");
    try {
      const baseAddress = /^https?:\/\//i.test(address) ? address : "http://" + address;
      const response = await fetch(baseAddress + "/dunots-sync", { headers: { Authorization: "Bearer " + token } });
      if (!response.ok) throw new Error("O endereço ou token não foi aceito.");
      const parsed = parseSyncPackage(await response.json());
      await setIncomingPackage(parsed, "pareamento · " + parsed.source.deviceName);
      setMessage("Pacote recebido. Revise a prévia antes de aplicar.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível conectar ao outro notebook.");
    } finally {
      setPairingBusy(false);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    setApplied(false);
    try {
      await setIncomingPackage(parseSyncPackage(JSON.parse(await file.text())), file.name);
    } catch (reason) {
      setPackageData(null);
      setPreview(null);
      setFileName("");
      setError(reason instanceof Error ? reason.message : "Não foi possível ler este pacote.");
    } finally {
      setBusy(false);
    }
  };

  const handleApply = async () => {
    if (!packageData || !preview) return;
    setBusy(true);
    setError("");
    try {
      await applySyncPackage(packageData);
      setApplied(true);
      setMessage("Mesclagem concluída. Os conflitos foram preservados neste notebook.");
    } catch {
      setError("A mesclagem não pôde ser concluída. Nenhum arquivo foi apagado.");
    } finally {
      setBusy(false);
    }
  };

  const hostInvite = hostInfo ? hostInfo.address + "\n" + hostInfo.token : "";

  return <div className="h-full overflow-y-auto retro-scrollbar paper-page p-5 md:p-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-[13px] font-semibold text-retro-blue">SINCRONIZAÇÃO</p><h1 className="text-3xl font-bold text-retro-text">Leve seus estudos com você</h1><p className="mt-1 max-w-2xl text-retro-comment">Pareie notebooks pela rede local ou transfira um pacote Dunots. Nada é apagado automaticamente.</p></div>
        <RetroBadge tone="green" icon={<Wifi size={13} />}>local e seguro</RetroBadge>
      </div>

      <RetroCard accent="purple" className="mt-7" title="Parear pela mesma rede Wi-Fi" icon={<Wifi size={16} />}>
        {!desktop ? <p className="text-[13px] leading-relaxed text-retro-text-dim">O pareamento direto está disponível no executável desktop. Neste navegador, gere e importe um pacote <code>.dunots</code> abaixo.</p> : <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-semibold text-retro-text">Notebook que envia</h2>
            <p className="text-[13px] leading-relaxed text-retro-text-dim">Inicie um compartilhamento temporário e envie o endereço e o token ao outro notebook. O servidor expira em 10 minutos.</p>
            {!hostInfo ? <RetroButton variant="primary" onClick={() => void handleStartHost()} disabled={pairingBusy} icon={<Wifi size={15} />}>{pairingBusy ? "iniciando..." : "iniciar compartilhamento"}</RetroButton> : <div className="space-y-3 rounded-wobbly border border-retro-green/50 bg-retro-green/10 p-3"><div><p className="text-[11px] uppercase tracking-wider text-retro-comment">endereço</p><code className="mt-1 block break-all text-[13px] text-retro-blue">{hostInfo.address}</code></div><div><p className="text-[11px] uppercase tracking-wider text-retro-comment">token temporário</p><code className="mt-1 block break-all text-[13px] text-retro-blue">{hostInfo.token}</code></div><p className="text-[12px] text-retro-comment">Expira às {formatHostExpiry(hostInfo.expires_at)}.</p><div className="flex flex-wrap gap-2"><RetroButton onClick={() => void handleCopy(hostInvite)} icon={<Copy size={14} />}>copiar convite</RetroButton><RetroButton onClick={() => void handleStopHost()}>encerrar</RetroButton></div></div>}
          </div>
          <div className="space-y-3">
            <h2 className="font-semibold text-retro-text">Notebook que recebe</h2>
            <p className="text-[13px] leading-relaxed text-retro-text-dim">No outro notebook, informe o endereço e o token exibidos pelo dispositivo que está enviando.</p>
            <label className="block text-[13px] text-retro-text-dim">Endereço do outro notebook<input value={remoteAddress} onChange={(event) => setRemoteAddress(event.target.value)} className="retro-input mt-1" placeholder="Ex.: http://192.168.0.15:43127" /></label>
            <label className="block text-[13px] text-retro-text-dim">Token<input value={remoteToken} onChange={(event) => setRemoteToken(event.target.value)} className="retro-input mt-1" placeholder="Cole o token temporário" /></label>
            <RetroButton variant="primary" onClick={() => void handleConnect()} disabled={pairingBusy} icon={<Download size={15} />}>{pairingBusy ? "conectando..." : "receber pacote pela rede"}</RetroButton>
          </div>
        </div>}
      </RetroCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <RetroCard accent="blue" title="Este dispositivo" icon={<Smartphone size={16} />}>
          <div className="space-y-4">
            <label className="block text-[13px] text-retro-text-dim">Nome do dispositivo<input value={identity.deviceName} onChange={(event) => setIdentity((current) => ({ ...current, deviceName: saveDeviceName(event.target.value) }))} className="retro-input mt-1" maxLength={60} placeholder="Ex.: Notebook principal" /></label>
            <div className="rounded-wobbly border border-retro-border bg-retro-panelHover p-3"><p className="text-[11px] uppercase tracking-wider text-retro-comment">identificador permanente</p><code className="mt-1 block break-all text-[12px] text-retro-blue">{identity.deviceId}</code></div>
          </div>
        </RetroCard>

        <RetroCard accent="green" title="Enviar por arquivo" icon={<Download size={16} />}>
          <div className="space-y-4">
            <p className="text-[14px] leading-relaxed text-retro-text-dim">Gere um pacote com flashcards, desafios, questões, simulados, trilhas, fluxogramas, artigos e snippets. Depois envie o arquivo para o outro notebook por pendrive, rede ou mensageiro.</p>
            <div className="rounded-wobbly border border-retro-green/40 bg-retro-green/10 p-3 text-[12px] text-retro-text-dim"><ShieldCheck size={15} className="mr-2 inline text-retro-green" />A mesclagem preserva dados locais e só aplica registros novos ou mais recentes.</div>
            <RetroButton variant="primary" onClick={() => void handleExport()} disabled={busy} icon={<Download size={15} />}>{busy ? "preparando..." : "gerar pacote .dunots"}</RetroButton>
          </div>
        </RetroCard>
      </div>

      <RetroCard accent="orange" className="mt-4" title="Receber por arquivo" icon={<Upload size={16} />}>
        <div className="space-y-4">
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-wobbly border-2 border-dashed border-retro-border bg-retro-panelHover p-5 text-center hover:border-retro-blue">
            <FileUp size={25} className="text-retro-blue" />
            <span className="mt-2 text-[14px] font-semibold text-retro-text">{fileName || "Escolha um arquivo .dunots"}</span>
            <span className="mt-1 text-[12px] text-retro-comment">a prévia será calculada antes de alterar seus dados</span>
            <input type="file" accept=".dunots,.json,application/json" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} />
          </label>
          {error && <div className="rounded-wobbly border border-retro-red/50 bg-retro-red/10 p-3 text-[13px] text-retro-red">{error}</div>}
          {message && <div className="rounded-wobbly border border-retro-green/50 bg-retro-green/10 p-3 text-[13px] text-retro-green">{message}</div>}
          {packageData && preview && <div className="space-y-4 rounded-wobbly border border-retro-border bg-retro-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-retro-text">Prévia da mesclagem</h2><p className="mt-1 text-[12px] text-retro-comment">Origem: {packageData.source.deviceName} · exportado em {formatDate(packageData.exportedAt)} · {totalIncoming} registros</p></div>{sourceIsThisDevice && <RetroBadge tone="orange">mesmo dispositivo</RetroBadge>}</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><SummaryItem label="novos" value={preview.added} tone="blue" /><SummaryItem label="atualizados" value={preview.updated} tone="green" /><SummaryItem label="iguais" value={preview.unchanged} tone="purple" /><SummaryItem label="conflitos preservados" value={preview.conflicts} tone="orange" /></div>
            {preview.conflicts > 0 && <p className="text-[12px] text-retro-orange">Há registros alterados nos dois notebooks. Eles não serão sobrescritos automaticamente; o conteúdo local será preservado.</p>}
            {applied ? <div className="flex flex-wrap items-center justify-between gap-3 border-t border-retro-border pt-4"><p className="text-[13px] text-retro-green"><CheckCircle2 size={15} className="mr-1 inline" />Dados mesclados com sucesso.</p><RetroButton variant="primary" onClick={() => window.location.reload()} icon={<RefreshCw size={14} />}>recarregar dados</RetroButton></div> : <div className="flex justify-end border-t border-retro-border pt-4"><RetroButton variant="primary" disabled={busy || (!preview.added && !preview.updated)} onClick={() => void handleApply()} icon={<Upload size={14} />}>{busy ? "mesclando..." : "aplicar mesclagem"}</RetroButton></div>}
          </div>}
        </div>
      </RetroCard>
      <p className="mt-5 text-[12px] text-retro-comment">O pareamento dura 10 minutos e usa um token temporário. Próximas versões podem adicionar sincronização automática e resolução manual de conflitos.</p>
    </div>
  </div>;
}