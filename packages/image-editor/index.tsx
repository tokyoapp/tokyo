import { createSignal } from 'solid-js';
import { Viewer } from './src/Viewer';

const [greetMsg, setGreetMsg] = createSignal('');

export function ImageEditor({ onOpen }: { onOpen: () => void }) {
  return (
    <div class="container">
      <form
        class="row"
        onSubmit={(e) => {
          e.preventDefault();
          onOpen();
        }}
      >
        <input id="greet-input" placeholder="..." />
        <button type="submit">Open</button>
      </form>

      <Viewer />

      <p>{greetMsg()}</p>
    </div>
  );
}
