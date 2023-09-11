import Icon from './Icon.tsx';

export function Stars(props: { value: number; onChange: (value: number) => void }) {
  return (
    <div class="flex items-center">
      {new Array(5).fill(props.value).map((_, i) => {
        return (
          <div
            class={`cursor-pointer p-1 ${props.value > i ? '' : 'opacity-25'} hover:opacity-60`}
            onClick={() => {
              if (i === props.value - 1) {
                props.onChange(0);
              } else {
                props.onChange(i + 1);
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
