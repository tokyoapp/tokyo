import Icon from './Icon.tsx';

export default function Rating(props: { rating: number; empty: boolean }) {
  if (props.empty) {
    return (
      <div class="flex gap-1 text-xs">
        {new Array(5).fill(1).map((i) => {
          if (i > props.rating) {
            return <Icon class="opacity-20" name="star" />;
          } else {
            return <Icon name="star" />;
          }
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
