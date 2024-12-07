import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import FormApp from './Form/App';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/form',
    element: (
      <>
        <SignedIn>
          <FormApp />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </>
    ),
  },
]);
