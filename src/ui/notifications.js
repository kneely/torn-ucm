let notificationCount = 0;

/**
 * Show a toast notification that auto-dismisses after 10 seconds.
 */
export function showNotification(message, durationMs = 10000) {
  const id = `ucm-notification-${++notificationCount}`;

  const el = document.createElement('div');
  el.id = id;
  el.className = 'ucm-notification';
  el.textContent = message;

  // Stack notifications
  const existing = document.querySelectorAll('.ucm-notification');
  const topOffset = 10 + existing.length * 60;
  el.style.top = `${topOffset}px`;

  document.body.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'ucm-slide-out 0.3s ease-in forwards';
    setTimeout(() => el.remove(), 300);
  }, durationMs);
}
