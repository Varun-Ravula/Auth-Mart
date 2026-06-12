import './App.css';
import Home from './components/home/Home';
import Login from './components/login/Login';
import Register from './components/register/Register';
import AboutUs from './components/aboutUs/AboutUs';
import RootLayout from './RootLayout';
import ErrorPage from './ErrorPage';
import UserProfile from './components/userProfile/UserProfile';
import Products from './components/products/Products';
import Cart from './components/cart/Cart';
import ProtectedRoute from './components/common/ProtectedRoute';

import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

const browserRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'register', element: <Register /> },
      { path: 'login', element: <Login /> },
      { path: 'about-us', element: <AboutUs /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute><UserProfile /></ProtectedRoute>,
        children: [
          { index: true, element: <Navigate to="products" replace /> },
          { path: 'products', element: <Products /> },
          { path: 'cart', element: <Cart /> }
        ]
      }
    ]
  }
]);

function App() {
  return (
    <div className="App-content">
      <RouterProvider router={browserRouter} />
    </div>
  );
}

export default App;
