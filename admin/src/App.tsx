import React from 'react';
import { AppProvider } from './context/AppContext';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  return (
    <AppProvider>
      <AdminPanel />
    </AppProvider>
  );
}
