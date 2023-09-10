import Icon from './Icon.tsx';

export default function Rating(props: { rating: number }) {
  return (
    <div class="flex gap-1 text-xs">
      {new Array(props.rating).fill(1).map(() => {
        return <Icon name="star" width={12} />;
      })}
    </div>
  );
}
