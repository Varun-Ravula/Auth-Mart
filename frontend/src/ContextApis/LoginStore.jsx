// importing modules
import { LoginContext} from "./LoginContext";
import {useState,useEffect} from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { message } from 'antd';

// building an context provider
// context provider to respective children
function LoginStore({children}){
// user state
    const [user,setUser]=useState(() => {
        const savedUser = sessionStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : {};
    });

// user Login status
const [userLoginStatus,setUserLoginStatus]=useState(() => Boolean(sessionStorage.getItem('token')));

// using navigate
const navigate=useNavigate();

// error state
 const [errorInLogin,setErrorInLogin]=useState("");

// function to make an http request too http server(user login)
// importing login url from .env
const login_url_env=import.meta.env.VITE_LOGIN_URL;

const loginUser=async(userObject)=>{
    try{
    const LoginResult=await axios.post(login_url_env,userObject);
    if(LoginResult.data.message==="success"){
        // creating an session storage and inserting token
        sessionStorage.setItem('token',LoginResult.data.token);
        sessionStorage.setItem('user', JSON.stringify(LoginResult.data.payload));
        setUser({...LoginResult.data.payload});
        setUserLoginStatus(true);
        setErrorInLogin("");
        message.success('Successfully logged in');
    }else{
        setErrorInLogin(LoginResult.data.message);
    }
    }
    catch(errorObject){
        if(errorObject.response){
            setErrorInLogin(`Something went wrong: ${errorObject.response.data?.message || errorObject.message}`);
        }else if(errorObject.request){
            setErrorInLogin("connection error, please check your internet connection and try again");
        }else{
            setErrorInLogin(`error occured while logging: ${errorObject.message}`);
        }
    }
}

useEffect(() => {
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');

    if (savedToken && savedUser) {
        setUser(JSON.parse(savedUser));
        setUserLoginStatus(true);
    }
}, []);

// useeffect for programmatical navigation to user profile
useEffect(()=>{
    if(userLoginStatus==true){
        navigate('/dashboard/products');
    }
},[userLoginStatus])

    return(
        <div>
            <LoginContext.Provider value={[user,errorInLogin,userLoginStatus,setUserLoginStatus,loginUser,setUser]}>
                {children}
            </LoginContext.Provider>
        </div>
    )
}

export default LoginStore;