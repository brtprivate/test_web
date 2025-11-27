"use client";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  setPalette,
  THEME_PRESETS,
  updatePaletteColor,
} from '@/lib/slices/themeSlice';

const colorKeys: { key: keyof typeof THEME_PRESETS.ocean; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'muted', label: 'Muted' },
  { key: 'mutedForeground', label: 'Muted fg' },
  { key: 'card', label: 'Card' },
  { key: 'border', label: 'Border' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'danger', label: 'Danger' },
];

export const ColorManager = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);

  return (
    <Card
      title="Color orchestration"
      subtitle="Tune the global system palette and preview instantly."
      actions={
        <div className="flex flex-wrap gap-2">
          {(Object.keys(THEME_PRESETS) as Array<keyof typeof THEME_PRESETS>).map((preset) => (
            <Button key={preset} variant="ghost" onClick={() => dispatch(setPalette(preset))}>
              {preset}
            </Button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {colorKeys.map(({ key, label }) => (
          <div
            key={key}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 p-3 text-sm"
          >
            <span className="text-[--color-mutedForeground]">{label}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.palette[key]}
                onChange={(event) =>
                  dispatch(updatePaletteColor({ key, value: event.target.value }))
                }
                className="h-10 w-10 cursor-pointer rounded-full border border-white/10 bg-transparent"
              />
              <span className="font-mono text-xs uppercase">{theme.palette[key]}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};


