import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Database, FolderOpen, Loader2 } from "lucide-react";
import { ipc, IpcError } from "@/lib/ipc";
import { Button } from "@/components/ui/button";
import log from "@/lib/logger";

type Step =
  | { type: "idle" }
  | { type: "picking-new" }
  | { type: "picking-existing" }
  | { type: "busy"; message: string }
  | { type: "ready"; dbPath: string; createdByApp: boolean }
  | { type: "error"; message: string };

export default function SetupPage() {
  const [searchParams] = useSearchParams();
  const recoveryError = searchParams.get("error");
  const [step, setStep] = useState<Step>({ type: "idle" });

  async function handleCreateNew() {
    setStep({ type: "picking-new" });
    try {
      const filePath = await ipc.setupOpenSaveDialog();
      if (!filePath) {
        setStep({ type: "idle" });
        return;
      }
      setStep({ type: "busy", message: "Creating database…" });
      await ipc.setupCreateDatabase(filePath);
      setStep({ type: "ready", dbPath: filePath, createdByApp: true });
    } catch (err) {
      log.error("Setup create-new failed:", err);
      setStep({
        type: "error",
        message: err instanceof IpcError ? err.message : "Failed to create database.",
      });
    }
  }

  async function handleUseExisting() {
    setStep({ type: "picking-existing" });
    try {
      const filePath = await ipc.setupOpenFileDialog();
      if (!filePath) {
        setStep({ type: "idle" });
        return;
      }
      setStep({ type: "busy", message: "Validating database…" });
      await ipc.setupValidateExistingDatabase(filePath);
      setStep({ type: "ready", dbPath: filePath, createdByApp: false });
    } catch (err) {
      log.error("Setup use-existing failed:", err);
      setStep({
        type: "error",
        message: "This database is incompatible or could not be validated.",
      });
    }
  }

  async function handleContinue(dbPath: string) {
    setStep({ type: "busy", message: "Saving configuration…" });
    try {
      await ipc.setupSaveConfig(dbPath);
      await ipc.setupComplete();
    } catch (err) {
      log.error("Setup complete failed:", err);
      setStep({
        type: "error",
        message: err instanceof IpcError ? err.message : "Failed to save configuration.",
      });
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">RFP OB Bookings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Set up your bookings database to get started.</p>
        </div>

        {recoveryError && (
          <div className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
            {recoveryError}
          </div>
        )}

        {step.type === "error" && (
          <div className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
            {step.message}
            <button
              onClick={() => setStep({ type: "idle" })}
              className="mt-2 block underline text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {(step.type === "idle" || step.type === "picking-new" || step.type === "picking-existing" || step.type === "error") && (
          <div className="space-y-3">
            <Button
              className="w-full justify-start gap-3"
              onClick={handleCreateNew}
              disabled={step.type === "picking-new" || step.type === "picking-existing"}
            >
              <Database size={16} />
              Create a new database
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleUseExisting}
              disabled={step.type === "picking-new" || step.type === "picking-existing"}
            >
              <FolderOpen size={16} />
              Open an existing database
            </Button>
          </div>
        )}

        {step.type === "busy" && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            {step.message}
          </div>
        )}

        {step.type === "ready" && (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              Database {step.createdByApp ? "created" : "validated"} successfully.
            </div>
            <p className="text-sm text-muted-foreground truncate">
              <span className="font-medium">Path: </span>{step.dbPath}
            </p>
            <Button className="w-full" onClick={() => handleContinue(step.dbPath)}>
              Open RFP OB Bookings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
