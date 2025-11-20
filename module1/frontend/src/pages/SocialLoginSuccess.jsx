import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

const SocialLoginSuccess = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    // token is in fragment like .../social-login-success#token=ABC
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const token = params.get('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // save token, then fetch /auth/me to get user
    localStorage.setItem('token', token);

    api.get('/auth/me')
      .then(res => {
        const user = res.data.user;
        login(token, user);
        // if role missing, route to a choose-role page
        if (!user.role) navigate('/choose-role');
        else if (user.role === 'customer') navigate('/customer');
        else if (user.role === 'retailer') navigate('/retailer');
        else if (user.role === 'wholesaler') navigate('/wholesaler');
      })
      .catch(err => {
        console.error(err);
        // fallback: decode token for role (if token contains role) OR go to login
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = { id: payload.id, role: payload.role, email: payload.email };
          login(token, user);
          if (user.role === 'customer') navigate('/customer');
          else if (user.role === 'retailer') navigate('/retailer');
          else if (user.role === 'wholesaler') navigate('/wholesaler');
        } catch (e) {
          navigate('/login');
        }
      });
  }, [navigate, login]);

  return <div>Signing you in... please wait.</div>;
}

export default SocialLoginSuccess;
