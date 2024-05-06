#!/usr/bin/env fish

dan auth terraform | source
set commit (git rev-parse HEAD)
set tempdir (mktemp -d)
meteor build --directory $tempdir
cd $tempdir/bundle/programs
ls -lsh web.browser
set buildPrefix uber.danopia.net/meteor-bundles/last-done/$commit
aws s3 cp --content-type "application/javascript; charset=utf-8" web.browser/*.js s3://$buildPrefix/web.browser/app.js
aws s3 cp --content-type "text/css; charset=utf-8" web.browser/*.css s3://$buildPrefix/web.browser/app.css
echo https://$buildPrefix/web.browser/app.js
echo https://$buildPrefix/web.browser/app.css
rm -rf $tempdir
