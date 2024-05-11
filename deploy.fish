#!/usr/bin/env fish

dan auth terraform | source
set commit (git rev-parse HEAD)
set tempdir (mktemp -d)
env METEOR_DISABLE_OPTIMISTIC_CACHING=1 meteor build --directory $tempdir
cd $tempdir/bundle/programs
ls -lsh web.browser
set buildPrefix uber.danopia.net/meteor-bundles/last-done/$commit
# inspired by https://stackoverflow.com/questions/73885999/how-to-create-a-json-file-with-jq
# can probably break down further
echo '{"web.browser":{"hashes":{"js":"'(basename web.browser/*.js .js)'","css":"'(basename web.browser/*.css .css)'"},"html":'(jq -cn --rawfile body web.browser/body.html --rawfile head web.browser/head.html '$ARGS.named')'},"server":'(jq -c . < server/config.json)'}' > manifest.json
aws s3 cp --content-type "application/json; charset=utf-8" manifest.json s3://$buildPrefix/manifest.json
aws s3 cp --content-type "application/javascript; charset=utf-8" web.browser/*.js s3://$buildPrefix/web.browser/app.js
aws s3 cp --content-type "text/css; charset=utf-8" web.browser/*.css s3://$buildPrefix/web.browser/app.css
echo https://$buildPrefix/web.browser/app.js
echo https://$buildPrefix/web.browser/app.css
rm -rf $tempdir
