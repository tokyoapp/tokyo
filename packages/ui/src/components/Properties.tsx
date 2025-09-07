import {
  Model,
  type PropertyModel,
  PropertyTag,
  type PropertyType,
} from "tokyo-properties";
import { useProperties } from "../utils/useProperties.ts";
import Info from "./Info.tsx";
import { Tabs } from "./Tabs.tsx";
import "./FluidInput.ts";

export function Properties(props: {
  file: any;
  models: Record<string, PropertyModel>;
}) {
  return (
    <div class="relative mr-2 mt-2 overflow-hidden">
      <div class="absolute bottom-0 right-0 top-0 h-auto overflow-auto">
        <Tabs>
          <Tabs.Tab title="Info" icon="ph-info">
            <Info file={props.file} />
          </Tabs.Tab>

          <Tabs.Tab title="Exposure" icon="ph-pencil" open>
            <Panel model={props.models.basic} />
          </Tabs.Tab>
        </Tabs>
      </div>
    </div>
  );
}

function Panel(props: { model: PropertyModel }) {
  const properties = useProperties(props.model, () =>
    Model.properties(props.model)
  );

  return (
    <div class="select-none pb-2">
      {properties().map(([name, property], i) => {
        return <PanelProperty property={property} name={name.toString()} />;
      })}
    </div>
  );
}

function PanelProperty(props: { name: string; property: PropertyType }) {
  const { property, name } = props;

  return (
    <div class="grid grid-cols-[1fr] px-2 pt-1 text-sm">
      {property.type === PropertyTag.Float ? (
        <>
          <label class="mb-1 mr-2">
            {property.attr.label?.replace("{#}", property.value.toString()) ||
              name}
          </label>
          <fluid-input
            steps={0.01}
            min={property.attr.min}
            max={property.attr.max}
            value={property.value}
            class="h-6 w-full text-xs"
            onChange={(e) => {
              property.value = Number.parseFloat(e.currentTarget.value);
            }}
          />
        </>
      ) : null}

      {/* {property.type === PropertyTag.Range ? (
        <>
          <label class="mr-2 mb-2">
            {property.attr.label?.replace('{#}', property.value.toString()) || name}
          </label>
        </>
      ) : null}

      {property.type === PropertyTag.Boolean ? <></> : null} */}
    </div>
  );
}
