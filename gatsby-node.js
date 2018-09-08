const fs = require(`fs`)
const workboxBuild = require(`workbox-build`)
const path = require(`path`)
const slash = require(`slash`)
const _ = require(`lodash`)
const os = require('os')

const getResourcesFromHTML = require(`./get-resources-from-html`)

exports.createPages = ({ actions }) => {
  if (process.env.NODE_ENV === `production`) {
    const { createPage } = actions
    createPage({
      path: `/offline-plugin-app-shell-fallback/`,
      component: slash(path.resolve(`${__dirname}/app-shell.js`)),
    })
  }
}

let s
const readStats = () => {
  if (s) {
    return s
  } else {
    s = JSON.parse(
      fs.readFileSync(`${process.cwd()}/public/webpack.stats.json`, `utf-8`)
    )
    return s
  }
}

const getAssetsForChunks = (chunks) => {
  const files = _.flatten(
    chunks.map((chunk) => readStats().assetsByChunkName[chunk])
  )
  return _.compact(files)
}

exports.onPostBuild = (args, pluginOptions) => {
  const program = args.store.getState().program

  const rootDir = `public`

  // Get exact asset filenames for app and offline app shell chunks
  const files = getAssetsForChunks([
    `app`,
    `webpack-runtime`,
    `component---node-modules-gatsby-plugin-offline-app-shell-js`,
  ])

  const criticalFilePaths = _.uniq(
    _.concat(
      getResourcesFromHTML(`${process.cwd()}/${rootDir}/index.html`),
      getResourcesFromHTML(`${process.cwd()}/${rootDir}/404.html`),
      getResourcesFromHTML(
        `${process.cwd()}/${rootDir}/offline-plugin-app-shell-fallback/index.html`
      )
    )
  )

  const globPatterns = files.concat([
    `index.html`,
    `offline-plugin-app-shell-fallback/index.html`,
    ...criticalFilePaths,
  ])

  const manifests = [`manifest.json`, `manifest.webmanifest`]
  manifests.forEach((file) => {
    if (fs.existsSync(`${rootDir}/${file}`)) globPatterns.push(file)
  })

  const options = {
    globDirectory: rootDir,
    globPatterns,
    modifyUrlPrefix: {
      rootDir: ``,
      // If `pathPrefix` is configured by user, we should replace
      // the default prefix with `pathPrefix`.
      '': args.pathPrefix || ``,
    },
  }

  // Set the swPath to the path passed orthe default one
  const swPath = pluginOptions.swPath || `src/sw.js`

  const swDest = `public/sw.js`
  let swSrc = path.join(program.directory, swPath)

  // Windows specifics
  if (os.platform() == `win32`) {
    swSrc = swSrc.split(`\\`).join(`\\\\`)
  }

  return workboxBuild
    .injectManifest({ swDest, swSrc, ...options })
    .then(({ count, size, warnings }) => {
      if (warnings) warnings.forEach(console.warn)
      console.log(
        `Generated ${swDest}, which will precache ${count} files, totaling ${size} bytes.`
      )
    })
}
