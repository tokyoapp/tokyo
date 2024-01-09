import '@atrium-ui/mono/blur';
import '@atrium-ui/mono/command';
import { ParentProps, createSignal } from 'solid-js';
import { t } from 'tokyo-locales';
import Icon from './ui/Icon.jsx';

const MacTitle = () => {
	const dot = 'p-0 w-[14px] h-[14px] border border-zinc-800 hover:border-zinc-800 cursor-default';
	return (
		<div class="w-20 flex gap-[6px] px-2 pointer-events-auto">
			{/* <button
        type="button"
        class={`${dot} hover:bg-red-700`}
        onClick={() => getCurrent().close()}
      />
      <button
        type="button"
        class={`${dot} hover:bg-yellow-400`}
        onClick={() => getCurrent().minimize()}
      />
      <button
        type="button"
        class={`${dot} hover:bg-green-700`}
        onClick={() => getCurrent().toggleMaximize()}
      /> */}
		</div>
	);
};

const WindowsTitle = () => {
	const dot =
		'p-0 w-[45px] h-[32px] rounded-none shadow-none border-none hover:bg-zinc-800 flex items-center justify-center';
	return (
		<div class="flex pointer-events-auto">
			<button type="button" class={`${dot} `} onClick={() => appWindow.minimize()}>
				<Icon name="ph-arrows-in-simple" />
			</button>
			<button type="button" class={`${dot} `} onClick={() => appWindow.toggleMaximize()}>
				<Icon name="ph-corners-out" />
			</button>
			<button type="button" class={`${dot} `} onClick={() => appWindow.close()}>
				<Icon name="ph-x" />
			</button>
		</div>
	);
};

export const [cmdOpen, setCmdOpen] = createSignal(false);

export default function Titlebar(props: { style: string } & ParentProps) {
	return (
		<>
			<div
				data-tauri-drag-region
				class="relative z-50 bg-[rgba(24,24,27,0.9)] border-b border-zinc-800 flex justify-between items-start"
			>
				<div class="w-full h-11 py-2 px-2 pointer-events-none grid grid-cols-[350px_1fr_350px] items-center text-xs text-zinc-500">
					<div class="flex gap-4 items-center">
						{props.style === 'macos' ? <MacTitle /> : null}
						<div />
						<div>
							{props.children}

							{/* {location() */}
							{/*   .path.split('/') */}
							{/*   .slice(1) */}
							{/*   .map((part, i) => { */}
							{/*     if (i >= 1) { */}
							{/*       return ( */}
							{/*         <> */}
							{/*           <span>/</span> */}
							{/*           <Combobox class="px-1 pointer-events-auto" items={[]} title={part}> */}
							{/*             <span>{part}</span> */}
							{/*             <Icon class="pl-2" name="expand-down" /> */}
							{/*           </Combobox> */}
							{/*         </> */}
							{/*       ); */}
							{/*     } */}
							{/*     return <span>/{part}</span>; */}
							{/*   })} */}
						</div>
					</div>
					<div class="justify-self-center">
						<button
							type="button"
							onClick={() => setCmdOpen(true)}
							class="shadow-none border-zinc-800 bg-[#151517] pointer-events-auto py-[5px] w-80 text-zinc-500"
						>
							<span>{t('search')}</span>
							<Icon class="px-2" name="ph-magnifying-glass" />
						</button>
					</div>
					<div />
				</div>

				{props.style === 'windows' ? <WindowsTitle /> : null}
			</div>

			{cmdOpen() ? (
				<a-blur
					enabled
					onBlur={() => setCmdOpen(false)}
					class="z-50 fixed top-0 left-0 w-full h-1/2 flex justify-center items-center"
				>
					<a-command placeholder="Search" class="pointer-events-auto">
						<div class="prefix" slot="before-input">
							<Icon name="ph-arrow-right" />
						</div>

						<div class="item [&[selected]]:bg-white">Some Item 1</div>
						<div class="item [&[selected]]:bg-white">Some Item 1</div>
						<div class="item [&[selected]]:bg-white">Some Item 1</div>
						<div class="item [&[selected]]:bg-white">Some Item 1</div>
						<div class="item [&[selected]]:bg-white">Some Item 1</div>
					</a-command>
				</a-blur>
			) : null}
		</>
	);
}
