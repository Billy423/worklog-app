// I/O pin multi-select for the selected meter. Renders a checkbox per pin and
// handles each async state explicitly: loading, error (with retry), paused
// (offline with no cached pins), and empty — electricity-only meters return [],
// which is valid and lets the form submit with no pins (AC2).

import { useMeterPins } from '@/api/queries';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface PinChecklistProps {
  ionDeviceName: string;
  value: string[];
  onChange: (next: string[]) => void;
}

export function PinChecklist({ ionDeviceName, value, onChange }: PinChecklistProps) {
  const { data: pins, isLoading, isError, isPaused, refetch } = useMeterPins(ionDeviceName);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading pins…</p>;
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 text-sm text-destructive">
        <span>Couldn't load pins.</span>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // Offline and no cached pins for this meter (query is paused, not empty).
  if (!pins && isPaused) {
    return (
      <p className="text-sm text-muted-foreground">
        Pins for this meter aren't available offline — they'll load once you're back online.
      </p>
    );
  }

  if (!pins || pins.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pins configured for this meter yet.</p>
    );
  }

  const toggle = (pinId: string) => {
    onChange(value.includes(pinId) ? value.filter((p) => p !== pinId) : [...value, pinId]);
  };

  const sorted = [...pins].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-1">
      {sorted.map((pin) => (
        <label
          key={pin.id}
          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
        >
          <Checkbox
            checked={value.includes(pin.pinId)}
            onCheckedChange={() => toggle(pin.pinId)}
          />
          <span className="text-sm">
            {pin.pinLabel}
            {pin.unit ? <span className="text-muted-foreground"> · {pin.unit}</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}
