export const haptics = {
  vibrate: (pattern: number | number[]) => {
    if (typeof window === 'undefined') return;
    if (!('vibrate' in navigator)) return;
    
    try {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Vibration API error:', error);
    }
  },
  success: () => {
    console.log('Haptic Trigger: success');
    haptics.vibrate([15, 50, 15]);
  },
  warning: () => {
    console.log('Haptic Trigger: warning');
    haptics.vibrate([30, 50, 30]);
  },
  button: () => {
    // console.log('Haptic Trigger: button');
    haptics.vibrate(10);
  },
  drag: () => {
    // console.log('Haptic Trigger: drag');
    haptics.vibrate(5);
  },
  nav: () => {
    // console.log('Haptic Trigger: nav');
    haptics.vibrate(15);
  },
};
