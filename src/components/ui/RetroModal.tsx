import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { RetroButton } from "./RetroButton";

interface RetroModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  accent?: "green" | "yellow" | "red" | "blue" | "purple" | "orange";
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  subtitle?: string;
}

export function RetroModal({
  open,
  onClose,
  title,
  icon,
  accent = "blue",
  children,
  footer,
  size = "md",
  subtitle,
}: RetroModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const accentMap = {
    green: "border-t-retro-green",
    yellow: "border-t-retro-yellow",
    red: "border-t-retro-red",
    blue: "border-t-retro-blue",
    purple: "border-t-retro-purple",
    orange: "border-t-retro-orange",
  } as const;

  const sizeMap = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  } as const;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      <div
        className="modal-backdrop absolute inset-0"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Janela de diálogo'}
        className={`relative w-full ${sizeMap[size]} max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-4rem)] flex flex-col bg-retro-bgDark border border-retro-border border-t-4 ${accentMap[accent]} shadow-paper-lg rounded-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || true) && (
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-retro-border/70 bg-retro-bg">
            <div className="flex items-center gap-2 min-w-0">
              {icon && (
                <span className="text-retro-text-dim shrink-0">{icon}</span>
              )}
              <div className="min-w-0">
                {title && <h2 className="text-[18px] font-semibold text-retro-text truncate">{title}</h2>}
                {subtitle && <p className="mt-0.5 text-[13px] text-retro-text-dim truncate">{subtitle}</p>}
              </div>
            </div>
            <RetroButton
              variant="ghost"
              onClick={onClose}
              className="!px-2 !py-1 shrink-0"
            >
              <X size={15} />
            </RetroButton>
          </div>
        )}

        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto retro-scrollbar">
            {children}
          </div>
        )}

        {footer && (
          <div className="px-5 py-4 border-t border-retro-border/70 bg-retro-bg flex items-center justify-end gap-3 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "Confirmar ação",
  message,
  confirmLabel = "confirmar",
  cancelLabel = "cancelar",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <RetroModal
      open={open}
      onClose={onCancel}
      title={title}
      accent={tone === "danger" ? "red" : "yellow"}
      size="sm"
      footer={
        <>
          <RetroButton variant="default" onClick={onCancel}>
            {cancelLabel}
          </RetroButton>
          <RetroButton
            variant={tone === "danger" ? "primary" : "primary"}
            onClick={onConfirm}
            className={
              tone === "danger"
                ? "!bg-retro-red/20 !border-retro-red/60 !text-retro-red hover:!bg-retro-red/30"
                : ""
            }
          >
            {confirmLabel}
          </RetroButton>
        </>
      }
    >
      <div className="p-5 text-[13.5px] text-retro-text leading-relaxed whitespace-pre-wrap">
        {message}
      </div>
    </RetroModal>
  );
}
