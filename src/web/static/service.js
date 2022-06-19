function log(...str) {
  console.log("[Cache]", ...str);
}

const CACHE_NAME = "e2e-dashboard-artifacts";
const cached_routes = ["/artifacts"];

// @ts-ignore
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (cached_routes.find((route) => url.pathname.match(route))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            log("Serve from cache", url.pathname);
          }

          return (
            response ||
            fetch(event.request).then((response) => {
              log("Add to cache", url.pathname);
              cache.put(event.request, response.clone());
              return response;
            })
          );
        });
      })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});
