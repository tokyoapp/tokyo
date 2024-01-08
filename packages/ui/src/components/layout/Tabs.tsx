import '@atrium-ui/mono/expandable';
import { ParentProps, createSignal } from 'solid-js';
import Icon from '../ui/Icon.jsx';

export function Tabs(props: ParentProps) {
	const children = props.children as Element[];

	return <div>{children}</div>;
}

Tabs.Tab = (props: ParentProps & { title: string; icon: string; open?: boolean }) => {
	const [open, setOpen] = createSignal(props.open || false);

	return (
		<div class="rounded-md bg-zinc-800 border overflow-hidden border-zinc-800 w-[280px] mb-1">
			<button
				type="button"
				title={props.title}
				onClick={() => {
					setOpen(!open());
				}}
				class="w-full rounded-none p-2 text-sm flex items-center"
			>
				<Icon name={props.icon} class="mr-2" />
				<div class="flex-1 text-left">{props.title}</div>

				<Icon name="chevron-right" class="mr-2" />
			</button>

			<a-expandable
				style="--transition-speed: 0.2s; --animation-easing: cubic-bezier(.07,0,0,1.07);"
				data-tab={props.title}
				data-icon={props.icon}
				class={'bg-zinc-800 w-full'}
				opened={open() ? 'true' : undefined}
			>
				{props.children}
			</a-expandable>
		</div>
	);
};
