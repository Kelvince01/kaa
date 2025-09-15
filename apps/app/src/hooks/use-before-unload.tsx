import { useEffect, useRef } from "react";

type UseBeforeUnloadOptions = {
  when?: boolean;
  message?: string;
};

export function useBeforeUnload({
  when = true,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UseBeforeUnloadOptions = {}) {
  const messageRef = useRef(message);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    if (!when) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = messageRef.current;
      return messageRef.current;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [when]);
}
