export const haptics = {
  success: () => {
    console.log('Haptic Trigger: success');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  warning: () => {
    console.log('Haptic Trigger: warning');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }
  },
  button: () => {
    console.log('Haptic Trigger: button');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  drag: () => {
    console.log('Haptic Trigger: drag');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
  },
  nav: () => {
    console.log('Haptic Trigger: nav');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  },
};
