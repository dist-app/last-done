import React from 'react';
import { createBrowserRouter, Link, Navigate, Outlet, useParams } from "react-router-dom";
import { ChoreDetails } from './ChoreDetails';
import { ChoreGrid } from './ChoreGrid';
import { ChoreGridGrouped } from './ChoreGridGrouped';
import { CreateChoreForm } from './CreateChoreForm';

export const router = createBrowserRouter([{
  element: <>
    <Outlet />
  </>,
  children: [
    {
      path: '/chores',
      Component: () => (
        <div className="wrap">
          <div style={{display: 'flex', flexDirection: 'row', gap: '1em'}}>
            <Link to="/chores/grouped">Grouped</Link>
            <Link to="/chores/create">Create</Link>
          </div>
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
      path: '/chores/create',
      Component: () => (
        <div className="wrap">
          <CreateChoreForm />
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
