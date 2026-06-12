import React from 'react'
// import UserProfile from '../userProfile/UserProfile';
import {useForm} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { LoginContext } from '../../ContextApis/LoginContext';
import { useContext, useState } from 'react';
// importing css file
import "./Login.css";
import { Alert, Button, Card, Typography } from 'antd';
import { FaUser, FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {

  // use form 
  const {register,reset,handleSubmit,formState:{errors}}=useForm();

  // importing states from context provider
  const [user,errorInLogin,userLoginStatus,setUserLoginStatus,loginUser]=useContext(LoginContext);

  const [showPassword, setShowPassword] = useState(false);

  // function to handle submit
  const submitForm=(dataFromForm)=>{
    loginUser(dataFromForm);
    reset();
  }

  return (
    <div>
      <Card className="row col-sm-9 col-md-8 col-lg-6 m-auto login-card" bordered={false}>
        <Typography.Title level={3} className="text-center mb-3 login-here-text">Login Here</Typography.Title>
        {errorInLogin && <Alert type="error" showIcon className="mb-3" message={errorInLogin} />}
        <form className="auth-form" onSubmit={handleSubmit(submitForm)}>
          {/* email */}
          <div className="mb-3">
            <input type="email" placeholder="email" className="form-control auth-input" {...register("email",{required:true})}/>
            {errors.email?.type=="required" && <p className="text-danger">*email is required</p>}
          </div>
          {/* password */}
          <div className="mb-3">
            <div className="password-wrapper" style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="password" 
                className="form-control auth-input" 
                style={{ paddingRight: '40px' }}
                {...register("password",{required:true})}
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--app-text-soft, #8c8c8c)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  zIndex: 2
                }}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            {errors.password?.type=="required" && <p className="text-danger">*password is required.</p>}
          </div>
          <Button type="primary" htmlType="submit" icon={<FaUser />}>Login</Button>
        </form>
      </Card>

    </div>
  )
}

export default Login;