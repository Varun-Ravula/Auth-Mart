import React from 'react';
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { LoginContext } from '../../ContextApis/LoginContext';

function ProtectedRoute({ children }) {
  const [user, errorInLogin, userLoginStatus] = useContext(LoginContext);

  if (!userLoginStatus && !sessionStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;