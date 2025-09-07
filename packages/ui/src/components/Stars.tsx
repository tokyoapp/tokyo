import Icon from "./Icon.jsx";

export function Stars(props: {
  value: number;
  onChange?: (value: number) => void;
}) {
  return (
    <div class="flex items-center">
      {new Array(5).fill(props.value).map((_, i) => {
        return (
          <div
            class={`p-1 ${props.value > i ? "" : "opacity-25"} hover:opacity-60`}
            onClick={() => {
              if (i === props.value - 1) {
                props.onChange?.(0);
              } else {
                props.onChange?.(i + 1);
              }
            }}
          >
            <Icon name="star" />
          </div>
        );
      })}
    </div>
  );
}

export function Rating(props: { rating: number; empty: boolean }) {
  if (props.empty) {
    return (
      <div class="flex gap-1 text-xs">
        {new Array(5).fill(1).map((i) => {
          if (i > props.rating) {
            return <Icon class="opacity-20" name="star" />;
          }
          return <Icon name="star" />;
        })}
      </div>
    );
  }

  return (
    <div class="flex gap-1 text-xs">
      {new Array(props.rating).fill(1).map(() => {
        return <Icon name="star" />;
      })}
    </div>
  );
}
