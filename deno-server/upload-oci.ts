#!/usr/bin/env -S deno run --allow-env --allow-net --allow-run=deno,find,docker-credential-google-oidc --allow-read=.,${HOME} --allow-write=/tmp,/home/runner/work/_temp

import { UntarStream } from "jsr:@std/tar@0.1.4/untar-stream";
import { TarStream, TarStreamInput } from "jsr:@std/tar@0.1.4/tar-stream";

import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import type { ModuleGraphJson } from "https://deno.land/x/deno_graph@0.69.6/types.ts";

import { OciStoreInmem } from "https://raw.githubusercontent.com/cloudydeno/denodir-oci/0d4af268aae92cd1f581a251e6f44027af62f018/lib/store/in-memory.ts";
import { pushFullArtifact } from "https://raw.githubusercontent.com/cloudydeno/denodir-oci/0d4af268aae92cd1f581a251e6f44027af62f018/doci/transfers.ts";
import { gzipStream } from "https://raw.githubusercontent.com/cloudydeno/denodir-oci/0d4af268aae92cd1f581a251e6f44027af62f018/lib/util/gzip.ts";

const annotations: Record<string, string> = {
  'org.opencontainers.image.created': new Date().toISOString(),
  'org.opencontainers.image.description': `A dist-app-deno application artifact. This is not a container image.`,
};
{
  const gitSha = Deno.env.get('GITHUB_SHA');
  if (gitSha) {
    annotations['org.opencontainers.image.revision'] = gitSha;
  }
  const gitServer = Deno.env.get('GITHUB_SERVER_URL');
  const gitRepo = Deno.env.get('GITHUB_REPOSITORY');
  if (gitServer && gitRepo) {
    annotations['org.opencontainers.image.source'] = `${gitServer}/${gitRepo}`;
  }
}

const configJson = JSON.parse(await Deno.readTextFile('./dist-app-site.json'));
if (!configJson?.denoDeploy) throw "No deno deploy description found";
const deployment = await deployEntrypoint({
  entrypoint: "deno-server/server.ts",
  importMap: "import-map.json",
  appDir: ".",
  configJson,
});
console.log(`Pushed to`, deployment.destination.canonicalRef);

interface Asset {
  "kind": "file";
  "content": string;
  "encoding"?: "utf-8" | "base64";
};

async function deployEntrypoint(settings: {
  entrypoint: string;
  subdomain?: string;
  appDir?: string;
  importMap?: string;
  configJson: {
    denoDeploy: Record<string,unknown>;
  };
}) {
  const appDir = settings.appDir ?? settings.entrypoint.slice(0, settings.entrypoint.lastIndexOf('/'));

  const infoFlags = ['--json'];
  if (settings.importMap) {
    infoFlags.push('--importmap', settings.importMap);
  }
  const graphOutput = await new Deno.Command('deno', {
    args: ['info', ...infoFlags, '--', settings.entrypoint],
    stdout: 'piped',
    stderr: 'inherit',
  }).output();
  if (!graphOutput.success) throw new Error(`deno info crashed`);
  const graphJson: ModuleGraphJson = JSON.parse(new TextDecoder().decode(graphOutput.stdout));

  const assets = new Array<[string,Asset]>;
  let assetSize = 0;
  const cwd = Deno.cwd();
  for (const module of graphJson.modules) {
    if (!module.specifier.startsWith('file://')) continue;
    if (module.error) throw new Error(`Module ${module.specifier} failed:\n${module.error}`);
    if (!module.local) continue;
    if (!module.local.startsWith(cwd)) throw new Error(`import outside cwd: ${module.local}`);
    assets.push([module.local.slice(cwd.length+1), {
      kind: 'file',
      content: await Deno.readTextFile(module.local),
      encoding: 'utf-8',
    }]);
    assetSize += module.size ?? 0;
  }

  const assetsFind = await new Deno.Command('find', {
    args: ['assets', '-type', 'f', '-print0'],
    cwd: appDir,
    stdout: 'piped',
  }).output();
  if (assetsFind.success) {
    for (const line of new TextDecoder().decode(assetsFind.stdout).split('\0')) {
      if (!line) continue;
      assets.push([line, {
        kind: 'file',
        content: encodeBase64(await Deno.readFile(`${appDir}/${line}`)),
        encoding: 'base64',
      }]);
    }
  }

  if (settings.importMap) {
    assets.push([settings.importMap, {
      kind: 'file',
      content: await Deno.readTextFile(`${appDir}/${settings.importMap}`),
      encoding: "utf-8",
    }]);
  }

  {
    const siteJson = JSON.parse(await Deno.readTextFile(`${appDir}/dist-app-site.json`));

    // TODO: don't mutate this file like this, make a new file if you need to
    if (annotations['org.opencontainers.image.revision']) {
      siteJson.meteorApp.bundle.buildCommit = annotations['org.opencontainers.image.revision'];
    }

    assets.push(['dist-app-site.json', {
      kind: 'file',
      content: JSON.stringify(siteJson),
      encoding: "utf-8",
    }]);
  }

    // 'webapp/assets/auth-style.css',
    // 'server-sdk/modules/account-system/auth-style.css',

  const resp = await fetch('https://uber.danopia.net/dist-app-deno/webapp-runtime.tar.gz');
  if (!resp.ok) throw new Error(`http ${resp.status} from uber.danopia.net`);
  for await (
    const entry of resp.body!
      .pipeThrough(new DecompressionStream("gzip"))
      .pipeThrough(new UntarStream())
  ) {
    if (!entry.readable) continue;
    const buffer = await new Response(entry.readable).text();
    assets.push([ entry.path, {
      content: buffer,
      kind: 'file',
      encoding: 'utf-8',
    }]);
  }

  console.log('Loaded', assets.length, 'assets.');

  // const attachDatabase = graphJson.modules.some(x => x.specifier.endsWith('server-sdk/modules/storage-deno-kv/mod.ts'));

  const assetsTarstream = ReadableStream.from(assets)
    .pipeThrough(new TransformStream<[string,Asset],TarStreamInput>({
      transform([path, asset], ctlr) {
        const bytes = new TextEncoder().encode(asset.content ?? '');
        if (bytes.byteLength == 0) return;
        ctlr.enqueue({
          path,
          readable: ReadableStream.from([bytes]),
          size: bytes.byteLength,
          type: 'file',
          options: {
            mtime: 0,
          },
        });
      },
    }))
    .pipeThrough(new TarStream());
  const [assetsCompressed, _assetsCompression] = gzipStream(assetsTarstream);
  const assetsTarball = new Uint8Array(await new Response(assetsCompressed).arrayBuffer());

  const assetsHash = await sha256bytesToHex(assetsTarball);

  const deployConfig = {
    entryPointUrl: graphJson.roots[0].slice('file://'.length+cwd.length+1),
    importMapUrl: settings.importMap,
    envVars: {
    },
    attachDatabase: true,
    description: `${settings.configJson.denoDeploy?.description} (${Math.ceil(assetSize / 1024)}KiB in ${assets.length} files)`,
    // deno-lint-ignore no-unused-vars
    assets: Object.fromEntries(assets.map(([key, {content, ...rest}]) => [key, rest])),
  };
  const configJson = {
    ...settings.configJson,
    denoDeploy: {
      ...settings.configJson.denoDeploy,
      ...deployConfig,
    },
  };

  // TODO: add bundle to OCI image instead of this URL reference
  if (annotations['org.opencontainers.image.revision']) {
    // @ts-expect-error TODO
    configJson.meteorApp.bundle.buildCommit = annotations['org.opencontainers.image.revision'];
  }

  const configBytes = new TextEncoder().encode(JSON.stringify(configJson));
  const configHash = await sha256bytesToHex(configBytes);

  const manifestBytes = new TextEncoder().encode(JSON.stringify({
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "config": {
      "mediaType": "application/vnd.danopia.dist-app-site.config.v1+json",
      "size": configBytes.byteLength,
      "digest": `sha256:${configHash}`,
    },
    "layers": [{
      "mediaType": "application/vnd.cloudydeno.deno-deploy.assets.v1.tar+gzip",
      "size": assetsTarball.byteLength,
      "digest": `sha256:${assetsHash}`,
    }],
    "annotations": annotations,
  }));
  const manifestHash = await sha256bytesToHex(manifestBytes);
  const manifestDigest = `sha256:${manifestHash}`;

  const tempStore = new OciStoreInmem();
  await tempStore.putLayerFromBytes('blob', {
    mediaType: "application/vnd.cloudydeno.deno-deploy.assets.v1.tar+gzip",
  }, assetsTarball);
  await tempStore.putLayerFromBytes('blob', {
    mediaType: "application/vnd.cloudydeno.deno-deploy.config.v1.tar+gzip",
  }, configBytes);
  await tempStore.putLayerFromBytes('manifest', {
    mediaType: "application/vnd.oci.image.manifest.v1+json",
  }, manifestBytes);

  if (!Deno.args[0]) throw "Provide desired image reference as first argument";
  const pushResult = await pushFullArtifact(tempStore, manifestDigest, Deno.args[0]);

  const githubOutput = Deno.env.get('GITHUB_OUTPUT');
  if (githubOutput) {
    const file = await Deno.open(githubOutput, {
      write: true,
      append: true,
    });
    const writer = file.writable.getWriter();
    await writer.write(new TextEncoder().encode(`digest=${manifestDigest}`));
    writer.close();
    console.error(`Step output: digest=${manifestDigest}`);
  }

  return pushResult;
}

async function sha256bytesToHex(message: Uint8Array) {
  const hash = await crypto.subtle.digest('SHA-256', message);
  return bytesToHex(hash);
}
function bytesToHex(data: ArrayBuffer) {
  return [...new Uint8Array(data)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}
