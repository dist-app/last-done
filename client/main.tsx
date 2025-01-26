import "meteor/danopia:opentelemetry";

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container!, {
    // onUncaughtError: (error, errorInfo) => {
    //   // ... log error report
    // },
    // onCaughtError: (error, errorInfo) => {
    //   // ... log error report
    // },
  });
  root.render(<App />);
});
