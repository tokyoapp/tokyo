# sv-dropdown

Universal dropdown component

## Properties

```typescript
// If the dropdown should open upwards or downwards
<sv-dropdown direction: 'down' | 'up'; />
```

```typescript
// The value or index of the selected option
// If the option does not have a 'value' attribute, indexes will be used.
<sv-dropdown selected: String; />
```

```typescript
// Open state of the dropdown
<sv-dropdown opened: Boolean; />
```

```typescript
// Prevents the dropdown from opening
<sv-dropdown disabled: Boolean; />
```

## Events

```typescript
// Emitted after the dropdown closed
<sv-dropdown @close />
```

```typescript
// Emitted *before* the dropdown opens
<sv-dropdown @open />
```

```typescript
// Emitted after a option has been slected by Click or Enter key
<sv-dropdown @select: ({ option: OptionElement; }) => void />
```

## Example

```tsx
const dropdown = (
	<sv-dropdown
		@select={(e) => {
			this.value = e.option.value;
		}}
	>
		<button slot="input">{{ this.value || 'Select' }}</button>

		<sv-option>Option 1</sv-option>
		<sv-option>Option 2</sv-option>
		<sv-option>Option 3</sv-option>
		<sv-option>Option 4</sv-option>
	</sv-dropdown>
);
```
