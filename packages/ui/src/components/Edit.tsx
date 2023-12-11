import '@atrium-ui/mono/expandable';
import Icon from './Icon.tsx';
import { IndexEntryMessage } from '@tokyo/proto';
import './FluidInput.ts';
import { createSignal } from 'solid-js';

function Separator() {
  return <hr class="border-zinc-500 my-2" />;
}

export const [settings, setSettings] = createSignal({
  exposure: 0,
});

export default function Info(props: {
  file?: IndexEntryMessage;
}) {
  return (
    <div class="overflow-auto">
      {!props.file ? (
        <div class="p-3 text-center text-xs opacity-50 mt-10">No file selected</div>
      ) : (
        <>
          <div class="p-2 text-xs">
            <label class="block opacity-40 pb-1">
              <Icon name="ph-aperture" class="mr-1" />
              Exposure
            </label>
            <fluid-input
              onChange={(e) => {
                setSettings({
                  exposure: e.currentTarget.value,
                });
              }}
              steps="0.01"
              min="-10"
              max="+10"
              value="0"
              class="w-full h-7"
            />
          </div>

          <Separator />
        </>
      )}
    </div>
  );
}
