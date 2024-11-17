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
        cachedSubscription('chores/all', []),
        cachedSubscription('tasks/active', []),
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
        cachedSubscription('chores/all', []),
      ]),
      Component: () => (
        <div className="wrap">
          <h1>
            All Chores
            {" "}
            <span style={{fontSize: '0.7em'}}>
              [
                <Link to="/">
                  Home
                </Link>
              ]
            </span>
            {" "}
            <span style={{fontSize: '0.7em'}}>
              [
                <Link to="/chores/grouped">
                  See Grouped
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
          <ChoreGrid showCompleted={true} />
        </div>
      ),
    },
    {
      path: '/chores/grouped',
      loader: () => Promise.all([
        cachedSubscription('chores/all', []),
      ]),
      Component: () => (
        <div className="wrap">
          <h1>
            All Chores
            {" "}
            <span style={{fontSize: '0.7em'}}>
              [
                <Link to="/">
                  Home
                </Link>
              ]
            </span>
            {" "}
            <span style={{fontSize: '0.7em'}}>
              [
                <Link to="/chores">
                  See Latest
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
      path: '/chores/by-id/:choreName',
      // loader: ({ params }) => Promise.all([
      //   cachedSubscription('access-requests/by-id', [params.requestId]),
      // ]),
      Component: () => {
        const { choreName } = useParams();
        return (
          <div className="wrap">
            <ChoreDetails choreName={choreName!} />
          </div>
        );
      },
    },

    {
      path: '/tasks',
      loader: () => Promise.all([
        cachedSubscription('tasks/active', []),
      ]),
      Component: () => (
        <div className="wrap">
          <h1>
            All Tasks
            {" "}
            <span style={{fontSize: '0.7em'}}>
              [
                <Link to="/">
                  Home
                </Link>
              ]
            </span>
          </h1>
          <TaskGrid />
        </div>
      ),
    },
  ],
}]);
