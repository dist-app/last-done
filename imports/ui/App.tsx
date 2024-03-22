import React, { StrictMode } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Reset page</button>
  </div>
);

export function App() {
  // const hasUser = useTracker(() => !!Meteor.userId());
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <StrictMode>
        <RouterProvider router={router} fallbackElement={<progress />} />
      </StrictMode>
    </ErrorBoundary>
  );
}
