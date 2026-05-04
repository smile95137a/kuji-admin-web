// src/utils/dialog/createDialog.ts
import { VNodeChild, createVNode, render, type AppContext } from 'vue';

declare global {
  interface Window {
    __APP_CONTEXT__?: AppContext;
  }
}

export interface DialogController {
  close: () => void;
}

/**
 * 建立暫時性的 dialog，並繼承主 app 的 appContext
 */
export function createDialog(
  renderDialog: (close: () => void) => VNodeChild,
): DialogController {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const close = () => {
    render(null, container);
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const vnode = createVNode({
    render: () => renderDialog(close),
  });

  if (window.__APP_CONTEXT__) {
    vnode.appContext = window.__APP_CONTEXT__;
  }

  render(vnode, container);

  return { close };
}
