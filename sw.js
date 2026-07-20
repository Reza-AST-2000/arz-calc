const CACHE_NAME = "calc-arz-v89";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          fetch(url, { cache: "reload" }).then((res) => cache.put(url, res))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return; // let external API calls pass straight through

  // برای درخواست‌های ناوبری (باز کردن خود اپ — چه عادی چه از میان‌برهای آیکون که query string دارن مثل ?tool=pass)
  // همیشه پوسته‌ی اصلی اپ (index.html) رو مستقیم از کش برگردون، صرف‌نظر از باقی آدرس —
  // این باعث می‌شه هم میان‌برها همیشه کار کنن، هم کل اپ واقعاً و مطمئن آفلاین باز بشه
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => {
        return cached || fetch(event.request).catch(() => cached);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        }).catch(() => cached)
      );
    })
  );
});

// وقتی کاربر رو اعلان یادآوری انقضا کلیک می‌کنه، مستقیم ابزار "انقضای مدارک" باز بشه
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = "./index.html?tool=expiry";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// بررسی دوره‌ای در پس‌زمینه (فقط مرورگرهایی که Periodic Background Sync رو پشتیبانی می‌کنن، مثلاً کروم روی اندروید با اپ نصب‌شده)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "expiry-check") {
    event.waitUntil(checkExpiryFromIDB());
  }
});

function openKVStore() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("toolsAppDB", 1);
    req.onupgradeneeded = () => { req.result.createObjectStore("kv"); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function checkExpiryFromIDB() {
  try {
    const db = await openKVStore();
    const data = await new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get("expiryData");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (!data || !Array.isArray(data.items)) return;
    const reminderDays = Array.isArray(data.reminderDays) ? data.reminderDays : [30, 7, 1];
    const notified = data.notified || {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let changed = false;
    for (const item of data.items) {
      const expDate = new Date(item.gregDate);
      const diffDays = Math.round((expDate - today) / 86400000);
      for (const threshold of reminderDays) {
        if (diffDays !== threshold) continue;
        const key = item.id + "-" + threshold;
        if (notified[key]) continue;
        const body = diffDays === 0
          ? "امروز منقضی می‌شه!"
          : diffDays < 0
            ? "منقضی شده (" + Math.abs(diffDays) + " روز پیش)"
            : diffDays + " روز تا انقضا مونده — " + item.displayDate;
        await self.registration.showNotification("📆 یادآوری: " + item.name, {
          body,
          icon: "./icons/icon-192.png",
          badge: "./icons/icon-192.png",
          tag: "expiry-" + item.id,
          data: { tool: "expiry" }
        });
        notified[key] = true;
        changed = true;
      }
    }
    if (changed) {
      const db2 = await openKVStore();
      const tx2 = db2.transaction("kv", "readwrite");
      tx2.objectStore("kv").put({ items: data.items, reminderDays, notified }, "expiryData");
    }
  } catch (e) {
    // اگه IndexedDB در دسترس نبود یا خالی بود، بی‌خیال شو — بررسی موقع باز کردن اپ همچنان انجام می‌شه
  }
}
