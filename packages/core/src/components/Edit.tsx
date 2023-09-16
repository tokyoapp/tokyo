import '@atrium-ui/mono/expandable';
import { Entry, Library } from '../Library.ts';
import Icon from './Icon.tsx';
import { createEffect, createSignal } from 'solid-js';

function Seperator() {
  return <hr class="border-zinc-800" />;
}

function Property(props: { title: string; value: string | string[] }) {
  if (Array.isArray(props.value)) {
    return (
      <div class="px-3 my-4">
        <div class="text-xs opacity-50 mb-1">{props.title}</div>
        <div class="text-xs flex gap-2">
          {props.value.map((value) => {
            return <div class="rounded-md bg-zinc-600 p-[2px_6px]">{value}</div>;
          })}
        </div>
      </div>
    );
  }

  return (
    <div class="px-3 my-4">
      <div class="text-xs opacity-50 mb-1">{props.title}</div>
      <div class="text-xs select-text text-ellipsis overflow-hidden">{props.value}</div>
    </div>
  );
}

export default function Info(props: {
  file?: Entry;
}) {
  const [meta, setMeta] = createSignal();

  createEffect(() => {
    if (props.file) {
      Library.metadata(props.file.path).then((meta) => {
        setMeta(meta);
      });
    }
  });

  return (
    <div class="bg-zinc-900 w-full h-full overflow-auto absolute">
      {!props.file ? (
        <div class="p-3 text-center text-xs opacity-50 mt-10">No file selected</div>
      ) : (
        <>
          {meta() ? (
            <>
              <Property title="Camera" value={meta()?.make} />
              <Property
                title="Lens"
                value={`${meta()?.exif?.lens_make} ${meta()?.exif?.lens_model}`}
              />

              <Seperator />

              <Property title="Aperture" value={`F ${meta()?.exif?.fnumber.split('/')[0]}`} />
              <Property
                title="Focal length"
                value={`${meta()?.exif?.focal_length.split('/')[0]}mm`}
              />
              <Property title="Exposure time" value={meta()?.exif?.exposure_time} />
              <Property title="ISO" value={meta()?.exif?.iso_speed_ratings} />

              <Seperator />
            </>
          ) : (
            <Icon name="loader" />
          )}

          {/* <pre class="p-2 text-xs">
          <a-expandable>
            <button slot="toggle">More +</button>
            <pre>{JSON.stringify(file.metadata, null, '  ')}</pre>
          </a-expandable>
        </pre> */}
        </>
      )}
    </div>
  );
}
