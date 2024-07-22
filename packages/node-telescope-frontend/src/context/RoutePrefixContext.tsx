import React, { createContext, useState, useEffect, useContext } from 'react';

const RoutePrefixContext = createContext('/telescope');

export const RoutePrefixProvider = ({ children }: { children: React.ReactNode }) => {
  const [routePrefix, setRoutePrefix] = useState('');

  useEffect(() => {
    fetch(
      process.env.NODE_ENV === 'development'
        ? `http://localhost:4000/telescope-config`
        : `/telescope-config`,
    )
      .then(response => response.json())
      .then(data => setRoutePrefix(data.routePrefix))
      .catch(error => console.error('Error fetching route prefix:', error));
  }, []);

  return <RoutePrefixContext.Provider value={routePrefix}>{children}</RoutePrefixContext.Provider>;
};

export const useRoutePrefix = () => useContext(RoutePrefixContext);
