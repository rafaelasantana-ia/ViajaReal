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
  const [reports, setReports] = useState([]);
  const [comparisonA, setComparisonA] = useState('');
  const [comparisonB, setComparisonB] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    city: '',
    region: '',
    startDate: '',
    endDate: '',
    travelType: 'lazer',
    food: '',
    transport: '',
    lodging: '',
    activities: '',
    shopping: '',
    others: '',
    total: '',
    experience: '',
    tips: '',
    positives: '',
    negatives: '',
    recommendedPlaces: '',
    avoidPlaces: '',
    safetyNotes: '',
    generalRate: '5',
    safetyRate: '5',
    costRate: '5',
    transportRate: '5',
    foodRate: '5',
    recommendDestination: true,
    latitude: '-8.0476',
    longitude: '-34.8770',
    photos: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'],
  });
  const [formError, setFormError] = useState('');

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

    const requiredFields = [formData.title, formData.destination, formData.city, formData.region, formData.startDate, formData.endDate, formData.experience];
    if (requiredFields.some((field) => !field || String(field).trim() === '')) {
      setFormError('Preencha os campos obrigatórios destacados para salvar o relato.');
      return;
    }

    const values = [
      Number(formData.food || 0),
      Number(formData.transport || 0),
      Number(formData.lodging || 0),
      Number(formData.activities || 0),
      Number(formData.shopping || 0),
      Number(formData.others || 0),
    ];
    const total = values.reduce((accumulator, value) => accumulator + value, 0);

    const newReport = {
      title: formData.title,
      destination: `${formData.destination}, ${formData.city}`,
      cost: `R$ ${total.toLocaleString('pt-BR')}`,
      safety: formData.safetyRate >= 4 ? 'Alta' : 'Moderada',
      story: formData.experience,
      note: formData.experience,
      aiPreview: {
        summary: `Relato de ${formData.destination} com foco em ${formData.travelType}.`,
        positives: formData.positives,
        negatives: formData.negatives,
        profile: formData.travelType,
      },
    };

    try {
      await postWithFallback('/stories', newReport);
      setReports((prev) => [newReport, ...prev]);
      setFormData({
        title: '',
        destination: '',
        city: '',
        region: '',
        startDate: '',
        endDate: '',
        travelType: 'lazer',
        food: '',
        transport: '',
        lodging: '',
        activities: '',
        shopping: '',
        others: '',
        total: '',
        experience: '',
        tips: '',
        positives: '',
        negatives: '',
        recommendedPlaces: '',
        avoidPlaces: '',
        safetyNotes: '',
        generalRate: '5',
        safetyRate: '5',
        costRate: '5',
        transportRate: '5',
        foodRate: '5',
        recommendDestination: true,
        latitude: '-8.0476',
        longitude: '-34.8770',
        photos: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'],
      });
      setFormError('');
      setActiveView('dashboard');
    } catch (error) {
      setReports((prev) => [newReport, ...prev]);
      setFormError('');
      setActiveView('dashboard');
    }
  };

  useEffect(() => {
    const values = [
      Number(formData.food || 0),
      Number(formData.transport || 0),
      Number(formData.lodging || 0),
      Number(formData.activities || 0),
      Number(formData.shopping || 0),
      Number(formData.others || 0),
    ];
    const total = values.reduce((accumulator, value) => accumulator + value, 0);
    setFormData((current) => ({ ...current, total: total.toString() }));
  }, [formData.food, formData.transport, formData.lodging, formData.activities, formData.shopping, formData.others]);

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
        <div className="section-header">
          <div>
            <p className="eyebrow">Adicionar relato de viagem</p>
            <h3>Conte sua experiência de forma detalhada</h3>
          </div>
          <div className="metric-pill">Mockado para futura integração com IA</div>
        </div>
        <p className="helper-text">Essas informações vão alimentar um resumo inteligente, sugestões e comparativos futuros.</p>
        {formError ? <p className="error-text">{formError}</p> : null}
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="card subsection-card full-width">
            <h4>Informações principais</h4>
            <div className="form-grid inner-grid">
              <label>
                Título do relato
                <input value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="Ex.: Viagem econômica em Lisboa" />
              </label>
              <label>
                Destino
                <input value={formData.destination} onChange={(event) => setFormData({ ...formData, destination: event.target.value })} placeholder="Ex.: Lisboa" />
              </label>
              <label>
                Cidade
                <input value={formData.city} onChange={(event) => setFormData({ ...formData, city: event.target.value })} placeholder="Ex.: Lisboa" />
              </label>
              <label>
                Estado ou país
                <input value={formData.region} onChange={(event) => setFormData({ ...formData, region: event.target.value })} placeholder="Ex.: Portugal" />
              </label>
              <label>
                Data de início
                <input type="date" value={formData.startDate} onChange={(event) => setFormData({ ...formData, startDate: event.target.value })} />
              </label>
              <label>
                Data de fim
                <input type="date" value={formData.endDate} onChange={(event) => setFormData({ ...formData, endDate: event.target.value })} />
              </label>
              <label>
                Tipo de viagem
                <select value={formData.travelType} onChange={(event) => setFormData({ ...formData, travelType: event.target.value })}>
                  <option value="lazer">Lazer</option>
                  <option value="trabalho">Trabalho</option>
                  <option value="familia">Família</option>
                  <option value="casal">Casal</option>
                  <option value="solo">Solo</option>
                  <option value="economica">Econômica</option>
                  <option value="aventura">Aventura</option>
                </select>
              </label>
            </div>
          </div>

          <div className="card subsection-card full-width">
            <h4>Gastos da viagem</h4>
            <div className="form-grid inner-grid">
              <label>Alimentação <input type="number" min="0" value={formData.food} onChange={(event) => setFormData({ ...formData, food: event.target.value })} placeholder="0" /></label>
              <label>Transporte <input type="number" min="0" value={formData.transport} onChange={(event) => setFormData({ ...formData, transport: event.target.value })} placeholder="0" /></label>
              <label>Hospedagem <input type="number" min="0" value={formData.lodging} onChange={(event) => setFormData({ ...formData, lodging: event.target.value })} placeholder="0" /></label>
              <label>Passeios <input type="number" min="0" value={formData.activities} onChange={(event) => setFormData({ ...formData, activities: event.target.value })} placeholder="0" /></label>
              <label>Compras <input type="number" min="0" value={formData.shopping} onChange={(event) => setFormData({ ...formData, shopping: event.target.value })} placeholder="0" /></label>
              <label>Outros <input type="number" min="0" value={formData.others} onChange={(event) => setFormData({ ...formData, others: event.target.value })} placeholder="0" /></label>
              <label className="full-width">Total calculado <input value={formData.total || '0'} readOnly /></label>
            </div>
          </div>

          <div className="card subsection-card full-width">
            <h4>Relato da experiência</h4>
            <div className="form-grid inner-grid">
              <label className="full-width">Descreva os lugares visitados e sua experiência <textarea value={formData.experience} onChange={(event) => setFormData({ ...formData, experience: event.target.value })} rows="4" placeholder="Explique sua rotina, lugares visitados e sensação geral" /></label>
              <label className="full-width">Dicas sobre o destino <textarea value={formData.tips} onChange={(event) => setFormData({ ...formData, tips: event.target.value })} rows="3" placeholder="Ajude outros viajantes com dicas práticas" /></label>
              <label>Pontos positivos <textarea value={formData.positives} onChange={(event) => setFormData({ ...formData, positives: event.target.value })} rows="2" /></label>
              <label>Pontos negativos <textarea value={formData.negatives} onChange={(event) => setFormData({ ...formData, negatives: event.target.value })} rows="2" /></label>
              <label>Lugares que recomenda <textarea value={formData.recommendedPlaces} onChange={(event) => setFormData({ ...formData, recommendedPlaces: event.target.value })} rows="2" /></label>
              <label>Lugares que evitaria <textarea value={formData.avoidPlaces} onChange={(event) => setFormData({ ...formData, avoidPlaces: event.target.value })} rows="2" /></label>
              <label className="full-width">Observações sobre segurança, transporte e custo-benefício <textarea value={formData.safetyNotes} onChange={(event) => setFormData({ ...formData, safetyNotes: event.target.value })} rows="3" /></label>
            </div>
          </div>

          <div className="card subsection-card full-width">
            <h4>Avaliação</h4>
            <div className="form-grid inner-grid">
              <label>Nota geral <input type="range" min="1" max="5" value={formData.generalRate} onChange={(event) => setFormData({ ...formData, generalRate: event.target.value })} /> <span>{formData.generalRate}/5</span></label>
              <label>Segurança <input type="range" min="1" max="5" value={formData.safetyRate} onChange={(event) => setFormData({ ...formData, safetyRate: event.target.value })} /> <span>{formData.safetyRate}/5</span></label>
              <label>Custo-benefício <input type="range" min="1" max="5" value={formData.costRate} onChange={(event) => setFormData({ ...formData, costRate: event.target.value })} /> <span>{formData.costRate}/5</span></label>
              <label>Transporte <input type="range" min="1" max="5" value={formData.transportRate} onChange={(event) => setFormData({ ...formData, transportRate: event.target.value })} /> <span>{formData.transportRate}/5</span></label>
              <label>Alimentação <input type="range" min="1" max="5" value={formData.foodRate} onChange={(event) => setFormData({ ...formData, foodRate: event.target.value })} /> <span>{formData.foodRate}/5</span></label>
              <label className="checkbox-label"><input type="checkbox" checked={formData.recommendDestination} onChange={(event) => setFormData({ ...formData, recommendDestination: event.target.checked })} /> Recomendo este destino</label>
            </div>
          </div>

          <div className="card subsection-card full-width">
            <h4>Localização e mapa</h4>
            <div className="form-grid inner-grid">
              <label>Latitude <input value={formData.latitude} onChange={(event) => setFormData({ ...formData, latitude: event.target.value })} /></label>
              <label>Longitude <input value={formData.longitude} onChange={(event) => setFormData({ ...formData, longitude: event.target.value })} /></label>
              <div className="map-box full-width">
                <div className="map-pin" />
                <span>Mapa mockado em construção</span>
              </div>
            </div>
          </div>

          <div className="card subsection-card full-width">
            <h4>Fotos</h4>
            <p className="helper-text">Área visual para upload futuro. Por enquanto, é possível usar uma imagem mockada.</p>
            <div className="photo-zone">
              <div className="photo-preview">
                <img src={formData.photos[0]} alt="Preview da viagem" />
              </div>
              <div>
                <button type="button" className="ghost-btn">Adicionar foto</button>
                <p className="helper-text">Integração futura com upload real ou imagens mockadas.</p>
              </div>
            </div>
          </div>

          <div className="card subsection-card full-width">
            <h4>Resumo antes de salvar</h4>
            <div className="summary-box">
              <p><strong>{formData.title || 'Título do relato'}</strong></p>
              <p>{formData.destination || 'Destino'} • {formData.city || 'Cidade'} • {formData.region || 'Estado/País'}</p>
              <p>{formData.experience || 'Descreva sua experiência...'}</p>
              <p>Total estimado: R$ {Number(formData.total || 0).toLocaleString('pt-BR')}</p>
              <p>IA futura poderá resumir, detectar pontos fortes e gerar recomendações.</p>
            </div>
          </div>

          <div className="actions-row full-width">
            <button type="button" className="ghost-btn" onClick={() => setActiveView('dashboard')}>Cancelar</button>
            <button type="submit" className="primary-btn">Salvar relato</button>
          </div>
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
