import { useEffect, useCallback } from "react";

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: (direction: "forward" | "backward") => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onSpace?: () => void;
  onDelete?: () => void;
  onBackspace?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onEnter,
    onEscape,
    onTab,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onSpace,
    onDelete,
    onBackspace,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Prevent default behavior for navigation keys
      const preventDefaultKeys = [
        "Enter",
        "Escape",
        "Tab",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space",
        "Delete",
        "Backspace",
      ];

      if (preventDefaultKeys.includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case "Enter":
          onEnter?.();
          break;
        case "Escape":
          onEscape?.();
          break;
        case "Tab":
          if (onTab) {
            const direction = event.shiftKey ? "backward" : "forward";
            onTab(direction);
          }
          break;
        case "ArrowUp":
          onArrowUp?.();
          break;
        case "ArrowDown":
          onArrowDown?.();
          break;
        case "ArrowLeft":
          onArrowLeft?.();
          break;
        case "ArrowRight":
          onArrowRight?.();
          break;
        case " ":
          onSpace?.();
          break;
        case "Delete":
          onDelete?.();
          break;
        case "Backspace":
          onBackspace?.();
          break;
      }
    },
    [
      enabled,
      onEnter,
      onEscape,
      onTab,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onSpace,
      onDelete,
      onBackspace,
    ]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return {
    enable: () => (options.enabled = true),
    disable: () => (options.enabled = false),
  };
}

// Hook for managing focus within a component
export function useFocusManagement() {
  const focusNext = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).findIndex(
      (el) => el === document.activeElement
    );
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    (focusableElements[nextIndex] as HTMLElement)?.focus();
  }, []);

  const focusPrevious = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).findIndex(
      (el) => el === document.activeElement
    );
    const previousIndex =
      currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    (focusableElements[previousIndex] as HTMLElement)?.focus();
  }, []);

  const focusFirst = useCallback(() => {
    const firstFocusable = document.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();
  }, []);

  const focusLast = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;
    lastFocusable?.focus();
  }, []);

  return {
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}
