"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

// ---------------------------------------------------------------------------
// Generic modal layer
// ---------------------------------------------------------------------------

interface ModalContextValue {
  /** Show a modal with arbitrary React content. Call the returned close fn to dismiss. */
  openModal: (content: React.ReactNode) => () => void;
  closeModal: () => void;
  /** Convenience: show a confirm dialog and return a boolean promise. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextValue>({
  openModal: () => () => {},
  closeModal: () => {},
  confirm: () => Promise.resolve(false),
});

export function useModal() {
  return useContext(ModalContext);
}

/** Shortcut — most callers only need confirm(). */
export function useConfirm() {
  const { confirm } = useContext(ModalContext);
  return { confirm };
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<React.ReactNode>(null);
  const [open, setOpen] = useState(false);

  const closeModal = useCallback(() => {
    setOpen(false);
    setContent(null);
  }, []);

  const openModal = useCallback(
    (node: React.ReactNode) => {
      setContent(node);
      setOpen(true);
      return closeModal;
    },
    [closeModal]
  );

  // ---- confirm() built on top of the generic layer --------------------
  const resolveRef = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback(
    (opts: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;

        const handleConfirm = () => {
          closeModal();
          resolve(true);
        };
        const handleCancel = () => {
          closeModal();
          resolve(false);
        };

        const isDanger = opts.variant === "danger";

        openModal(
          <div
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-sm animate-in zoom-in-95 fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-3">
                {isDanger && (
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/50 shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold mb-1">{opts.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {opts.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 pb-5">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className={
                  isDanger
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                    : ""
                }
              >
                {opts.confirmLabel || "Confirm"}
              </Button>
            </div>
          </div>
        );
      });
    },
    [openModal, closeModal]
  );

  const handleBackdropClick = () => {
    // For confirm dialogs, resolve as cancelled
    resolveRef.current?.(false);
    resolveRef.current = undefined;
    closeModal();
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, confirm }}>
      {children}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50 animate-in fade-in duration-150"
            onClick={handleBackdropClick}
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto">
              {content}
            </div>
          </div>
        </>
      )}
    </ModalContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Confirm options type (kept here so consumers only need one import)
// ---------------------------------------------------------------------------

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}
