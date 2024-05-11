import React from 'react';
import { createBrowserRouter, Link, Navigate, Outlet, useParams } from "react-router-dom";
import { ChoreDetails } from './ChoreDetails';
import { ChoreGrid } from './ChoreGrid';
import { ChoreGridGrouped } from './ChoreGridGrouped';
import { CreateChoreForm } from './CreateChoreForm';
import { TaskGrid } from './TaskGrid';
import { cachedSubscription } from './sub-cache';

export const router = createBrowserRouter([{
  element: <>
    <Outlet />
  </>,
  children: [
    {
      path: '/',
      loader: () => Promise.all([
        cachedSubscription('/chores/all', []),
        cachedSubscription('/tasks/active', []),
      ]),
      Component: () => (
        <div className="wrap">
          <h1>
            Chores Due
            {" "}
            <span style={{fontSize: '0.7em'}}>
              [
                <Link to="/chores">
                  See All
                </Link>
              ]
            </span>
            {" "}
            <span style={{fontSize: '0.7em'}}>
              [
                <Link to="/chores/create">
                  Add
                </Link>
              ]
            </span>
          </h1>
          <ChoreGrid showCompleted={false} />
          <hr />
          <h1>
            Tasks
            {" "}
            <span style={{fontSize: '0.7em'}}>
              [
                <Link to="/tasks">
                  See All
                </Link>
              ]
            </span>
          </h1>
          <TaskGrid />
        </div>
      ),
    },

    {
      path: '/chores',
      loader: () => Promise.all([
        cachedSubscription('/chores/all', []),
      ]),
      Component: () => (
        <div className="wrap">
          <div style={{display: 'flex', flexDirection: 'row', gap: '1em'}}>
            <Link to="/">Home</Link> |
            <Link to="/chores/grouped">Grouped</Link> |
            <Link to="/chores/create">Create</Link>
          </div>
          <ChoreGrid showCompleted={true} />
        </div>
      ),
    },
    {
      path: '/chores/grouped',
      loader: () => Promise.all([
        cachedSubscription('/chores/all', []),
      ]),
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

    {
      path: '/tasks',
      loader: () => Promise.all([
        cachedSubscription('/tasks/active', []),
      ]),
      Component: () => (
        <div className="wrap">
          <div style={{display: 'flex', flexDirection: 'row', gap: '1em'}}>
            <Link to="/">Home</Link> |
            <Link to="/tasks/create">Create</Link>
          </div>
          <TaskGrid />
        </div>
      ),
    },
  ],
}]);
