# Properties

Reactive property library.

Responsibilities:

-   Define a property with arbitrary attributes, including a default value.
-   Provide a reactive interface to the property.
-   (TODO) Serialize and deserialize the property state.

## Usage

Define a Model class with properties:

```ts
import { Property, PropertyModel } from "@visio/properties";
import icon from "/icons/Dataviz_Reset.svg?url";

export class SomeModel implements PropertyModel {
    // this class can have other properties and methods
    title = "Some Model";
    icon = icon;

    minMax = Property.Range({
        label: "A Range",
        default: [1, 5000],
        min: 1,
        max: 5000,
    });
}
```

Use the Model in a component:

```ts
function Component() {
    const model = useMemo(() => new SomeModel(), []);
    const props = useProperties(model, (model) => ({
        some: model.minMax.value,
    }));

    return (
        <div>
            <label>{model.title}</label>
            <div>{props.some}</div>
        </div>
    );
}
```
