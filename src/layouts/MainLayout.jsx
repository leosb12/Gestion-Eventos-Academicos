// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop.jsx';

export default function MainLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}
