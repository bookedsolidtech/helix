'use client';

/**
 * Alert configuration form — client component.
 */
import { useState } from 'react';
import type { AlertConfig } from '@/lib/alert-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  initialConfig: AlertConfig;
}

export function AlertForm({ initialConfig }: Props): React.JSX.Element {
  const [config, setConfig] = useState<AlertConfig>(initialConfig);
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addEmail(): void {
    const trimmed = emailInput.trim();
    if (trimmed && !config.emailRecipients.includes(trimmed)) {
      setConfig((prev) => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, trimmed],
      }));
    }
    setEmailInput('');
  }

  function removeEmail(email: string): void {
    setConfig((prev) => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((e) => e !== email),
    }));
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error(`Failed to save: ${res.status}`);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Enable / disable toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Global Alerting</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 accent-blue-500"
            />
            <div>
              <span className="text-sm font-medium">Enable alerting</span>
              <p className="text-xs text-muted-foreground">
                Send notifications when health scores drop below the threshold.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Health threshold */}
      <Card>
        <CardHeader>
          <CardTitle>Health Threshold</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Send an alert when any component health score drops below this value.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={config.healthThreshold}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, healthThreshold: Number(e.target.value) }))
              }
              className="flex-1 accent-blue-500"
            />
            <span className="w-12 text-right font-mono text-sm font-bold">
              {config.healthThreshold}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 (off)</span>
            <span>50 (warning)</span>
            <span>100 (strict)</span>
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            POST alerts to this URL (Slack, Teams, PagerDuty, etc.).
          </p>
          <input
            type="url"
            value={config.webhookUrl}
            onChange={(e) => setConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </CardContent>
      </Card>

      {/* Email recipients */}
      <Card>
        <CardHeader>
          <CardTitle>Email Recipients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Send alert emails to these addresses.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
              placeholder="engineer@example.com"
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={addEmail}
              type="button"
              className="rounded border border-border bg-muted px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Add
            </button>
          </div>
          {config.emailRecipients.length > 0 ? (
            <ul className="space-y-1">
              {config.emailRecipients.map((email) => (
                <li key={email} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    type="button"
                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">No recipients configured.</p>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          type="button"
          className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
        {error && (
          <span className="text-sm text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}
