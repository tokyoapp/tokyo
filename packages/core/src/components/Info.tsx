import Icon from './Icon.tsx';
import '@atrium-ui/mono/expandable';
import { file } from '../actions/open.ts';
import Rating from './Rating.tsx';

function Seperator() {
  return <hr class="border-zinc-800" />;
}

function Title(props: { title: string }) {
  return <div class="px-3 my-2 text-xs opacity-50">{props.title}</div>;
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
      <div class="text-xs select-text">{props.value}</div>
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

export default function Preview() {
  return (
    <div class="bg-zinc-900 w-full h-full overflow-auto absolute">
      <pre class="p-3">
        <Rating empty rating={file.metadata.rating || 0} />
      </pre>

      <Seperator />
      <Title title="File" />

      <Property title="Name" value={file.metadata.name} />
      <Property title="Date created" value={file.metadata.create_date} />
      <Property title="Type" value={[typeFromFilename(file.name)]} />

      <Seperator />
      <Title title="Camera" />

      <Property title="Camera" value={file.metadata?.make} />
      <Property
        title="Lens"
        value={`${file.metadata?.exif?.lens_make} ${file.metadata?.exif?.lens_model}`}
      />

      <Seperator />
      <Title title="Shot" />

      <Property title="Aperture" value={`F ${file.metadata?.exif?.fnumber.split('/')[0]}`} />
      <Property
        title="Focal length"
        value={`${file.metadata?.exif?.focal_length.split('/')[0]}mm`}
      />
      <Property title="Exposure time" value={file.metadata?.exif?.exposure_time} />
      <Property title="ISO" value={file.metadata?.exif?.iso_speed_ratings} />

      <Seperator />

      {/* <pre class="p-2 text-xs">
        <a-expandable>
          <button slot="toggle">More +</button>
          <pre>{JSON.stringify(file.metadata, null, '  ')}</pre>
        </a-expandable>
      </pre> */}
    </div>
  );
}
