import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaUserPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { LoginContext } from '../../ContextApis/LoginContext';
import { Button, Alert, Card, Typography } from 'antd';

import './Register.css';
import { ImSpinner9 } from 'react-icons/im';

const EMPTY_INITIAL_VALUES = {};

function Register({
  mode = 'register',
  initialValues,
  onCancel,
  onSubmitSuccess,
  submitLabel
}) {
  const isEditMode = mode === 'edit';
  const profileValues = initialValues || EMPTY_INITIAL_VALUES;
  const { register: registerField, reset, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [user, errorInLogin, userLoginStatus, setUserLoginStatus, loginUser, setUser] = useContext(LoginContext);
  const [errorDisplayState, setErrorDisplayState] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const register_url_env = import.meta.env.VITE_REGISTER_URL;
  const update_url_env = import.meta.env.VITE_UPDATE_USER_URL || 'http://localhost:5000/user-api/update-user';

  useEffect(() => {
    reset({
      userName: profileValues.userName || '',
      password: '',
      email: profileValues.email || '',
      mobile: profileValues.mobile || '',
      dob: profileValues.dob ? String(profileValues.dob).slice(0, 10) : ''
    });
    setSelectedProfile(null);
    setErrorDisplayState('');
    setRegisterMessage('');
  }, [profileValues.userName, profileValues.email, profileValues.mobile, profileValues.dob, reset, isEditMode]);

  const submitForm = (newUser) => {
    const apiUrl = isEditMode
      ? `${update_url_env}/${encodeURIComponent(profileValues.email || newUser.email)}`
      : register_url_env;
    const method = isEditMode ? 'put' : 'post';

    setIsSubmitting(true);
    const fd = new FormData();
    const payload = { ...newUser };
    delete payload.profilePicture;

    if (isEditMode && !payload.password) {
      delete payload.password;
    }

    fd.append('user', JSON.stringify(payload));
    if (selectedProfile) {
      fd.append('profile', selectedProfile);
    }

    const requestConfig = isEditMode
      ? { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }
      : undefined;

    axios[method](apiUrl, fd, requestConfig)
      .then(response => {
        if (!isEditMode && response.status === 201) {
          setRegisterMessage(response.data.message);
          reset();
          navigate('/login');
        } else if (isEditMode && response.status === 200) {
          setRegisterMessage(response.data.message || 'profile updated successfully');
          const updatedUser = response.data.payload;
          if (updatedUser) {
            setUser(updatedUser);
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
          }
          onSubmitSuccess?.(response.data);
        } else {
          setErrorDisplayState(response.data.message);
        }
      })
      .catch(error => {
        if (error.response) {
          setErrorDisplayState(error.response.data?.message || error.message);
        } else if (error.request) {
          setErrorDisplayState('Sorry, there was an connection error, check you connection!');
        } else {
          setErrorDisplayState(error.message);
        }
      }).finally(() => {
        setIsSubmitting(false);
      });
  };

  const selectedFile = (event) => {
    setSelectedProfile(event.target.files[0]);
  };

  const buttonText = submitLabel || (isEditMode ? 'Update profile' : 'Register');
  const headingText = isEditMode ? 'Update Profile' : 'Register Here';

  return (
    <div>
      {errorDisplayState ? <Alert type="error" showIcon className="mb-3" message={errorDisplayState} /> :
        <div>
          {registerMessage ? <Alert type="success" showIcon className="mb-3" message={registerMessage} /> : <Typography.Title level={3} className="display-6 text-center register-here-text">{headingText}</Typography.Title>}
          <Card className='m-auto row col-sm-9 col-md-8 col-lg-6 mt-3 register-card' bordered={false}>
            <form className="auth-form" onSubmit={handleSubmit(submitForm)}>
              <div className="mb-3">
                <input type="text" className='form-control auth-input' {...registerField('userName', { required: true, minLength: 3, maxLength: 15 })} placeholder='User Name' />
                {errors.userName?.type === 'required' && <p className="text-danger">*user name is required.</p>}
                {errors.userName?.type === 'minLength' && <p className="text-danger">*min 3 characters is required.</p>}
                {errors.userName?.type === 'maxLength' && <p className="text-danger">*max 15 characters is required.</p>}
              </div>
              <div className="mb-3">
                <div className="password-wrapper" style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className='form-control auth-input'
                    style={{ paddingRight: '40px' }}
                    {...registerField('password', isEditMode ? { minLength: 3, maxLength: 15 } : { required: true, minLength: 3, maxLength: 15 })}
                    placeholder={isEditMode ? 'New password (optional)' : 'Password'}
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
                {!isEditMode && errors.password?.type === 'required' && <p className='text-danger'>*password is required.</p>}
                {errors.password?.type === 'minLength' && <p className='text-danger'>*min 3 characters is required.</p>}
                {errors.password?.type === 'maxLength' && <p className='text-danger'>*max 15 characters is required.</p>}
              </div>
              <div className="mb-3">
                <input type="email" className='form-control auth-input' {...registerField('email', { required: true })} placeholder='example@gmail.com' />
                {errors.email?.type === 'required' && <p className="text-danger">*email is required</p>}
              </div>
              <div className="mb-3">
                <input type="number" className='form-control auth-input' {...registerField('mobile', { required: true })} placeholder='Mobile Number' />
                {errors.mobile?.type === 'required' && <p className='text-danger'>*mobile number is required.</p>}
              </div>
              <div className="mb-3">
                <input type="date" className='form-control auth-input' {...registerField('dob', { required: true })} placeholder='DOB' />
                {errors.dob?.type === 'required' && <p className='text-danger'>*date of birth is required.</p>}
              </div>
              <div className="mb-3">
                <input type="file" className="form-control auth-input" onInput={selectedFile} {...registerField('profilePicture', isEditMode ? {} : { required: true })} />
                {!isEditMode && errors.profilePicture?.type === 'required' && <p className="text-danger">*File is required.</p>}
                {isEditMode && <p className="text-secondary">Leave blank to keep the current profile picture.</p>}
              </div>
              <Button type="primary" htmlType="submit" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? <span>{isEditMode ? 'Updating' : 'Registering'} <ImSpinner9 className="spin" /></span> : <><FaUserPlus /> {buttonText}</>}
              </Button>
              {isEditMode && onCancel && (
                <Button className="mt-2 ms-2" onClick={onCancel}>Cancel</Button>
              )}
            </form>
          </Card>
        </div>
      }
    </div>
  );
}

export default Register;
