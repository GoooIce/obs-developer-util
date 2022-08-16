/* eslint-disable no-undef */
const avscode = acquireVsCodeApi();

window.addEventListener('load', main);

function main() {
  const howdyButton = document.getElementById('howdy');
  howdyButton.addEventListener('click', handleHowdyClick);
}

function handleHowdyClick() {
  avscode.postMessage({
    command: 'hello',
    text: 'Hey there partner! 🤠',
  });
}
