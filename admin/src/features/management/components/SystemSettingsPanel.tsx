"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetSettingsQuery, useUpdateSettingMutation } from '@/features/settings/api';

export const SystemSettingsPanel = () => {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: updating }] = useUpdateSettingMutation();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [value, setValue] = useState<string>('');

  const handleEdit = (key: string, currentValue: string | number | boolean) => {
    setEditingKey(key);
    setValue(String(currentValue ?? ''));
  };

  const handleSave = async () => {
    if (!editingKey) return;
    try {
      await updateSetting({ key: editingKey, value }).unwrap();
      toast.success('Setting updated');
      setEditingKey(null);
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
            {editingKey === setting.key ? (
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm text-[--color-foreground]"
                />
                <div className="flex gap-2">
                  <Button variant="primary" loading={updating} onClick={handleSave}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingKey(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-[--color-mutedForeground]">
                  {String(setting.value)}
                </span>
                <Button variant="ghost" onClick={() => handleEdit(setting.key, setting.value)}>
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


