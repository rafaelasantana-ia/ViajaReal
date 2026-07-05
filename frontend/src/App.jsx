import { useEffect, useMemo, useState } from 'react';

const API_URLS = [
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  'http://127.0.0.1:8001',
];

const mockInsights = [
  { title: 'Melhor relação custo/benefício', text: 'Lisboa aparece como a opção mais equilibrada para quem quer conforto sem exagerar no orçamento.' },
  { title: 'Mais segura', text: 'Tóquio é a escolha mais forte para quem prioriza segurança e organização.' },
  { title: 'Mais econômica', text: 'Marrakech é ideal para quem quer uma experiência cultural com investimento mais baixo.' },
];

async function fetchWithFallback(path) {
  let lastError;

  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function postWithFallback(path, payload) {
  let lastError;

  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function App() {
  const [stories, setStories] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [stats, setStats] = useState({ average_cost: 'R$ 360/dia', safety_level: 'Alta', popular_destination: 'Lisboa' });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiTip, setAiTip] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', destination: '', cost: '', safety: 'Boa', note: '' });
  const [reports, setReports] = useState([]);
  const [comparisonA, setComparisonA] = useState('');
  const [comparisonB, setComparisonB] = useState('');

  useEffect(() => {
    Promise.all([
      fetchWithFallback('/destinations'),
      fetchWithFallback('/stats/cost-average'),
      fetchWithFallback('/insights/summary'),
      fetchWithFallback('/stories'),
    ])
      .then(([destinationsData, statsData, insightsData, storiesData]) => {
        const normalizedDestinations = (destinationsData || []).map((destination) => ({
          ...destination,
          tags: destination.tags ? destination.tags.split(',') : [],
          comparison: {
            lodging: 300 + destination.id * 70,
            food: 180 + destination.id * 40,
            transport: 90 + destination.id * 20,
            safety: 70 + destination.id * 10,
          },
          reportRows: [
            { category: 'Hospedagem', value: destination.budget },
            { category: 'Alimentação', value: 'R$ 90/dia' },
            { category: 'Transporte', value: 'R$ 40/dia' },
          ],
        }));
        setDestinations(normalizedDestinations);
        setStats(statsData || { average_cost: 'R$ 360/dia', safety_level: 'Alta', popular_destination: 'Lisboa' });
        setAiTip(insightsData?.[0]?.text || 'Nenhuma sugestão disponível agora.');
        setStories(Array.isArray(storiesData) ? storiesData : []);
        setReports(Array.isArray(storiesData) ? storiesData : []);
        if (!selectedDestination && normalizedDestinations[0]) {
          setSelectedDestination(normalizedDestinations[0]);
        }
        if (!comparisonA && normalizedDestinations[0]) {
          setComparisonA(normalizedDestinations[0].id);
        }
        if (!comparisonB && normalizedDestinations[1]) {
          setComparisonB(normalizedDestinations[1].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setDestinations([]);
        setStories([]);
        setReports([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedDestination?.name) {
      fetchWithFallback(`/alerts?destination=${encodeURIComponent(selectedDestination.name)}`)
        .then((data) => setAlerts(Array.isArray(data) ? data : []))
        .catch(() => setAlerts([]));
    }
  }, [selectedDestination]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      const query = searchQuery.toLowerCase();
      return (
        destination.name.toLowerCase().includes(query) ||
        destination.country.toLowerCase().includes(query) ||
        (destination.tags || []).some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [destinations, searchQuery]);

  const destinationA = destinations.find((item) => item.id === comparisonA) || destinations[0];
  const destinationB = destinations.find((item) => item.id === comparisonB) || destinations[1];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newReport = {
      title: formData.title || 'Relato anônimo',
      destination: formData.destination || 'Destino não informado',
      cost: formData.cost || 'R$ 0',
      safety: formData.safety,
      story: formData.note,
    };

    try {
      await postWithFallback('/stories', newReport);
      setReports((prev) => [{ ...newReport, note: newReport.story }, ...prev]);
      setFormData({ title: '', destination: '', cost: '', safety: 'Boa', note: '' });
      setActiveView('dashboard');
    } catch (error) {
      setReports((prev) => [{ ...newReport, note: newReport.story }, ...prev]);
      setFormData({ title: '', destination: '', cost: '', safety: 'Boa', note: '' });
      setActiveView('dashboard');
    }
  };

  const renderDashboard = () => (
    <div className="page-grid">
      <section className="card hero-card">
        <div>
          <p className="eyebrow">Painel de viagem</p>
          <h2>Veja o que os viajantes estão dizendo</h2>
          <p>Resumo da semana com custos reais, segurança e tendências de destinos.</p>
        </div>
        <div className="metric-pill">Dica mockada: {aiTip}</div>
      </section>

      <section className="stats-grid">
        <article className="card stat-card">
          <h3>Relatos registrados</h3>
          <strong>{reports.length + stories.length}</strong>
          <span>+12% em relação à semana anterior</span>
        </article>
        <article className="card stat-card">
          <h3>Destino mais citado</h3>
          <strong>{stats.popular_destination}</strong>
          <span>Baseado em relatos e buscas</span>
        </article>
        <article className="card stat-card">
          <h3>Custo médio</h3>
          <strong>{stats.average_cost}</strong>
          <span>{stats.safety_level} em segurança</span>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <h3>Últimos relatos</h3>
          <button className="ghost-btn" onClick={() => setActiveView('add-report')}>Adicionar</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Destino</th>
              <th>Custo</th>
              <th>Segurança</th>
              <th>Resumo</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((item, index) => (
              <tr key={`${item.destination}-${index}`}>
                <td>{item.destination}</td>
                <td>{item.cost}</td>
                <td>{item.safety}</td>
                <td>{item.note || item.story}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );

  const renderSearch = () => (
    <div className="page-grid">
      <section className="card">
        <div className="section-header">
          <h3>Buscar destino</h3>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Busque por cidade, país ou tema"
          />
        </div>
        <div className="destination-grid">
          {filteredDestinations.length === 0 ? (
            <p>Nenhum destino encontrado para a busca.</p>
          ) : filteredDestinations.map((destination) => (
            <article key={destination.id} className="destination-card">
              <div className="destination-top">
                <h4>{destination.name}</h4>
                <span className="chip">{destination.region}</span>
              </div>
              <p>{destination.country}</p>
              <p>{destination.report}</p>
              <div className="tag-row">
                {destination.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div className="card-footer">
                <span>Orçamento: {destination.budget}</span>
                <button onClick={() => { setSelectedDestination(destination); setActiveView('details'); }}>Ver detalhes</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderDetails = () => (
    <div className="page-grid">
      <section className="card detail-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Detalhes do destino</p>
            <h3>{selectedDestination.name}, {selectedDestination.country}</h3>
          </div>
          <div className="metric-pill">Nota {selectedDestination.rating}/5</div>
        </div>
        <p>{selectedDestination.summary}</p>
        <div className="stats-grid two-cols">
          <article className="card stat-card">
            <h4>Segurança</h4>
            <strong>{selectedDestination.safety}</strong>
            <span>{selectedDestination.transit} transporte</span>
          </article>
          <article className="card stat-card">
            <h4>Hospedagem</h4>
            <strong>{selectedDestination.stay}</strong>
            <span>Orçamento estimado {selectedDestination.budget}</span>
          </article>
        </div>
        <div className="chart-card">
          <h4>Distribuição estimada</h4>
          <div className="bar-list">
            {Object.entries(selectedDestination.comparison).map(([key, value]) => (
              <div key={key} className="bar-row">
                <span>{key}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(value / 8, 100)}%` }} /></div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="table-container">
          <h4>Resumo de custos</h4>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {selectedDestination.reportRows.map((row) => (
                <tr key={row.category}>
                  <td>{row.category}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderForm = () => (
    <div className="page-grid">
      <section className="card">
        <h3>Adicionar relato anônimo</h3>
        <p>Seu relato ajuda outros viajantes a entender melhor custos e riscos.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Título
            <input value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="Ex.: Hostel bem localizado" required />
          </label>
          <label>
            Destino
            <input value={formData.destination} onChange={(event) => setFormData({ ...formData, destination: event.target.value })} placeholder="Ex.: Lisboa" required />
          </label>
          <label>
            Custo estimado
            <input value={formData.cost} onChange={(event) => setFormData({ ...formData, cost: event.target.value })} placeholder="Ex.: R$ 180/noite" required />
          </label>
          <label>
            Segurança
            <select value={formData.safety} onChange={(event) => setFormData({ ...formData, safety: event.target.value })}>
              <option value="Boa">Boa</option>
              <option value="Moderada">Moderada</option>
              <option value="Alta">Alta</option>
            </select>
          </label>
          <label className="full-width">
            Relato
            <textarea value={formData.note} onChange={(event) => setFormData({ ...formData, note: event.target.value })} rows="4" placeholder="Descreva sua experiência" required />
          </label>
          <button className="full-width primary-btn" type="submit">Salvar relato</button>
        </form>
      </section>
    </div>
  );

  const renderComparator = () => (
    <div className="page-grid">
      <section className="card">
        <h3>Comparador de custos</h3>
        <div className="compare-controls">
          <label>
            Destino A
            <select value={comparisonA || ''} onChange={(event) => setComparisonA(Number(event.target.value))}>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>{destination.name}</option>
              ))}
            </select>
          </label>
          <label>
            Destino B
            <select value={comparisonB || ''} onChange={(event) => setComparisonB(Number(event.target.value))}>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>{destination.name}</option>
              ))}
            </select>
          </label>
        </div>
        {destinationA && destinationB ? (
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>{destinationA.name}</th>
                <th>{destinationB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hospedagem</td>
                <td>{destinationA.comparison?.lodging}</td>
                <td>{destinationB.comparison?.lodging}</td>
              </tr>
              <tr>
                <td>Alimentação</td>
                <td>{destinationA.comparison?.food}</td>
                <td>{destinationB.comparison?.food}</td>
              </tr>
              <tr>
                <td>Transporte</td>
                <td>{destinationA.comparison?.transport}</td>
                <td>{destinationB.comparison?.transport}</td>
              </tr>
              <tr>
                <td>Segurança</td>
                <td>{destinationA.comparison?.safety}</td>
                <td>{destinationB.comparison?.safety}</td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );

  const renderSummary = () => (
    <div className="page-grid">
      <section className="card">
        <h3>Resumo inteligente mockado</h3>
        <p>Resumo simulado com base em padrões de viagem e relatos compartilhados.</p>
        <div className="insight-grid">
          {mockInsights.map((insight) => (
            <article key={insight.title} className="insight-card">
              <h4>{insight.title}</h4>
              <p>{insight.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderReport = () => (
    <div className="page-grid">
      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Relatório do destino</p>
            <h3>{selectedDestination.name} — visão consolidada</h3>
          </div>
          <div className="metric-pill">Simulação mockada</div>
        </div>
        <div className="report-layout">
          <div className="summary-box">
            <h4>Resumo</h4>
            <p>{selectedDestination?.summary}</p>
          </div>
          <div className="summary-box">
            <h4>Fatores chaves</h4>
            <ul>
              <li>Transporte público: {selectedDestination?.transit}</li>
              <li>Hospedagem: {selectedDestination?.stay}</li>
              <li>Segurança: {selectedDestination?.safety}</li>
            </ul>
          </div>
        </div>
        <div className="summary-box">
          <h4>Alertas simulados</h4>
          {alerts.length === 0 ? <p>Nenhum alerta disponível.</p> : alerts.map((alert) => (
            <p key={alert.message} className={`alert-${alert.level}`}>{alert.message}</p>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">ViajaReal</p>
          <h1>Planejamento</h1>
        </div>
        <nav className="nav-list">
          <button className={activeView === 'dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveView('dashboard')}>Dashboard</button>
          <button className={activeView === 'search' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveView('search')}>Buscar destino</button>
          <button className={activeView === 'details' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveView('details')}>Detalhes</button>
          <button className={activeView === 'add-report' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveView('add-report')}>Adicionar relato</button>
          <button className={activeView === 'comparator' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveView('comparator')}>Comparador</button>
          <button className={activeView === 'summary' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveView('summary')}>Resumo mockado</button>
          <button className={activeView === 'report' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveView('report')}>Relatório</button>
        </nav>
      </aside>

      <main className="main-content">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'search' && renderSearch()}
        {activeView === 'details' && renderDetails()}
        {activeView === 'add-report' && renderForm()}
        {activeView === 'comparator' && renderComparator()}
        {activeView === 'summary' && renderSummary()}
        {activeView === 'report' && renderReport()}
      </main>
    </div>
  );
}

export default App;
