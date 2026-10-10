/* push-sw.js — push notification handling (loaded from sw.js with importScripts) */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }
  const urgent = data.urgent === true;
  event.waitUntil(
    self.registration.showNotification(data.title || "Salud Familiar", {
      body: data.body || "",
      icon: "icon-192.png",
      badge: "icon-192.png",
      tag: data.tag || "medicion-mensual",
      renotify: true,
      requireInteraction: urgent, // the urgent one stays until tapped
      vibrate: urgent ? [300, 150, 300, 150, 600] : [120],
      data: { url: data.url || "./?tab=medidas" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./?tab=medidas";
  event.waitUntil(
    (async () => {
      const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of wins) {
        if ("focus" in w) {
          await w.focus();
          w.postMessage({ type: "goto-medidas" });
          return;
        }
      }
      await clients.openWindow(url);
    })(),
  );
});
