import React from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams } from "react-router-dom";
import { ChoreDetails } from './ChoreDetails';
import { ChoreGrid } from './ChoreGrid';

export const router = createBrowserRouter([{
  element: <>
    <Outlet />
  </>,
  children: [
    {
      path: '/',
      Component: () => (
        <div className="wrap">
          <h2>All Chores</h2>
          <ChoreGrid />
        </div>
      ),
    },
    {
      path: '/chores/by-id/:choreId',
      // loader: ({ params }) => Promise.all([
      //   cachedSubscription('/access-requests/by-id', [params.requestId]),
      // ]),
      Component: () => {
        const { choreId } = useParams();
        return (
          <div className="wrap">
            <ChoreDetails choreId={choreId!} />
          </div>
        );
      },
    },
  ],
}]);
