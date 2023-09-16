import { ParentProps, createSignal } from 'solid-js';
import Icon from './Icon.tsx';

export function Tabs(props: ParentProps) {
  const children = props.children as Element[];

  const [currentTab, setCurrentTab] = createSignal(children[0].getAttribute('data-tab'));

  return (
    <div class="grid grid-cols-[32px_1fr] h-full">
      <div class="flex flex-col">
        {children.map((child) => {
          const tab = child.getAttribute('data-tab') as string;
          const icon = child.getAttribute('data-icon') as string;

          return (
            <button
              type="button"
              title={tab}
              data-selected={tab === currentTab() || undefined}
              onClick={() => setCurrentTab(tab)}
              class="data-[selected]:bg-zinc-900 rounded-none rounded-l-md bg-zinc-950 mr-0 mb-1 px-0 py-2 text-sm flex justify-center items-center"
            >
              <Icon name={icon} />
            </button>
          );
        })}
      </div>
      <div class="relative">
        {children.find((child) => {
          return child.getAttribute('data-tab') === currentTab();
        })}
      </div>
    </div>
  );
}

Tabs.Tab = function (props: ParentProps & { tab: string; icon: string }) {
  return (
    <div data-tab={props.tab} data-icon={props.icon}>
      {props.children}
    </div>
  );
};
