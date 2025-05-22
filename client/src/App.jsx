import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthForm from './pages/auth/Auth';
import Dashboard from './pages/dashboard/Dashboard';
import IsLogin from './pages/auth/IsLogin';
import LandingPage from './pages/LandingPage/landingPage';

function App() {
  return (
    <Router>
      <Routes>
         <Route path="/" element={<LandingPage />} />
        <Route element={<IsLogin />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/signup" element={<AuthForm type="signup" />} />
        <Route path="/login" element={<AuthForm type="login" />} />
      </Routes>
    </Router>
  );
}

export default App;
