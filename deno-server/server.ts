// Set up telemetry/tracer
import "https://deno.land/x/observability@v0.7.0/preconfigured/from-environment.ts";

// Bring in the user-defined server logic
import "../server/main.ts";

// Start up the app server
import "dist-app-deno/hack/meteor-server/run.ts";
