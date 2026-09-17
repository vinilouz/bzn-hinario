import { useRef, useEffect, useCallback } from "react";

export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      startXRef.current = e.pageX - el.offsetLeft;
      startScrollLeftRef.current = el.scrollLeft;
      el.style.cursor = "grabbing";
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || e.pointerType !== "mouse") return;
      const x = e.pageX - el.offsetLeft;
      const walk = x - startXRef.current;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      el.scrollLeft = startScrollLeftRef.current - walk;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      isDraggingRef.current = false;
      el.style.cursor = "";
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 50);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return { ref, handleClickCapture };
}
