import {ThemeProvider} from '@gravity-ui/uikit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {RouterProvider} from 'react-router-dom';

import {router} from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {retry: 1, staleTime: 30_000},
  },
});

export function App() {
  return (
    <ThemeProvider theme="dark">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
