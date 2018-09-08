# gatsby-plugin-sw

> Tested only on linux with gatsby v2

Add support for making a Gatsby site work offline and more resistant to
bad network connections. It creates a service worker using `workboxBuild.injectManifest`.

If you're using this plugin with `gatsby-plugin-manifest` (recommended) this
plugin should be listed _after_ that plugin so the manifest file can be included
in the service worker.

## Install

`npm install --save gatsby-plugin-sw`

## How to use

```javascript
// In your gatsby-config.js
plugins: [
  {
    resolve: 'gatsby-plugin-sw',
    options: {
      swPath: 'src/utils/my-service-worker.js', // Default to 'src/sw.js'
    },
  },
]
```

```javascript
// In your service worker e.g. src/sw.js

// Required stuff
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js'
)

// The plugin will pass the files to cache here
workbox.precaching.precacheAndRoute([])

// Another things
self.addEventListener('push', () => {
  // ...
})
```

## Options

For now the only option avaible is `swPath` and it's the location of your service worker file.
