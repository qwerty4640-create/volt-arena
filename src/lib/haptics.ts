export const haptics = {
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  warning: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }
  },
  button: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  drag: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
  },
  nav: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  },
};
