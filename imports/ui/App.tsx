import React, { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';

export function App() {
  // const hasUser = useTracker(() => !!Meteor.userId());
  return (
    <StrictMode>
      <RouterProvider router={router} fallbackElement={<progress />} />
    </StrictMode>
  );
}
