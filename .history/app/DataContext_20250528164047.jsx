// app/DataContext.js
import React from 'react';

export const DataContext = React.createContext({
  data: {
    properties: [],
    explore: [],
    typeTabs: [],
    username: '',
    favoritesMap: {},
  },
  setData: () => {},
});
