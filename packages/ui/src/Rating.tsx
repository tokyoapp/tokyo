import star from '../assets/star.svg';

export default function Rating({ rating }: { rating: number }) {
  return rating > 0 ? (
    <div class="flex gap-1">
      {new Array(rating).fill(1).map(() => {
        return <img src={star} width={12} alt="star" />;
      })}
    </div>
  ) : null;
}
