import star from '../assets/star.svg';

export default function Rating(props: { rating: number }) {
  return (
    <div class="flex gap-1">
      {new Array(props.rating).fill(1).map(() => {
        return <img src={star} width={12} alt="star" />;
      })}
    </div>
  );
}
