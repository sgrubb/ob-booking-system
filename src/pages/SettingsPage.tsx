import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ipc, IpcError } from "@/lib/ipc";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import log from "@/lib/logger";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: dbPath } = useSuspenseQuery({
    queryKey: queryKeys.settings.dbPath,
    queryFn: () => ipc.getDbPath(),
  });

  const { data: appSettings } = useSuspenseQuery({
    queryKey: queryKeys.settings.app,
    queryFn: () => ipc.getAppSettings(),
  });

  const [generatorFee, setGeneratorFee] = useState(() => String(appSettings.generatorFee));
  const [defaultTeamSize, setDefaultTeamSize] = useState(() => String(appSettings.defaultTeamSize));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSaveAppSettings() {
    setSaving(true);
    setSaveMessage(null);
    try {
      await ipc.updateAppSettings({
        generatorFee: parseFloat(generatorFee),
        defaultTeamSize: parseInt(defaultTeamSize, 10),
        updatedAt: new Date(),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.app });
      setSaveMessage("Saved.");
    } catch (err) {
      log.error("Failed to save app settings:", err);
      setSaveMessage(err instanceof IpcError ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeDbPath() {
    try {
      const newPath = await ipc.openFileDialog();
      if (!newPath) {
        return;
      }
      await ipc.setDbPath(newPath);
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.dbPath });
    } catch (err) {
      log.error("Failed to change db path:", err);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 max-w-lg">
      <PageHeader>
        <h2 className="text-2xl font-bold">Settings</h2>
      </PageHeader>

      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="font-semibold">Database</h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current database file:</p>
            <p className="text-sm font-mono truncate">{dbPath ?? "Not configured"}</p>
            <Button variant="outline" size="sm" onClick={handleChangeDbPath}>
              Change database file
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="font-semibold">Defaults</h3>
          <Field label="Default generator fee (£)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={generatorFee}
              onChange={(e) => setGeneratorFee(e.target.value)}
              className="max-w-32"
            />
          </Field>
          <Field label="Default team size">
            <Input
              type="number"
              min="1"
              step="1"
              value={defaultTeamSize}
              onChange={(e) => setDefaultTeamSize(e.target.value)}
              className="max-w-32"
            />
          </Field>
          {saveMessage && (
            <p className="text-sm text-muted-foreground">{saveMessage}</p>
          )}
          <Button onClick={handleSaveAppSettings} disabled={saving} size="sm">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
