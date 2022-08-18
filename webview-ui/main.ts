import { vscode } from './vscode';
import { fromEvent, filter, map } from 'rxjs';
import { LottiePlayer } from '@lottiefiles/lottie-player';

interface EventMessage {
  data: { command: string; message: any };
}

const player = document.querySelector('lottie-player') as LottiePlayer;
// const oldState = vscode.getState();
fromEvent<EventMessage>(window, 'message')
  .pipe(
    map((e) => e.data),
    filter((e) => e.command === 'lottie'),
    map((e) => e.message)
  )
  .subscribe({
    next: (msg) => {
      console.log(msg);

      if (player) player.load(msg);
    },
  });
const button = document.querySelector('vscode-button');
if (button)
  fromEvent(button, 'click').subscribe({
    next: (e: Event) => {
      vscode.postMessage({ command: 'hello', text: 'test' + e.type });
    },
  });

if (player)
  fromEvent(player, 'complete').subscribe({
    next: (e: Event) => {
      vscode.postMessage({ command: 'player-complete' });
    },
  });
