import React, { createContext, useState, useEffect, useContext } from 'react';

const RoutePrefixContext = createContext('/telescope');

export const RoutePrefixProvider = ({ children }: { children: React.ReactNode }) => {
  const [routePrefix, setRoutePrefix] = useState('/telescope');

  useEffect(() => {
    fetch('/telescope-config')
      .then(response => response.json())
      .then(data => setRoutePrefix(data.routePrefix))
      .catch(error => console.error('Error fetching route prefix:', error));
  }, []);

  return <RoutePrefixContext.Provider value={routePrefix}>{children}</RoutePrefixContext.Provider>;
};

export const useRoutePrefix = () => useContext(RoutePrefixContext);
