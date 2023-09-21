import '@atrium-ui/mono/expandable';
import { Entry, Library } from '../Library.ts';
import Icon from './Icon.tsx';
import { createEffect, createSignal } from 'solid-js';

function Seperator() {
  return <hr class="border-zinc-500" />;
}

function Property(props: { title: string; value: string | string[] }) {
  if (Array.isArray(props.value)) {
    return (
      <div class="px-3 my-4">
        <div class="text-xs opacity-50 mb-1">{props.title}</div>
        <div class="text-xs flex gap-2 flex-wrap">
          {props.value.filter(Boolean).map((value) => {
            return <div class="rounded-md bg-zinc-700 p-[2px_6px]">{value}</div>;
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

const fileTypeMap = new Map([
  ['CR3', 'Canon Raw 3'],
  ['CR2', 'Canon Raw 2'],
  ['ARW', 'Sony Raw'],
]);

function typeFromFilename(name: string) {
  const ext = name.split('.').pop()?.toLocaleUpperCase();
  if (ext && fileTypeMap.has(ext)) {
    return `${fileTypeMap.get(ext)}`;
  }
  return 'unknown';
}

const [tagList, setTagList] = createSignal([]);

Library.tags().then((tags) => {
  setTagList(tags);
});

export default function Info(props: {
  file?: Entry;
}) {
  const [meta, setMeta] = createSignal();

  createEffect(() => {
    if (props.file) {
      Library.metadata(props.file.path).then((meta) => {
        setMeta(meta);
        console.log(meta);
      });
    }
  });

  const exif = () => {
    return JSON.parse(meta()?.exif);
  };

  const tags = () => {
    const arr = meta()?.tags.map((tag) => {
      return tagList().find((t) => t.id === tag)?.name || tag;
    });
    console.log(arr);
    return arr || [];
  };

  return (
    <div class="bg-zinc-900 w-full h-full overflow-auto absolute">
      {!props.file ? (
        <div class="p-3 text-center text-xs opacity-50 mt-10">No file selected</div>
      ) : (
        <>
          <Property title="Name" value={props.file.name} />
          <Property title="Path" value={props.file.path} />
          <Property title="Date created" value={props.file.createDate} />
          <Property title="Tags" value={[typeFromFilename(props.file.name), ...tags()]} />

          <Seperator />

          {meta() ? (
            <>
              <Property title="Camera" value={meta()?.make} />
              <Property title="Lens" value={`${exif()?.lens_make} ${exif()?.lens_model}`} />

              <Seperator />

              <Property title="Aperture" value={`F ${exif()?.fnumber.split('/')[0]}`} />
              <Property title="Focal length" value={`${exif()?.focal_length.split('/')[0]}mm`} />
              <Property title="Exposure time" value={exif()?.exposure_time} />
              <Property title="ISO" value={exif()?.iso_speed_ratings} />

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
