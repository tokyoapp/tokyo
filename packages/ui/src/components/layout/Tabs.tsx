import "@atrium-ui/elements/expandable";
import { type ParentProps, createSignal } from "solid-js";
import Icon from "../ui/Icon.jsx";

export function Tabs(props: ParentProps) {
  const children = props.children as Element[];

  return <div>{children}</div>;
}

Tabs.Tab = (props: ParentProps & { title: string; icon: string; open?: boolean }) => {
  const [open, setOpen] = createSignal(props.open || false);

  return (
    <div class="mb-1 w-[280px] overflow-hidden rounded-md border border-zinc-800 bg-zinc-800">
      <button
        type="button"
        title={props.title}
        onClick={() => {
          setOpen(!open());
        }}
        class="flex w-full items-center rounded-none p-2 text-sm"
      >
        <Icon name={props.icon} class="mr-2" />
        <div class="flex-1 text-left">{props.title}</div>

        <Icon name="chevron-right" class="mr-2" />
      </button>

      <a-expandable
        style="--transition-speed: 0.2s; --animation-easing: cubic-bezier(.07,0,0,1.07);"
        data-tab={props.title}
        data-icon={props.icon}
        class={"w-full bg-zinc-800"}
        opened={open() ? "true" : undefined}
      >
        {props.children}
      </a-expandable>
    </div>
  );
};
