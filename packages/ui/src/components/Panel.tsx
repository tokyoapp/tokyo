export function Panel(props: { model: PropertyModel }) {
  const [model] = useProperties(props.model, (model) => [model]);

  return (
    <div class="mb-1 select-none">
      {Model.properties(model).map(([name, property], i) => {
        return <PanelProperty key={`model_property_${i}`} property={property} name={name} />;
      })}
    </div>
  );
}

export function PanelProperty(props: { name: string; property: PropertyType }) {
  const { property, name } = props;

  return (
    <div class="grid grid-cols-[1fr] mb-3">
      {property.type === PropertyTag.Float ? (
        <>
          <label class="mr-2 mb-2">
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
