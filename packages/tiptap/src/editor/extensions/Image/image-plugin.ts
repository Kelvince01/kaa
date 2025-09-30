import { findChildren } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { NodeWithPos } from "@tiptap/react";

type ImageDimensions = {
  width: number;
  height: number;
};

export const ImagePluginKey = new PluginKey("image");

export function ImagePlugin({ name }: { name: string }) {
  return new Plugin({
    key: ImagePluginKey,
    view(view) {
      return {
        update: async () => {
          const imageBlocks = findChildren(
            view.state.doc,
            (node) =>
              node.type.name === name &&
              !(node.attrs.naturalWidth && node.attrs.naturalHeight)
          );

          if (imageBlocks.length === 0) return;

          const results = await Promise.all(
            imageBlocks.flatMap(({ node }) =>
              getDimensionsImage(node.attrs.src)
            )
          );

          const tr = view.state.tr;
          results.forEach((result, index) => {
            if (result) {
              const { pos, node } = imageBlocks[index] as NodeWithPos;
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                naturalWidth: result.width,
                naturalHeight: result.height,
              });
            }
          });

          tr.setMeta("addToHistory", false);
          tr.setMeta("preventUpdate", true);
          view.dispatch(tr);
        },
      };
    },
  });
}

const getDimensionsImage = async (url: string): Promise<ImageDimensions> =>
  await new Promise((resovle, reject) => {
    const img = new Image();
    img.onload = () =>
      resovle({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
