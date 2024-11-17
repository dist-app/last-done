import "https://deno.land/x/observability@v0.6.1/preconfigured/from-environment.ts";

import appConfig from '../dist-app-site.json' with { type: "json" };

// Bring in the user-defined server logic
import "../server/main";

import { CollectionEntityApiMapping, DistInterface, SignedOutDistInterface, userNameMap } from './interface/registry';
for (const [collName, mapping] of Object.entries(appConfig.meteorApp.collections)) {
  CollectionEntityApiMapping.set(collName, mapping);
}

import { stringify as stringifyYaml, parseAll as parseAllYaml } from "https://deno.land/std@0.208.0/yaml/mod.ts";
import { DenoKvStorage } from "../../dist-app-deno/server-sdk/modules/storage-deno-kv/mod";
import { DdpInterface, DdpSocket } from "../../dist-app-deno/lib/ddp/server/ddp-impl";
import { EntityEngine } from "../../dist-app-deno/lib/portable/engine";
import { ChoreListApi, ChoreListApiEntities } from '../../dist-app-deno/apis/chore-list/definitions';
import { setupSingleSite } from "../../dist-app-deno/server-sdk/core/single-site";
import { CookieAuthnMethod } from "../../dist-app-deno/lib/auth/authn-methods/cookie";
import { OidcAuthnMethod } from "../../dist-app-deno/lib/auth/authn-methods/oidc";
import { UserEntity } from "../../dist-app-deno/apis/login-server/definitions";
import { IconSpec, svgForIcon } from "../../dist-app-deno/apis/manifest/icon";
import { serveKuberestApis } from "../../dist-app-deno/lib/portable/serve-kuberest";

const server = await setupSingleSite(async (app, siteBaseUrl) => {
  app.auth.addAuthnMethod(new CookieAuthnMethod({
    sessionLengthDays: 14,
  }));
  app.auth.addAuthnMethod(new OidcAuthnMethod());

  const meteor = await setupMeteorApp({
    buildBaseUrl: appConfig.meteorApp.bundle.buildBaseUrl,
    buildCommit: appConfig.meteorApp.bundle.buildCommit,
    rootUrl: siteBaseUrl,
  });

  meteor.registerAutoupdate(DistInterface);
  meteor.registerAutoupdateForceReload(SignedOutDistInterface);

  app.mountWebManifest('/-/app.webmanifest', {
    name: appConfig.appName,
    short_name: appConfig.appName,
    start_url: '/',
    id: '/',
    display: 'minimal-ui',
    theme_color: appConfig.appIcon.glyph.backgroundColor,
    background_color: '#333',
    description: appConfig.appDesc,
    icons: [{
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'maskable',
      src: 'app-icon-maskable.svg',
    }, {
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any',
      src: 'app-icon-full.svg',
    }],
  });
  app.mountPathHandler('/-/app-icon-maskable.svg', [], () =>
    new Response(svgForIcon(appConfig.appIcon as IconSpec, '5 5 50 50'), {
      headers: {
        'content-type': 'image/svg+xml',
      },
    }));
  app.mountPathHandler('/-/app-icon-full.svg', [], () =>
    new Response(svgForIcon(appConfig.appIcon as IconSpec, '10 10 40 40'), {
      headers: {
        'content-type': 'image/svg+xml',
      },
    }));

  app.mountPathHandler('/.well-known/openid-registration', [], () => {
    return Response.json({
      application_type: "web",
      redirect_uris: [`${siteBaseUrl}/auth/receive-oidc`],
      client_name: appConfig.appName,
      logo_uri: `${siteBaseUrl}/-/app-icon-full.svg`,
      subject_type: "public",
      token_endpoint_auth_method: "private_key_jwt",
      jwks_uri: `${siteBaseUrl}/.well-known/jwks.json`,
      contacts: ["dan@danopia.net"], // TODO
    });
    // more docs: https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
  });

  app.mountPathPrefixHandler('/-/apis', ['authed'], async (req, match, user) => {
    if (!user) return new Response('not authed', {status: 404});
    const engine = await getUserEngine(user);
    return await serveKuberestApis(req, {
      pathname: `apis/${match.pathname.groups['rest'] ?? ''}`,
      search: match.search.input,
    }, engine);
  });

  app.mountPathHandler('/-/manage/database_export', ['authed'], async (_req, _match, user) => {
    if (!user) return new Response('not authed', {status: 404});
    const engine = await getUserEngine(user);
    const choreApi = new ChoreListApi(engine);
    const items = await Promise.all([
      choreApi.listChores().then(x => x.map(y => {
        y.apiVersion = 'chore-list.dist.app/v1alpha1';
        y.kind = 'Chore';
        return y;
      })),
      choreApi.listChoreActions().then(x => x.map(y => {
        y.apiVersion = 'chore-list.dist.app/v1alpha1';
        y.kind = 'ChoreAction';
        return y;
      })),
      choreApi.listTasks().then(x => x.map(y => {
        y.apiVersion = 'chore-list.dist.app/v1alpha1';
        y.kind = 'Task';
        return y;
      })),
    ]).then(x => x.flat(1).map(y => {
      // try putting the fields in a sane order
      const {apiVersion, kind, metadata, ...rest} = y;
      return {apiVersion, kind, metadata, ...rest};
    }));
    return new Response([
      `# Saved from ${siteBaseUrl}`,
      `# Subject: ${user.metadata.name}`,
      `# Date: ${new Date().toISOString()}`,
    ].join('\n')+'\n\n'+items.map(entry => '---\n'+stringifyYaml(entry, {skipInvalid: true})+'\n').join(''));
  });

  app.mountPathHandler('/-/manage/database_upload', ['authed'], async (req, _match, user) => {
    if (!user) return new Response('not authed', {status: 404});
    const engine = await getUserEngine(user);
    const choreApi = new ChoreListApi(engine);

    const formData = await req.formData();
    const overwrite = formData.get('overwrite');
    if (overwrite != 'on') throw new Error('restore permission not granted');
    const upload = formData.get('upload');
    if (!upload) throw new Error(`No upload given`);
    if (!(upload instanceof File)) throw new Error(`upload wasn't a File`);

    const yamlText = await new Response(upload).text();
    if (!yamlText.startsWith('# Saved from ')) throw new Error(`Doesn't look like a backup`);
    const yamlDocs = parseAllYaml(yamlText) as ChoreListApiEntities[];

    for (const x of await choreApi.listChores()) {
      await choreApi.deleteChore(x.metadata.name);
    }
    for (const x of await choreApi.listChoreActions()) {
      await choreApi.deleteChoreAction(x.metadata.name);
    }
    for (const x of await choreApi.listTasks()) {
      await choreApi.deleteTask(x.metadata.name);
    }

    for (const doc of yamlDocs) {
      await engine.insertEntity(doc);
    }

    return new Response(`<!doctype html>
      <h1>Restore Complete</h1>
      <a href="/">Back to app</a>
    `, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });
  });

  meteor.mountPathnamePatterns(app, appConfig.meteorApp.spaPathPatterns);

  // app.mountPathHandler('/.well-known/skylink-configuration', [], req => {
  //   if (req.method !== 'GET') return new Response('405', {status: 405});
  //   return new Response(JSON.stringify({
  //     // this whole entity is arbitrary, not yet used / based off real needs
  //     "apiVersion": "protocol.dist.app/v1alpha1",
  //     "kind": "EndpointConfiguration",
  //     "spec": {
  //       "wireProtocols": [
  //         "ddp-sockjs-websocket", // This is a standard Meteor DDP socket (plus optional distributed tracing).
  //       ],
  //       "publicApis": [
  //         "manifest.dist.app",
  //         "market.dist.app",
  //       ],
  //     },
  //   }, null, 2), {
  //     headers: {
  //       'content-type': 'application/json',
  //       // 'access-control-allow-origin': req.headers.get('origin') ?? '*',
  //       // 'access-control-allow-credentials': 'true', // meteor techdebt?
  //     },
  //   });
  // });

  app.mountPatternHandler(new URLPattern({
    pathname: '/websocket',
  }), [], async (req, _match, user) => {
    const upgrade = req.headers.get("upgrade") ?? "";
    if (upgrade.toLowerCase() != "websocket") {
      return new Response("request isn't trying to upgrade to websocket.", {
        status: 400,
      });
    }

    if (!user) {
      const { socket, response } = Deno.upgradeWebSocket(req);
      const ddp = new DdpSocket(socket, SignedOutDistInterface, 'raw');
      ddp.closePromise.then(() => {}, () => {});
      return response;
      // return new Response('not authed', {status: 404});
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const ddp = new DdpSocket(socket, DistInterface, 'raw');
    userNameMap.set(ddp, await getUserEngine(user));
    ddp.closePromise.then(() => {}, () => {});
    return response;
  });
});

const userEngines = new Map<string,EntityEngine>();
async function getUserEngine(user: UserEntity): Promise<EntityEngine> {
  let engine = userEngines.get(user.metadata.name);
  if (engine) return engine;

  const storage = await DenoKvStorage.openReactive(['entities', 'user', user.metadata.name]);
  engine = new EntityEngine();
  engine.addApi('chore-list.dist.app', storage, ChoreListApi.definition);

  userEngines.set(user.metadata.name, engine);
  return engine;
}


import { AppServer } from "../../dist-app-deno/server-sdk/core/app-server";

async function setupMeteorApp(opts: {
  buildBaseUrl: string;
  buildCommit: string;
  rootUrl: string;
  publicSettings?: Record<string,unknown>;
}) {

  const buildUrl = `${opts.buildBaseUrl}${opts.buildCommit}`;
  const manifest = await fetch(`${buildUrl}/manifest.json`).then(x => x.json()) as {
    "web.browser": {
      "hashes": {
        "js": string;
        "css": string;
      };
      "html": {
        "body": string;
        "head": string;
      };
    };
    "server": {
      "meteorRelease": string;
      "appId": string;
      "clientArchs": Array<
        | "web.browser"
        | "web.browser.legacy"
      >;
    };
  };

  const appHtml = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="${buildUrl}/web.browser/app.css?meteor_css_resource=true" />
  <link rel="icon" type="image/svg+xml" href="/-/app-icon-full.svg" />
  <link rel="manifest" href="/-/app.webmanifest" />
  ${manifest['web.browser'].html.head}
</head>
<body>
  <div id="_dist_topbar" style="position: sticky; color: #eee; background-color: #333;">
    <div style="display: flex; max-width: 40em; margin: 0 auto; align-items: center;">
      <strong>${appConfig.appName}</strong>
      &nbsp;&mdash;&nbsp;
      <span style="flex: 1;">This software is experimental</span>
      <span id="_dist_connstatus">loading</span>
      <a style="color: #fff; diplay: block; align-self: stretch; padding: 0.25em 1em;" href="/-/manage/">
        manage
      </a>
    </div>
  </div>
  ${manifest['web.browser'].html.body}
  <script type="text/javascript">
   __meteor_runtime_config__ = ${JSON.stringify({
    "meteorRelease": manifest.server.meteorRelease,
    "gitCommitHash": opts.buildCommit,
    "meteorEnv": {
      "NODE_ENV": "production",
      "TEST_METADATA": "{}"
    },
    "DISABLE_SOCKJS": true,
    "PUBLIC_SETTINGS": opts.publicSettings ?? {},
    "ROOT_URL": opts.rootUrl,
    "ROOT_URL_PATH_PREFIX": "",
    "reactFastRefreshEnabled": true,
    "appId": manifest.server.appId,
    "isModern": true,
    "autoupdate": {
      "versions": {
        "web.browser": {
          "version": opts.buildCommit,
          "versionNonRefreshable": manifest['web.browser'].hashes.js, // for whole-page changes
          "versionRefreshable": manifest['web.browser'].hashes.css, // for CSS changes
          // "versionReplaceable": buildCommit, // for HMR
        },
      },
    },
  }, null, 1).replaceAll('\n', '\n   ')}
  </script>
  <script type="text/javascript" src="${buildUrl}/web.browser/app.js?meteor_js_resource=true"></script>
  <script>
    Meteor.startup(() => {
      const statusEl = document.querySelector('#_dist_connstatus');
      Package.tracker.Tracker.autorun(() => {
        const {status, connected, retryCount} = Meteor.connection.status();
        statusEl.innerText = status;
        statusEl.style.display = connected ? 'none' : '';
      });
    });
  </script>
</body>
</html>`;

  return {

    appHtml,

    registerAutoupdate(ddp: DdpInterface) {
      ddp.addPublication('meteor_autoupdate_clientVersions', x => {
        x.added('meteor_autoupdate_clientVersions', 'web.browser', {
          "version": opts.buildCommit,
          "versionNonRefreshable": manifest['web.browser'].hashes.js, // for whole-page changes
          "versionRefreshable": manifest['web.browser'].hashes.css, // for CSS changes
          // "versionReplaceable": buildCommit, // for HMR
          "assets": [{
            "url": `${buildUrl}/app.css?meteor_css_resource=true`,
          }],
        });
        x.ready();
      });
    },

    registerAutoupdateForceReload(ddp: DdpInterface) {
      ddp.addPublication('meteor_autoupdate_clientVersions', x => {
        x.added('meteor_autoupdate_clientVersions', 'web.browser', {
          "version": 'force-reload',
          "versionNonRefreshable": 'force-reload-'+Math.random().toString(16).slice(2),
          "versionRefreshable": 'force-reload',
          // "versionReplaceable": buildCommit, // for HMR
          "assets": [{
            "url": `${buildUrl}/app.css?meteor_css_resource=true`,
          }],
        });
        x.ready();
      });
    },

    mountPathnamePatterns(app: AppServer, pathnames: string[]) {
      for (const pathname of pathnames) {
        app.mountPatternHandler(new URLPattern({
          pathname,
        }), ['authed'], () => {
          return new Response(appHtml, {
            headers: {
              'content-type': 'text/html; charset=utf-8',
            },
          });
        });
      }

      app.mountPathHandler('/-/manage/', ['authed'], (req, _match, _context) => {
        return new Response(`<!doctype html>
          <h1>Manage App</h1>
          <h2>My Data</h2>
          <div style="display: flex; flex-direction: column; max-width: 30em; gap: 1em;">
            <a style="display: inline-block; border: 1px solid blue; background-color: rgba(0,0,0,0.1); padding: 0.75em 2em; text-align: center;" download="backup_last-done_${new Date().toISOString().split('T')[0]}.yaml" href="/-/manage/database_export" target="_blank">
              download backup now
            </a>
            <form enctype="multipart/form-data" method="post" action="/-/manage/database_upload" style="display: flex; flex-direction: column; border: 1px solid red; padding: 0.75em 1em; gap: 0.5em;">
              <span style="display: inline-block; text-align: center;">
                restore from backup...
              </span>
              <input type="file" name="upload" accept=".yaml,.yml" />
              <label><input type="checkbox" name="overwrite" required /> Please delete my existing data and restore from this backup.</label>
              <button type="submit">Restore now</button>
            </form>
          </div>
        `, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        });
      });
    }

    // mountWebsocket(app: AppServer) {}

  }
}

server.serveHttp();
