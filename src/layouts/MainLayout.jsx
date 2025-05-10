import React from "react";
import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}