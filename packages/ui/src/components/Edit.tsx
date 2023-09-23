import '@atrium-ui/mono/expandable';
import { Entry } from '../Library.ts';
import Icon from './Icon.tsx';

function Seperator() {
  return <hr class="border-zinc-800" />;
}

export default function Info(props: {
  file?: Entry;
}) {
  return (
    <div class="bg-zinc-900 w-full h-full overflow-auto absolute">
      {!props.file ? (
        <div class="p-3 text-center text-xs opacity-50 mt-10">No file selected</div>
      ) : (
        <>
          <Icon name="loader" />
        </>
      )}
    </div>
  );
}
