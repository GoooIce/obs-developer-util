// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();
  const lottie = document.querySelector('lottie-player');
  lottie.load('https://assets3.lottiefiles.com/packages/lf20_UJNc2t.json');

  const oldState = /** @type {{ count: number} | undefined} */ (vscode.getState());

  const counter = /** @type {HTMLElement} */ (document.getElementById('lines-of-code-counter'));
  console.log('Initial state', oldState);

  let currentCount = (oldState && oldState.count) || 0;
  counter.textContent = `${currentCount}`;

  const button = document.querySelector('vscode-button');
  button.addEventListener('click', () => {
    vscode.postMessage({
      command: 'hello',
      text: '🐛  on line ' + currentCount,
    });
  });

  // setInterval(() => {
  //   counter.textContent = `${currentCount++} `;

  //   // Update state
  //   vscode.setState({ count: currentCount });

  //   // Alert the extension when the cat introduces a bug
  //   if (Math.random() < Math.min(0.001 * currentCount, 0.05)) {
  //     // Send a message back to the extension
  //
  //   }
  // }, 100);

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case 'refactor':
        currentCount = Math.ceil(currentCount * 0.5);
        counter.textContent = `${currentCount}`;
        break;
      case 'lottie':
        //         {
        //     "$mid": 1,
        //     "path": "/k:/obs-developer-util/lottie/clapperboard-1.json",
        //     "scheme": "https",
        //     "authority": "file+.vscode-resource.vscode-cdn.net"
        // }
        // console.log(message.uri);
        const { scheme, authority, path } = message.uri;
        lottie.load(`${scheme}://${authority}${path}`);
        break;
    }
  });
})();
