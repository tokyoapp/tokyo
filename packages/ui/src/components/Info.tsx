import "@atrium-ui/elements/expandable";
import { useAccessor } from "tokyo-accessors/solid";
import { createMetadataAccessor } from "tokyo-api";
import { t } from "tokyo-locales";
import { fileTypes } from "../utils/fileTypes.js";
import Icon from "./Icon.jsx";

function Seperator() {
  return <hr class="border-zinc-500" />;
}

function Property(props: { title: string; value: string | string[] }) {
  if (Array.isArray(props.value)) {
    return (
      <div class="my-4 px-3">
        <div class="mb-1 text-xs opacity-50">{props.title}</div>
        <div class="flex flex-wrap gap-2 text-xs">
          {props.value.filter(Boolean).map((value) => {
            return (
              <div class="rounded-md bg-zinc-700 p-[2px_6px]">{value}</div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div class="my-4 px-3">
      <div class="mb-1 text-xs opacity-50">{props.title}</div>
      <div class="select-text overflow-hidden text-ellipsis text-xs">
        {props.value}
      </div>
    </div>
  );
}

function typeFromFilename(name: string) {
  const ext = name.split(".").pop()?.toLocaleUpperCase();
  if (ext && fileTypes.has(ext)) {
    return `${fileTypes.get(ext)}`;
  }
  return "unknown";
}

export default function Info(props: { file?: any }) {
  const metadata = useAccessor(createMetadataAccessor);

  if (props.file)
    metadata.query({
      ids: [props.file.path],
    });

  const file_tags = () => {
    // const arr = meta()?.tags.map((tag) => {
    //   return tags().find((t) => t.id === tag)?.name || tag;
    // });
    // return arr || [];
    return [];
  };

  const meta = () => {
    const data = metadata.data();
    return data?.[0];
  };

  const exif = () => {
    return JSON.parse(meta()?.exif);
  };

  return (
    <div class="overflow-auto">
      {!props.file ? (
        <div class="mt-10 p-3 text-center text-xs opacity-50">
          No file selected
        </div>
      ) : (
        <>
          <Property title={t("info_name")} value={props.file.name} />
          <Property title={t("info_hash")} value={props.file.hash} />
          <Property title={t("info_path")} value={props.file.path} />
          <Property
            title={t("info_date_created")}
            value={props.file.create_date}
          />
          {/* <Property
            title={t('info_tags')}
            value={[typeFromFilename(props.file.name), ...file_tags()]}
          /> */}

          <Seperator />

          {meta() ? (
            <>
              <Property title={t("info_camera")} value={meta()?.make} />
              <Property
                title={t("info_lens")}
                value={`${exif()?.lens_make} ${exif()?.lens_model}`}
              />

              <Seperator />

              <Property
                title={t("info_aperture")}
                value={`F ${exif()?.fnumber.split("/")[0]}`}
              />
              <Property
                title={t("info_focal_length")}
                value={`${exif()?.focal_length.split("/")[0]}mm`}
              />
              <Property
                title={t("info_exposure_time")}
                value={exif()?.exposure_time}
              />
              <Property
                title={t("info_iso")}
                value={exif()?.iso_speed_ratings}
              />

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
