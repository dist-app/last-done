import React from 'react';
import { createBrowserRouter, Link, Navigate, Outlet, useParams } from "react-router-dom";
import { ChoreDetails } from './ChoreDetails';
import { ChoreGrid } from './ChoreGrid';
import { ChoreGridGrouped } from './ChoreGridGrouped';

export const router = createBrowserRouter([{
  element: <>
    <Outlet />
  </>,
  children: [
    {
      path: '/chores',
      Component: () => (
        <div className="wrap">
          <Link to="/chores/grouped">Grouped</Link>
          <ChoreGrid />
        </div>
      ),
    },
    {
      path: '/chores/grouped',
      Component: () => (
        <div className="wrap">
          <Link to="/chores">Latest</Link>
          <ChoreGridGrouped />
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
