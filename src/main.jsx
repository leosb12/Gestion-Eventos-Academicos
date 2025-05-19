import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {RouterProvider} from 'react-router-dom'
import {router} from './router.jsx'
import {AuthContextProvider} from './context/AuthContext.jsx'
import {ToastContainer} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthContextProvider>
            <>
                <RouterProvider router={router}/>
                <ToastContainer position="top-right" autoClose={3000}/>
            </>
        </AuthContextProvider>
    </StrictMode>,
)
