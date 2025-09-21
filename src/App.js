// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- Глобальная настройка Axios ---
// Создаем экземпляр axios для API
const api = axios.create({
    baseURL: 'https://ngb2.ru:3000/sup_post/api/public' // !!! Убедитесь, что адрес правильный
});

// Interceptor для добавления токена в каждый запрос
api.interceptors.request.use(config => {
    const token = localStorage.getItem('supplierToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


// --- Главный компонент ---
function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('supplierToken'));
    const [authLoading, setAuthLoading] = useState(true);

    // Эффект для установки токена и пользователя при инициализации
    useEffect(() => {
        if (token) {
            try {
                // Декодируем токен, чтобы получить данные пользователя без запроса к серверу
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setUser(decoded);
            } catch (e) {
                // Если токен невалидный, выходим
                handleLogout();
            }
        }
        setAuthLoading(false);
    }, [token]);

    const handleLoginSuccess = (newToken, userData) => {
        localStorage.setItem('supplierToken', newToken);
        setToken(newToken);
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('supplierToken');
        setToken(null);
        setUser(null);
    };

    if (authLoading) {
        return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border"></div></div>;
    }

    return (
        <>
            <Header user={user} onLogout={handleLogout} />
            <main className="container mt-4 pb-5">
                {user ? (
                    <SupplierDashboard />
                ) : (
                    <AuthPage onLoginSuccess={handleLoginSuccess} />
                )}
            </main>
        </>
    );
}

// --- Компоненты ---

function Header({ user, onLogout }) {
    return (
        <header className="p-3 bg-light border-bottom">
            <div className="container d-flex justify-content-between align-items-center">
                <a href="/" className="h4 text-decoration-none text-primary fw-bold">Портал Поставщика</a>
                {user && (
                    <div>
                        <span className="me-3">Здравствуйте, {user.name}!</span>
                        <button className="btn btn-outline-secondary" onClick={onLogout}>
                            <i className="bi bi-box-arrow-right me-2"></i>Выйти
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

function AuthPage({ onLoginSuccess }) {
    const [isLoginView, setIsLoginView] = useState(true);
    return (
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        {isLoginView ? (
                            <LoginForm onLoginSuccess={onLoginSuccess} switchToRegister={() => setIsLoginView(false)} />
                        ) : (
                            <RegisterForm switchToLogin={() => setIsLoginView(true)} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoginForm({ onLoginSuccess, switchToRegister }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/suppliers/login', formData);
            onLoginSuccess(response.data.token, response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка входа.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-center mb-4">Вход в кабинет</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3"><label>Email</label><input type="email" name="email" className="form-control" onChange={handleChange} required /></div>
                <div className="mb-3"><label>Пароль</label><input type="password" name="password" className="form-control" onChange={handleChange} required /></div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Вход...' : 'Войти'}
                </button>
            </form>
            <p className="mt-3 text-center">
                Нет аккаунта? <button className="btn btn-link p-0" onClick={switchToRegister}>Зарегистрируйтесь</button>
            </p>
        </>
    );
}

function RegisterForm({ switchToLogin }) {
    const [formData, setFormData] = useState({ name: '', inn: '', email: '', password: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await api.post('/suppliers/register', formData);
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка регистрации.');
        } finally {
            setLoading(false);
        }
    };

    if (message) {
        return (
            <div className="text-center">
                <h3 className="text-success">Заявка отправлена!</h3>
                <p>{message}</p>
                <button className="btn btn-primary" onClick={switchToLogin}>Вернуться ко входу</button>
            </div>
        );
    }

    return (
        <>
            <h2 className="text-center mb-4">Регистрация</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3"><label>Название организации</label><input type="text" name="name" className="form-control" onChange={handleChange} required /></div>
                <div className="mb-3"><label>ИНН</label><input type="text" name="inn" className="form-control" onChange={handleChange} required pattern="[0-9]{10,12}" /></div>
                <div className="mb-3"><label>Email</label><input type="email" name="email" className="form-control" onChange={handleChange} required /></div>
                <div className="mb-3"><label>Пароль (мин. 8 символов)</label><input type="password" name="password" className="form-control" onChange={handleChange} required minLength="8" /></div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </form>
            <p className="mt-3 text-center">
                Уже есть аккаунт? <button className="btn btn-link p-0" onClick={switchToLogin}>Войдите</button>
            </p>
        </>
    );
}

function SupplierDashboard() {
    // Здесь будет логика кабинета после входа (список потребностей и т.д.)
    // Для этого шага мы просто покажем, что вход выполнен.
    // В следующих шагах мы перенесем сюда код из предыдущей версии.
    return (
        <div>
            <h2>Рабочая область</h2>
            <p>Здесь будет отображаться список потребностей и форма для подачи предложений.</p>
        </div>
    );
}

export default App;