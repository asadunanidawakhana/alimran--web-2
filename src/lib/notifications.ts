/**
 * Browser Notification API helper
 * Works on localhost + Netlify without any server/VAPID keys.
 * Uses the Web Notifications API (available in all modern browsers).
 */

let notificationSound: HTMLAudioElement | null = null;

function getSound(): HTMLAudioElement {
  if (!notificationSound) {
    // Use a reliable free notification sound CDN URL
    notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    notificationSound.volume = 0.7;
  }
  return notificationSound;
}

/**
 * Request notification permission from the browser.
 * Call this once at app startup.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Send a browser notification.
 */
export function sendBrowserNotification(title: string, body: string, icon?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'battle-notification', // prevents duplicate notifications
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Focus the window when clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    // Silently fail — notifications are optional
    console.warn('Notification failed:', err);
  }
}

/**
 * Play the match notification sound.
 */
export function playMatchSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const sound = getSound();
    sound.currentTime = 0;
    sound.play().catch(() => {
      // Browser may block autoplay — that's okay
    });
  } catch (err) {
    // Silently fail
  }
}

/**
 * Called when a user starts searching for a 1v1 match.
 * Broadcasts a notification to other users via Supabase Realtime.
 */
export function sendMatchNotification(username: string): void {
  // Send browser notification to the current tab's other windows
  // The actual cross-user notification happens via Supabase realtime
  // in the battle page subscription
  sendBrowserNotification(
    '⚔️ Duel Request',
    `${username} is looking for a 1v1 match!`,
  );
}

/**
 * Called when a match is found — plays sound + shows notification.
 */
export function onMatchFound(opponentName: string): void {
  playMatchSound();
  sendBrowserNotification('🏆 Match Found!', `You are now battling ${opponentName}!`);
}
