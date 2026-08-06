const CACHE_NAME = "smart-budget-tracker-v1";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./style.css",

    "./app.js",

    "./manifest.json",

    "./icons/icon-192.png",

    "./icons/icon-512.png"

];





// Install Service Worker

self.addEventListener(
"install",
event => {


    event.waitUntil(

        caches.open(CACHE_NAME)

        .then(
            cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            }

        )

    );


    self.skipWaiting();


});








// Activate Service Worker

self.addEventListener(
"activate",
event => {


    event.waitUntil(

        caches.keys()

        .then(
        cacheNames => {


            return Promise.all(

                cacheNames.map(
                cache => {


                    if(
                    cache !== CACHE_NAME
                    ){

                        return caches.delete(
                            cache
                        );

                    }


                })

            );


        })

    );


    self.clients.claim();


});









// Fetch From Cache First

self.addEventListener(
"fetch",
event => {


    event.respondWith(


        caches.match(
            event.request
        )

        .then(
        response => {


            return response ||

            fetch(
                event.request
            )

            .then(
            networkResponse => {


                return caches.open(
                    CACHE_NAME
                )

                .then(
                cache => {


                    cache.put(
                        event.request,
                        networkResponse.clone()
                    );


                    return networkResponse;


                });


            });


        })

    );


});