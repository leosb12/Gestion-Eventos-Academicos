import React from 'react';
import {Navigate} from "react-router-dom";
import {UserAuth} from "../context/AuthContext.jsx";

const PrivateRoute = ({children}) => {
    const {session} = UserAuth();

    return <>{session ?
                <>{children}</>
                :
                <Navigate to ="/iniciar-sesion"/>
             }
        </>;
};

export default PrivateRoute;