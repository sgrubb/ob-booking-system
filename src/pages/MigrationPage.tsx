import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ipc, IpcError } from "@/lib/ipc";
import { Button } from "@/components/ui/button";
import type { MigrationInfo } from "@shared/types/migrations";
import log from "@/lib/logger";

type State =
  | { type: "loading" }
  | { type: "ready"; info: MigrationInfo }
  | { type: "migrating" }
  | { type: "done" }
  | { type: "error"; message: string };

export default function MigrationPage() {
  const [state, setState] = useState<State>({ type: "loading" });

  useEffect(() => {
    ipc.migrationGetInfo()
      .then((info) => setState({ type: "ready", info }))
      .catch((err) => {
        log.error("Failed to get migration info:", err);
        setState({ type: "error", message: "Failed to load migration information." });
      });
  }, []);

  async function handleApply() {
    setState({ type: "migrating" });
    try {
      await ipc.migrationApply();
      setState({ type: "done" });
    } catch (err) {
      log.error("Migration failed:", err);
      setState({
        type: "error",
        message: err instanceof IpcError ? err.message : "Migration failed.",
      });
    }
  }

  async function handleContinue() {
    await ipc.migrationComplete();
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Database Update Required</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your database needs to be updated before you can continue.
          </p>
        </div>

        {state.type === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        )}

        {state.type === "ready" && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <div><span className="font-medium">Current version:</span> {state.info.currentVersion}</div>
              <div><span className="font-medium">Required version:</span> {state.info.requiredVersion}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will update your database schema. A backup is recommended before proceeding.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleApply} className="flex-1">
                Update Database
              </Button>
              <Button variant="outline" onClick={() => ipc.migrationQuit()}>
                Quit
              </Button>
            </div>
          </div>
        )}

        {state.type === "migrating" && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Updating database…
          </div>
        )}

        {state.type === "done" && (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              Database updated successfully.
            </div>
            <Button className="w-full" onClick={handleContinue}>
              Continue
            </Button>
          </div>
        )}

        {state.type === "error" && (
          <div className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
            {state.message}
          </div>
        )}
      </div>
    </div>
  );
}
