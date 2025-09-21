// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- Глобальная настройка Axios ---
const api = axios.create({
    baseURL: 'https://ngb2.ru:3000/sup_post/api/public' // Убедитесь, что адрес и порт правильные
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('supplierToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ========================================================================
// === ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ =======================================
// ========================================================================
function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('supplierToken'));
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setUser(decoded);
            } catch (e) {
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
        localStorage.removeItem('proposals'); // Очищаем корзину при выходе
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

// ========================================================================
// === КОМПОНЕНТЫ СТРАНИЦ ================================================
// ========================================================================

function SupplierDashboard() {
    const [needs, setNeeds] = useState([]);
    const [proposals, setProposals] = useState(() => JSON.parse(localStorage.getItem('proposals') || '[]'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNeeds = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/needs');
            setNeeds(response.data.needs || []);
        } catch (err) {
            setError('Не удалось загрузить данные. Возможно, сессия истекла, попробуйте войти заново.');
            console.error('Fetch needs error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNeeds();
    }, [fetchNeeds]);

    useEffect(() => {
        localStorage.setItem('proposals', JSON.stringify(proposals));
    }, [proposals]);

    const addToProposal = (id) => {
        if (!proposals.includes(id)) setProposals([...proposals, id]);
    };

    const removeFromProposal = (id) => {
        setProposals(proposals.filter(pId => pId !== id));
    };

    const handleSubmitProposal = async () => {
        if (proposals.length === 0) return;
        try {
            const response = await api.post('/proposals/submit', { request_ids: proposals });
            if (response.data.success) {
                alert('Ваше предложение успешно отправлено!');
                setProposals([]);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось отправить предложение.');
        }
    };

    return (
        <>
            <NeedsSection 
                needs={needs} 
                proposals={proposals} 
                onAddToProposal={addToProposal} 
                loading={loading} 
                error={error} 
            />
            <ProposalSection 
                needs={needs} 
                proposals={proposals} 
                onRemoveFromProposal={removeFromProposal} 
                onSubmit={handleSubmitProposal} 
            />
        </>
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

// ========================================================================
// === ОСНОВНЫЕ КОМПОНЕНТЫ ИНТЕРФЕЙСА =====================================
// ========================================================================

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

function NeedsSection({ needs, proposals, onAddToProposal, loading, error }) {
    if (loading) return <div className="text-center p-5"><div className="spinner-border"></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="card mb-4">
            <div className="card-header"><h3>Актуальные потребности</h3></div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead><tr><th>Наименование</th><th>Категория</th><th>Кол-во</th><th>Срок поставки</th><th>Действие</th></tr></thead>
                        <tbody>
                            {needs.length > 0 ? needs.map(need => (
                                <tr key={need.request_id}>
                                    <td><strong>{need.title}</strong><br/><small className="text-muted">{need.description || ''}</small></td>
                                    <td>{need.category || 'Не указана'}</td>
                                    <td>{need.total_quantity} {need.unit || 'шт.'}</td>
                                    <td>{need.delivery_period || 'Не указан'}</td>
                                    <td>
                                        {proposals.includes(need.request_id)
                                            ? <span className="text-success fw-bold"><i className="bi bi-check-circle-fill"></i> Добавлено</span>
                                            : <button className="btn btn-sm btn-success" onClick={() => onAddToProposal(need.request_id)}>Добавить</button>
                                        }
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="5" className="text-center text-muted">Активных потребностей нет.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ProposalSection({ needs, proposals, onRemoveFromProposal, onSubmit }) {
    return (
        <div className="card mb-4">
            <div className="card-header"><h3><i className="bi bi-basket3-fill me-2"></i>Ваше предложение</h3></div>
            <div className="card-body">
                {proposals.length > 0 ? (
                    <ul className="list-group">
                        {proposals.map(id => {
                            const need = needs.find(n => n.request_id === id);
                            return (
                                <li key={id} className="list-group-item d-flex justify-content-between align-items-center">
                                    {need ? need.title : `Потребность #${id}`}
                                    <button className="btn btn-sm btn-danger" onClick={() => onRemoveFromProposal(id)}><i className="bi bi-trash"></i></button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-muted">Добавьте потребности из списка выше, чтобы сформировать предложение.</p>
                )}
                {proposals.length > 0 && (
                    <button className="btn btn-primary mt-3" onClick={onSubmit}>
                        <i className="bi bi-send me-2"></i>Отправить предложение
                    </button>
                )}
            </div>
        </div>
    );
}

// ========================================================================
// === КОМПОНЕНТЫ ФОРМ ====================================================
// ========================================================================

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

export default App;