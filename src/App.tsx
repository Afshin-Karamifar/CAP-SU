import { BrowserRouter, Routes, Route } from 'react-router';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from '@/components/theme-provider';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
