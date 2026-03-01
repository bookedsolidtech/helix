/**
 * Alert configuration for Panopticon v2.
 * Reads and writes alert settings from apps/admin/alert-config.json.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

export interface AlertConfig {
  webhookUrl: string;
  emailRecipients: string[];
  healthThreshold: number; // alert when health drops below this (0-100)
  enabled: boolean;
}

const ALERT_CONFIG_PATH = resolve(process.cwd(), 'alert-config.json');

const DEFAULT_CONFIG: AlertConfig = {
  webhookUrl: '',
  emailRecipients: [],
  healthThreshold: 70,
  enabled: false,
};

/**
 * Load alert configuration from disk, returning defaults if not found.
 */
export function loadAlertConfig(): AlertConfig {
  if (!existsSync(ALERT_CONFIG_PATH)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = readFileSync(ALERT_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(content) as Partial<AlertConfig>;
    return {
      webhookUrl: parsed.webhookUrl ?? DEFAULT_CONFIG.webhookUrl,
      emailRecipients: parsed.emailRecipients ?? DEFAULT_CONFIG.emailRecipients,
      healthThreshold: parsed.healthThreshold ?? DEFAULT_CONFIG.healthThreshold,
      enabled: parsed.enabled ?? DEFAULT_CONFIG.enabled,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save alert configuration to disk.
 */
export function saveAlertConfig(config: AlertConfig): void {
  const dir = dirname(ALERT_CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(ALERT_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
