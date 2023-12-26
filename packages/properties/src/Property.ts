export type PropertyAttributes<Value> = {
  label?: string;
  default: Value;
};

export class BaseProperty<T> {
  attr: PropertyAttributes<T>;

  constructor(attr: PropertyAttributes<T>) {
    this.attr = attr;
    this._value = structuredClone(attr.default);
  }

  private _value: T;

  public _lastModified = Date.now();

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this._lastModified = Date.now();

    for (const cb of this.subscriptions) {
      cb(this);
    }
  }

  isDefault() {
    return JSON.stringify(this._value) === JSON.stringify(this.attr.default);
  }

  reset() {
    this.value = structuredClone(this.attr.default);
  }

  serialize() {
    return JSON.stringify(this.value);
  }

  deserialize(value: string) {
    this.value = JSON.parse(value) as T;
  }

  private subscriptions = new Set<(property: BaseProperty<T>) => void>();

  subscribe(cb: (property: BaseProperty<T>) => void) {
    this.subscriptions.add(cb);
    return () => this.subscriptions.delete(cb);
  }
}

export enum PropertyTag {
  Vector = 'vector',
  DateRange = 'daterange',
  Range = 'range',
  Float = 'float',
  Boolean = 'boolean',
  BooleanGroup = 'booleangroup',
  Text = 'text',
  ColorPalette = 'colorpalette',
}

export type PropertyType =
  | ReturnType<(typeof Property)['Float']>
  | ReturnType<(typeof Property)['DateRange']>
  | ReturnType<(typeof Property)['Range']>
  | ReturnType<(typeof Property)['Boolean']>
  | ReturnType<(typeof Property)['Vector']>;

export class Property<
  Value,
  Attributes extends PropertyAttributes<Value>,
  Type extends PropertyTag,
> extends BaseProperty<Value> {
  constructor(public type: Type, public attr: Attributes & PropertyAttributes<Value>) {
    super(attr);
  }

  /**
   * A single float value with min and max values.
   */
  static get Float() {
    return (
      attr: PropertyAttributes<number> & {
        min?: number;
        max?: number;
      }
    ) => new Property(PropertyTag.Float, attr);
  }

  /**
   * A vector of numbers [0, 100, 1337, 420].
   */
  static get Vector() {
    return (attr: PropertyAttributes<number[]>) => new Property(PropertyTag.Vector, attr);
  }

  /**
   * A number range [0, 100] with min and max values.
   */
  static get Range() {
    return (
      attr: PropertyAttributes<[number, number]> & {
        min?: number;
        max?: number;
      }
    ) => new Property(PropertyTag.Range, attr);
  }

  /**
   * A simple boolean, a checkbox for example.
   */
  static get Boolean() {
    return (attr: PropertyAttributes<boolean>) => new Property(PropertyTag.Boolean, attr);
  }

  /**
   * From Date to Date range select with min and max Dates.
   */
  static get DateRange() {
    return (
      attr: PropertyAttributes<[Date, Date]> & {
        min: Date;
        max: Date;
      }
    ) => new Property(PropertyTag.DateRange, attr);
  }

  /**
   * Simple text input.
   */
  static get Text() {
    return (attr: PropertyAttributes<string>) => new Property(PropertyTag.Text, attr);
  }
}
