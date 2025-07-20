import React from 'react';

// Create a context for passing data from Splash to Home (and other screens)
const DataContext = React.createContext({
  properties: [],
  explore: [],
  typeTabs: [],
  username: '',
  favoritesMap: {},
});

export default DataContext;
