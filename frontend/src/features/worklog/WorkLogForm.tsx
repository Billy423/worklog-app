// Work log entry form. Cascading fields (locked order):
//   Building → Room → Meter → I/O Pins → Notes → Submit
// Each step is disabled until the previous has a value; changing an upstream
// field clears everything downstream (AC4). Building/Room/Meter lists are
// derived client-side from GET /api/meters (see lib/buildingLocation).
//
// This file owns the ONLINE submit path (POST + success toast + reset). The
// offline branch and sync banner are layered on in a later step.

import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useMeters, useSubmitWorkLog } from '@/api/queries';
import { ApiError } from '@/api/apiFetch';
import type { CreateWorkLogInput } from '@/api/schemas';
import { listBuildings, listMetersAt, listRooms } from '@/lib/buildingLocation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PinChecklist } from './PinChecklist';

// Radix Select forbids an empty-string item value, so meters whose location has
// no room segment are represented with this sentinel and mapped back to '' when
// filtering. See the prototype-stopgap note in lib/buildingLocation.
const NO_ROOM = '__no_room__';

const formSchema = z.object({
  building: z.string().min(1, 'Select a building'),
  room: z.string().min(1, 'Select a room'),
  meterIonDeviceName: z.string().min(1, 'Select a meter'),
  pinIds: z.array(z.string()),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EMPTY_FORM: FormValues = {
  building: '',
  room: '',
  meterIonDeviceName: '',
  pinIds: [],
  notes: '',
};

export function WorkLogForm() {
  const { data: meters, isLoading, isError, refetch } = useMeters();
  const submit = useSubmitWorkLog();

  const { control, handleSubmit, watch, setValue, register, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM,
  });

  const building = watch('building');
  const room = watch('room');
  const meterIonDeviceName = watch('meterIonDeviceName');
  const pinIds = watch('pinIds');

  const buildings = useMemo(() => (meters ? listBuildings(meters) : []), [meters]);
  const rooms = useMemo(
    () => (meters && building ? listRooms(meters, building) : []),
    [meters, building],
  );
  const metersHere = useMemo(() => {
    if (!meters || !building || !room) return [];
    return listMetersAt(meters, building, room === NO_ROOM ? '' : room);
  }, [meters, building, room]);

  const onSubmit = (values: FormValues) => {
    const input: CreateWorkLogInput = {
      meterIonDeviceName: values.meterIonDeviceName,
      pinIds: values.pinIds,
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      loggedAt: new Date().toISOString(),
    };

    submit.mutate(input, {
      onSuccess: () => {
        toast.success('Work log submitted');
        reset(EMPTY_FORM);
      },
      onError: (err) => {
        const message = err instanceof ApiError ? err.message : 'Submission failed — try again';
        toast.error(message);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log work</CardTitle>
        <CardDescription>Record maintenance or inspection on a meter.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading meters…</p>
        ) : isError ? (
          <div className="flex items-center gap-3 text-sm text-destructive">
            <span>Couldn't load meters.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Building */}
            <div className="space-y-1.5">
              <Label htmlFor="building">Building</Label>
              <Controller
                control={control}
                name="building"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue('room', '');
                      setValue('meterIonDeviceName', '');
                      setValue('pinIds', []);
                    }}
                  >
                    <SelectTrigger id="building">
                      <SelectValue placeholder="Select a building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Room */}
            <div className="space-y-1.5">
              <Label htmlFor="room">Room</Label>
              <Controller
                control={control}
                name="room"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    disabled={!building}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue('meterIonDeviceName', '');
                      setValue('pinIds', []);
                    }}
                  >
                    <SelectTrigger id="room">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r || NO_ROOM} value={r || NO_ROOM}>
                          {r || 'No room specified'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Meter */}
            <div className="space-y-1.5">
              <Label htmlFor="meter">Meter</Label>
              <Controller
                control={control}
                name="meterIonDeviceName"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    disabled={!room}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue('pinIds', []);
                    }}
                  >
                    <SelectTrigger id="meter">
                      <SelectValue placeholder="Select a meter" />
                    </SelectTrigger>
                    <SelectContent>
                      {metersHere.map((m) => (
                        <SelectItem key={m.ionDeviceName} value={m.ionDeviceName}>
                          {m.pmeDisplayName} ({m.ionDeviceName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* I/O Pins */}
            {meterIonDeviceName ? (
              <div className="space-y-1.5">
                <Label>I/O pins worked on</Label>
                <PinChecklist
                  ionDeviceName={meterIonDeviceName}
                  value={pinIds}
                  onChange={(next) => setValue('pinIds', next)}
                />
              </div>
            ) : null}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="What did you do?"
                {...register('notes')}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!meterIonDeviceName || submit.isPending}
            >
              {submit.isPending ? 'Submitting…' : 'Submit work log'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
