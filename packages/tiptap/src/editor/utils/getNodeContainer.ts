import type { Editor } from "@tiptap/react";

export const getNodeContainer = (editor: Editor, selector: string) => {
  const {
    view,
    state: {
      selection: { from },
    },
  } = editor;

  let container: HTMLElement | null = (view.nodeDOM(from) ||
    view.domAtPos(from).node) as HTMLElement;

  while (
    container &&
    container?.nodeName.toLocaleLowerCase() !== selector.toLocaleLowerCase()
  ) {
    container = container.parentElement;
  }

  return container;
};
