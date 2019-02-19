import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Helmet from 'react-helmet';
import indexTemplate from '../build/index.html';
import App from '../src/App';

/** Asserts that a string replace actually replaced something */
function assertReplace(string, value, replacement) {
  let success = false;
  const result = string.replace(value, () => {
    success = true;
    return replacement;
  });

  if (!success) {
    throw new Error(
      `Unable to match replace token '${value}' in public/index.html template. If the HTML shell for the app is modified, also fix the replaces in server.js. Server-side rendering has failed!`
    );
  }

  return result;
}
/**
 * Main entry point to the application when run via Server-Side Rendering,
 * either in Integrated Mode, or with a Node proxy host like the node-headless-ssr-proxy sample.
 * This function will be invoked by the server to return the rendered HTML.
 * @param {Function} callback Function to call when rendering is complete. Signature callback(error, successData).
 * @param {string} path Current route path being rendered
 * @param {string} data JSON Layout service data for the rendering from Sitecore
 * @param {string} viewBag JSON view bag data from Sitecore (extensible context stuff)
 */
export function renderView(callback, path, data, viewBag) {
  try {
        let renderedAppHtml = ReactDOMServer.renderToString(
          <App/>
        ); 
        const helmet = Helmet.renderStatic();

        // Inject the rendered app into the index.html template (built from /public/index.html)
        // IMPORTANT: use serialize-javascript or similar instead of JSON.stringify() to emit initial state,
        // or else you're vulnerable to XSS.
        let html = indexTemplate;

        // write the React app
        html = assertReplace(
          html,
          '<div id="root"></div>',
          `<div id="root">${renderedAppHtml}</div>`
        );

        // render <head> contents from react-helmet
        html = assertReplace(
          html,
          '<head>',
          `<head>${helmet.title.toString()}${helmet.meta.toString()}${helmet.link.toString()}`
        );

        callback(null, { html });
  } catch (err) {
    // need to ensure the callback is always invoked no matter what
    // or else SSR will hang
    callback(err, null);
  }
}
