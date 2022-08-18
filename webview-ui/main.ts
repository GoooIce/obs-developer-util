import { vscode } from './vscode';
import { fromEvent } from 'rxjs';
import { LottiePlayer } from '@lottiefiles/lottie-player';

const oldState = vscode.getState();
const button = document.querySelector('vscode-button');
if (button)
  fromEvent(button, 'click').subscribe({
    next: (e: Event) => {
      vscode.postMessage({ command: 'hello', text: 'test' + e.type });
    },
  });
