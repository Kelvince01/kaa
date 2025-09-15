import { useEffect } from "react";

/**
 * useHideElementsById - A custom React hook to hide elements by their IDs.
 *
 * @param ids - An array of element IDs to hide.
 */
const useHideElementsById = (ids: string[]): void => {
  useEffect(() => {
    const hiddenElements: HTMLElement[] = [];

    for (const id of ids) {
      const element = document.getElementById(id ?? "");
      if (element) {
        element.style.display = "none";
        hiddenElements.push(element);
      }
    }

    return () => {
      for (const hiddenElement of hiddenElements) {
        (hiddenElement as HTMLElement).style.display = "";
      }
    };
  }, [ids]);
};

export default useHideElementsById;
