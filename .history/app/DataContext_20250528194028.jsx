// app/DataContext.js
import React from 'react';

export default const DataContext = React.createContext({
  data: {
    properties: [],
    explore: [],
    typeTabs: [],
    username: '',
    favoritesMap: {},
  },
  setData: () => {},
});
