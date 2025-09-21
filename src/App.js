// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- Стили ---
const styles = {
    logo: {
        fontWeight: 'bold',
        fontSize: '1.5rem',
        color: '#0d6efd',
        textDecoration: 'none'
    },
    header: {
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6'
    }
};

// --- Главный компонент ---
function App() {
    // !!! ВАЖНО: Замените на реальный домен вашего основного сервера
    const API_BASE_URL = 'https://ngb2.ru/sup_post/api/public';

    // --- Состояние компонента ---
    const [needs, setNeeds] = useState([]);
    const [proposals, setProposals] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('proposals') || '[]');
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Загрузка данных при монтировании ---
    const fetchNeeds = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE_URL}/needs`);
            setNeeds(response.data.needs || []);
        } catch (err) {
            setError('Не удалось загрузить данные. Сервер может быть недоступен.');
            console.error('Fetch needs error:', err);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchNeeds();
    }, [fetchNeeds]);

    // --- Сохранение предложений в localStorage ---
    useEffect(() => {
        localStorage.setItem('proposals', JSON.stringify(proposals));
    }, [proposals]);

    // --- Обработчики событий ---
    const addToProposal = (id) => {
        if (!proposals.includes(id)) {
            setProposals([...proposals, id]);
        }
    };

    const removeFromProposal = (id) => {
        setProposals(proposals.filter(pId => pId !== id));
    };

    const handleSubmitProposal = async () => {
        if (proposals.length === 0) return;

        const email = prompt("Для отправки предложения введите ваш регистрационный Email:");
        if (!email) return;

        try {
            const response = await axios.post(`${API_BASE_URL}/proposals/submit`, {
                email,
                request_ids: proposals
            });
            if (response.data.success) {
                alert('Ваше предложение успешно отправлено!');
                setProposals([]);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось отправить предложение. Проверьте Email.');
            console.error('Submit proposal error:', err);
        }
    };

    // --- Рендеринг ---
    return (
        <>
            <header className="p-3" style={styles.header}>
                <div className="container d-flex justify-content-between align-items-center">
                    <a href="/" style={styles.logo}>Портал Поставщика</a>
                </div>
            </header>

            <main className="container mt-4 pb-5">
                {/* Вместо страницы входа/регистрации теперь единый интерфейс */}
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
                <RegistrationSection apiUrl={API_BASE_URL} />
            </main>
        </>
    );
}

// --- Вспомогательные компоненты ---

function NeedsSection({ needs, proposals, onAddToProposal, loading, error }) {
    return (
        <div className="card mb-4">
            <div className="card-header"><h3>Актуальные потребности</h3></div>
            <div className="card-body">
                {loading && <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Загрузка...</span></div></div>}
                {error && <div className="alert alert-danger">{error}</div>}
                {!loading && !error && (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead><tr><th>Наименование</th><th>Категория</th><th>Кол-во</th><th>Срок поставки</th><th>Действие</th></tr></thead>
                            <tbody>
                                {needs.map(need => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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

function RegistrationSection({ apiUrl }) {
    const [form, setForm] = useState({ name: '', inn: '', email: '' });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${apiUrl}/suppliers/register`, form);
            if (response.data.success) {
                alert('Ваша заявка на регистрацию отправлена. После одобрения администратором вы получите доступ.');
                setForm({ name: '', inn: '', email: '' });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка регистрации.');
            console.error('Registration error:', err);
        }
    };

    return (
        <div className="card">
            <div className="card-header"><h3>Регистрация нового поставщика</h3></div>
            <div className="card-body">
                <p>Если вы еще не работали с нами, пожалуйста, отправьте заявку на регистрацию.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3"><label className="form-label">Название организации</label><input type="text" name="name" value={form.name} onChange={handleChange} className="form-control" required /></div>
                    <div className="mb-3"><label className="form-label">ИНН</label><input type="text" name="inn" value={form.inn} onChange={handleChange} className="form-control" required pattern="[0-9]{10,12}" /></div>
                    <div className="mb-3"><label className="form-label">Email для связи</label><input type="email" name="email" value={form.email} onChange={handleChange} className="form-control" required /></div>
                    <button type="submit" className="btn btn-info">Отправить заявку</button>
                </form>
            </div>
        </div>
    );
}

export default App;