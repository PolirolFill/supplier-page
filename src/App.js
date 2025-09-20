import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [needs, setNeeds] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      axios.get('http://your-server-ip/api/needs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => setNeeds(response.data))
      .catch(error => console.error('Ошибка:', error));
    }
  }, [token]);

  const handleLogin = () => {
    axios.post('http://your-server-ip/api/login', { email, password })
      .then(response => {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      })
      .catch(error => alert('Ошибка входа: ' + error.message));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1>Потребности учреждения</h1>
      {!token ? (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '8px', marginRight: '10px' }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '8px', marginRight: '10px' }}
          />
          <button onClick={handleLogin} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none' }}>
            Войти
          </button>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>Товар</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Количество</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Срочность</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {needs.map(need => (
              <tr key={need.id}>
                <td style={{ border: '1px solid black', padding: '8px' }}>{need.item}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{need.quantity}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{need.urgency}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{need.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;