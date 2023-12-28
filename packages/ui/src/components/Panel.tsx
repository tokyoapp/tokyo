import { Model, PropertyModel, PropertyTag, PropertyType } from 'tokyo-properties';
import { useProperties } from '../utils/useProperties.ts';
import './FluidInput.ts';

export function Panel(props: { model: PropertyModel }) {
  const properties = useProperties(props.model, () => Model.properties(props.model));

  return (
    <div class="select-none">
      {properties().map(([name, property], i) => {
        return <PanelProperty property={property} name={name.toString()} />;
      })}
    </div>
  );
}

export function PanelProperty(props: { name: string; property: PropertyType }) {
  const { property, name } = props;

  return (
    <div class="grid grid-cols-[1fr] px-2 py-1 text-sm">
      {property.type === PropertyTag.Float ? (
        <>
          <label class="mr-2 mb-1">
            {property.attr.label?.replace('{#}', property.value.toString()) || name}
          </label>
          <fluid-input
            onChange={(e) => {
              property.value = parseFloat(e.currentTarget.value);
            }}
            steps="0.01"
            min={property.attr.min}
            max={property.attr.max}
            value={property.value}
            class="w-full h-7"
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
