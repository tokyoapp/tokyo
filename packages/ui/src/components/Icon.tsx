const icons = {
  star: await import('../../assets/icons/star.svg?raw'),
} as const;

// TODO: keep rive icons here too

type Props = {
  name: keyof typeof icons;
  width: number;
};

export default function Icon(props: Props) {
  return <div class="icon" innerHTML={icons[props.name].default} />;
}
