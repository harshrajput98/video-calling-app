import { useState } from 'react';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import apiClient from '../../apiClient';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContextApi';



const AuthForm = ({ type }) => {
    const {updateUser} =  useUser();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: 'male',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (type === 'signup' && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        setLoading(true);
        try {
            const endpoint = type === 'signup' ? '/auth/signup' : '/auth/login';
            const response = await apiClient.post(endpoint, formData);
            toast.success(response.data.message || 'Success!');
            if(type === 'signup'){
                navigate('/login')
            }
            if (type === 'login') {
               updateUser(response.data)
               // localStorage.setItem('userData', JSON.stringify(response.data));
                // Save token in cookies
                const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                const expires = "expires=" + date.toUTCString();
                document.cookie = `jwt=${response.data.token}; path=/; ${expires}`;
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900  px-4">

  <div className="bg-white text-gray-800 p-10 rounded-xl shadow-xl w-full max-w-md">
    <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">
      {type === 'signup' ? 'Create your WeMeet Account' : 'Sign in to WeMeet'}
    </h2>

    <form onSubmit={handleSubmit} className="space-y-5">
      {type === 'signup' && (
        <>
          <div className="flex items-center gap-3 border border-gray-300 rounded-md px-4 py-2 bg-white">
            <FaUser className="text-blue-500" />
            <input
              type="text"
              name="fullname"
              placeholder="Full Name"
              className="w-full bg-transparent outline-none"
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex items-center gap-3 border border-gray-300 rounded-md px-4 py-2 bg-white">
            <FaUser className="text-blue-500" />
            <input
              type="text"
              name="username"
              placeholder="Username (e.g., Jondo99)"
              className="w-full bg-transparent outline-none"
              onChange={handleChange}
              required
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-3 border border-gray-300 rounded-md px-4 py-2 bg-white">
        <FaEnvelope className="text-blue-500" />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full bg-transparent outline-none"
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex items-center gap-3 border border-gray-300 rounded-md px-4 py-2 bg-white">
        <FaLock className="text-blue-500" />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full bg-transparent outline-none"
          onChange={handleChange}
          required
        />
      </div>

      {type === 'signup' && (
        <>
          <div className="flex items-center gap-3 border border-gray-300 rounded-md px-4 py-2 bg-white">
            <FaLock className="text-blue-500" />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="w-full bg-transparent outline-none"
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex items-center justify-center gap-8 text-sm font-medium text-gray-600">
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === 'male'}
                onChange={handleChange}
                className="mr-2"
              />
              Male
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === 'female'}
                onChange={handleChange}
                className="mr-2"
              />
              Female
            </label>
          </div>
        </>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition duration-300"
        disabled={loading}
      >
        {loading ? 'Loading...' : type === 'signup' ? 'Sign Up' : 'Login'}
      </button>
    </form>

    <p className="text-center text-sm mt-6 text-gray-600">
      {type === 'signup' ? (
        <>
          Already have an account?{' '}
          <Link to="/login">
            <span className="text-blue-600 font-medium hover:underline">Login</span>
          </Link>
        </>
      ) : (
        <>
          Don’t have an account?{' '}
          <Link to="/signup">
            <span className="text-blue-600 font-medium hover:underline">Register</span>
          </Link>
        </>
      )}
    </p>
  </div>

  <Toaster position="top-center" />
</div>
    );
};

export default AuthForm;