import React, { useContext, useEffect } from 'react';
import { UserContext } from '../Hooks/UserContext';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../Pages/Home';
import PaymentPage from '../Pages/PaymentPage';

import Login from '../Pages/LoginPage';
import Register from '../Pages/RegisterPage';

import { API_BASE_URL } from '../config';

const AppRouter = () => {
  const { setUserInfo, userInfo } = useContext(UserContext);
  
  useEffect(() => {
    fetch(`${API_BASE_URL}/profile`, {
        credentials: 'include',
    }).then(response => {
        if (!response.ok) {
          setUserInfo(null);
          return;
        }
        return response.json();
      })
      .then(userInfo => {
        setUserInfo(userInfo);
      })
      .catch((err) => {
        setUserInfo(null);
        console.error("Kullanıcı bilgileri alınamadı: ", err);
      });
  }, [setUserInfo]);
  
  const role = userInfo?.role;

  const isAdmin = role === "admin";
  const isUser = (role === "guest") || isAdmin;

  return (
    <Routes>
      <Route path="/*" element={<Home />} />
      <Route path="/home" element={<Home />} />
      {/* <Route path="/payment" element={<PaymentPage />} /> */}
      <Route
        path="/payment"
        element={isUser ? <PaymentPage /> : <Navigate to="/home" />}
      />
      <Route
        path="/login"
        element={!isUser ? <Login /> : <Navigate to="/home" />}
      />
      <Route
        path="/register"
        element={!isUser ? <Register /> : <Navigate to="/home" />}
      />
    </Routes>
  )
}

export default AppRouter