"use client";

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetSettingsQuery, useUpdateSettingMutation } from '@/features/settings/api';
import type { Setting, SettingType } from '@/features/settings/types';

export const SystemSettingsPanel = () => {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: updating }] = useUpdateSettingMutation();
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [value, setValue] = useState<string>('');

  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting);
    if (setting.type === 'array' || setting.type === 'object') {
      try {
        setValue(JSON.stringify(setting.value, null, 2));
      } catch {
        setValue(String(setting.value ?? ''));
      }
    } else {
      setValue(String(setting.value ?? ''));
    }
  };

  const handleSave = async () => {
    if (!editingSetting) return;

    let parsedValue: Setting['value'];
    try {
      parsedValue = parseValueByType(value, editingSetting.type);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to parse value for this setting.';
      toast.error(message);
      return;
    }

    try {
      await updateSetting({ key: editingSetting.key, value: parsedValue }).unwrap();
      toast.success('Setting updated');
      setEditingSetting(null);
      setValue('');
    } catch (error: unknown) {
      type ApiError = { data?: { message?: string }; message?: string };
      let message = 'Failed to update setting';
      if (typeof error === 'object' && error !== null) {
        const apiError = error as ApiError;
        message = apiError.data?.message || apiError.message || message;
      }
      toast.error(message);
    }
  };

  const renderSettingValue = (setting: Setting) => {
    const preview = formatValuePreview(setting);
    return (
      <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-[--color-mutedForeground] font-mono">
        {preview}
      </span>
    );
  };

  const isStructuredType = useMemo(() => {
    return editingSetting?.type === 'array' || editingSetting?.type === 'object';
  }, [editingSetting]);

  return (
    <Card title="System settings" subtitle="Edit automation thresholds, payout configs, & env keys.">
      {isLoading && <Skeleton className="mb-4 h-48 w-full" />}
      <div className="space-y-4">
        {data?.map((setting) => (
          <div
            key={setting._id}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-[--color-foreground]">{setting.key}</p>
              <p className="text-xs text-[--color-mutedForeground]">{setting.description}</p>
            </div>
            {editingSetting?._id === setting._id ? (
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                {isStructuredType ? (
                  <textarea
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    rows={4}
                    className="min-w-[260px] rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-[--color-foreground] font-mono"
                  />
                ) : (
                  <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm text-[--color-foreground]"
                  />
                )}
                <div className="flex gap-2">
                  <Button variant="primary" loading={updating} onClick={handleSave}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingSetting(null);
                      setValue('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {renderSettingValue(setting)}
                <Button variant="ghost" onClick={() => handleEdit(setting)}>
                  Edit
                </Button>
              </div>
            )}
          </div>
        ))}
        {!isLoading && !data?.length && (
          <p className="text-center text-sm text-[--color-mutedForeground]">
            No settings available. Seed defaults from the server to begin.
          </p>
        )}
      </div>
    </Card>
  );
};

function formatValuePreview(setting: Setting): string {
  const { type, value } = setting;
  if (value === undefined || value === null) {
    return '—';
  }

  switch (type) {
    case 'boolean':
      return String(Boolean(value));
    case 'number':
      return String(value);
    case 'array':
    case 'object':
      try {
        const stringified = JSON.stringify(value);
        return stringified.length > 120 ? `${stringified.slice(0, 117)}...` : stringified;
      } catch {
        return String(value);
      }
    default:
      return String(value);
  }
}

function parseValueByType(rawValue: string, type: SettingType): Setting['value'] {
  switch (type) {
    case 'number': {
      const parsed = Number(rawValue);
      if (Number.isNaN(parsed)) {
        throw new Error('Please enter a valid number value.');
      }
      return parsed;
    }
    case 'boolean': {
      const normalized = rawValue.trim().toLowerCase();
      if (['true', '1', 'yes'].includes(normalized)) return true;
      if (['false', '0', 'no'].includes(normalized)) return false;
      throw new Error("Boolean settings accept 'true' or 'false'.");
    }
    case 'array':
    case 'object': {
      try {
        return JSON.parse(rawValue);
      } catch {
        throw new Error('Please provide valid JSON for this setting.');
      }
    }
    case 'string':
    default:
      return rawValue;
  }
}


