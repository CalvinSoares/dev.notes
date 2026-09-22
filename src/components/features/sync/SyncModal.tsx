import { useEffect, useState } from "react";
import { RefreshCw, Send, ShieldCheck, Wifi } from "lucide-react";
import { RetroModal } from "@/components/ui/RetroModal";
import { SyncPanel, type SyncTab } from "@/pages/SyncPage";

const TABS: Array<{ id: SyncTab; label: string; hint: string }> = [
  { id: "pair", label: "parear", hint: "rede local" },
  { id: "files", label: "pacotes", hint: "enviar e receber" },
  { id: "conflicts", label: "conflitos", hint: "revisar alterações" },
];

export function SyncModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SyncTab>("pair");

  useEffect(() => {
    if (open) setActiveTab("pair");
  }, [open]);

  return <RetroModal open={open} onClose={onClose} title="Sincronizar dispositivos" subtitle="Leve seus estudos para outro notebook com revisão antes da mesclagem." icon={<RefreshCw size={17} />} accent="purple" size="xl">
    <div className="border-b border-retro-border bg-retro-bg px-4 pt-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Opções de sincronização">
        {TABS.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-wobbly border px-3 py-2 text-left transition-colors ${activeTab === tab.id ? "border-retro-purple bg-retro-purple/15 text-retro-text" : "border-retro-border text-retro-comment hover:bg-retro-panelHover hover:text-retro-text"}`}><span className="flex items-center gap-2 text-[13px] font-semibold">{tab.id === "pair" ? <Wifi size={14} /> : tab.id === "files" ? <Send size={14} /> : <ShieldCheck size={14} />}{tab.label}</span><span className="mt-0.5 block text-[11px]">{tab.hint}</span></button>)}
      </div>
    </div>
    <SyncPanel activeTab={activeTab} onPackageReceived={setActiveTab} />
    <div className="border-t border-retro-border bg-retro-bg px-5 py-3 text-[12px] text-retro-comment">O pacote é criptografado no pareamento. Exclusões viram registros de controle e conflitos nunca substituem seus dados sem confirmação.</div>
  </RetroModal>;
}