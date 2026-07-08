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

const mockDestinationProfiles = [
  {
    id: 'lisboa',
    name: 'Lisboa',
    country: 'Portugal',
    region: 'Europa',
    summary: 'Lisboa combina clima agradável, boa infraestrutura, gastronomia forte e bairros cheios de história, sendo excelente para viagens curtas e médias.',
    averageCost: 'R$ 380/dia',
    positives: ['Boa conexão com transporte público', 'Restaurantes variados', 'Bairros com muito charme'],
    attentionPoints: ['Preços mais altos em áreas centrais', 'Algumas regiões podem ficar lotadas no verão'],
    recommendedPlaces: ['Alfama', 'Belém', 'LX Factory', 'Parque das Nações'],
    idealTraveler: 'Casal ou dupla que busca cultura, gastronomia e passeio urbano com conforto moderado.',
    itinerary: ['Dia 1: Alfama e miradouros', 'Dia 2: Belém e culinária', 'Dia 3: bairro moderno e descanso'],
    tip: 'Reserve hospedagem próxima ao metrô para economizar tempo e transporte.',
    rating: 4.8,
    safety: 'Alta',
    transit: 'Excelente',
    stay: 'R$ 220/noite',
    budget: 'Médio',
    comparison: { lodging: 320, food: 190, transport: 120, safety: 85 },
    reportRows: [
      { category: 'Hospedagem', value: 'R$ 220/noite' },
      { category: 'Alimentação', value: 'R$ 70/dia' },
      { category: 'Transporte', value: 'R$ 35/dia' },
    ],
    stories: [
      { title: 'Férias casuais em Lisboa', rating: 4.9, cost: 'R$ 860', travelType: 'Casal', summary: 'Passeamos muito a pé, visitamos mirantes e comemos bem por bairros pequenos.', actionLabel: 'Ver relato completo' },
      { title: 'Fim de semana gastronômico', rating: 4.7, cost: 'R$ 720', travelType: 'Amigos', summary: 'Ótimo para comer bem, conhecer cafés e fazer passeios leves.', actionLabel: 'Ver relato completo' },
    ],
    mapMarkers: [
      { label: 'Restaurante', type: 'restaurante', position: 'Centro' },
      { label: 'Ponto turístico', type: 'ponto', position: 'Belém' },
      { label: 'Hospedagem', type: 'hospedagem', position: 'Chiado' },
    ],
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonésia',
    region: 'Ásia',
    summary: 'Bali é ideal para quem busca relaxamento, praias, espiritualidade, natureza e experiência de estilo de vida mais leve.',
    averageCost: 'R$ 300/dia',
    positives: ['Belezas naturais', 'Boa oferta de resorts', 'Excelente para descanso'],
    attentionPoints: ['Distâncias entre regiões podem ser grandes', 'Alguns trechos exigem planejamento'],
    recommendedPlaces: ['Ubud', 'Canggu', 'Uluwatu', 'Seminyak'],
    idealTraveler: 'Viajante solo ou casal que deseja descanso e um mix de surf, cultura e wellness.',
    itinerary: ['Dia 1: Ubud e templos', 'Dia 2: praia e sunset', 'Dia 3: spa e culinária local'],
    tip: 'Combine uma base em Ubud com um fim de semana em Canggu para equilibrar paz e vida noturna.',
    rating: 4.6,
    safety: 'Moderada',
    transit: 'Boa',
    stay: 'R$ 180/noite',
    budget: 'Médio',
    comparison: { lodging: 250, food: 140, transport: 95, safety: 70 },
    reportRows: [
      { category: 'Hospedagem', value: 'R$ 180/noite' },
      { category: 'Alimentação', value: 'R$ 55/dia' },
      { category: 'Transporte', value: 'R$ 25/dia' },
    ],
    stories: [
      { title: 'Ritmo relaxado em Bali', rating: 4.8, cost: 'R$ 640', travelType: 'Solo', summary: 'Fui para descanso, fiz trilhas e fiquei encantada com as praias.', actionLabel: 'Ver relato completo' },
      { title: 'Semana econômica com wellness', rating: 4.5, cost: 'R$ 700', travelType: 'Casal', summary: 'Ótimo custo-benefício para quem quer spa, cafés e praias.', actionLabel: 'Ver relato completo' },
    ],
    mapMarkers: [
      { label: 'Praia', type: 'ponto', position: 'Uluwatu' },
      { label: 'Hospedagem', type: 'hospedagem', position: 'Ubud' },
      { label: 'Restaurante', type: 'restaurante', position: 'Canggu' },
    ],
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    country: 'Marrocos',
    region: 'África',
    summary: 'Marrakech é perfeita para quem gosta de cultura intensa, mercados, arquitetura e viagens mais imersivas.',
    averageCost: 'R$ 260/dia',
    positives: ['Cultura rica', 'Mercados e artesanato', 'Boa experiência para quem gosta de explorar'],
    attentionPoints: ['Clima quente', 'Trânsito e aglomeração', 'Planejamento de transporte local'],
    recommendedPlaces: ['Medina', 'Jardim Majorelle', 'Souk', 'Palácio da Bahia'],
    idealTraveler: 'Viajante de aventura, cultura e economia, especialmente para famílias ou grupos.',
    itinerary: ['Dia 1: Medina e souks', 'Dia 2: jardins e café', 'Dia 3: passeio no atardecer'],
    tip: 'Use um guia local em parte do percurso para aproveitar melhor os mercados e a cultura.',
    rating: 4.5,
    safety: 'Moderada',
    transit: 'Boa',
    stay: 'R$ 150/noite',
    budget: 'Baixo',
    comparison: { lodging: 200, food: 110, transport: 85, safety: 68 },
    reportRows: [
      { category: 'Hospedagem', value: 'R$ 150/noite' },
      { category: 'Alimentação', value: 'R$ 40/dia' },
      { category: 'Transporte', value: 'R$ 20/dia' },
    ],
    stories: [
      { title: 'Explorando a Medina', rating: 4.6, cost: 'R$ 620', travelType: 'Família', summary: 'A experiência foi intensa, com muita comida e mercados fascinantes.', actionLabel: 'Ver relato completo' },
      { title: 'Viagem econômica e cultural', rating: 4.4, cost: 'R$ 560', travelType: 'Economia', summary: 'Bom destino para investir pouco e viver uma experiência forte.', actionLabel: 'Ver relato completo' },
    ],
    mapMarkers: [
      { label: 'Mercado', type: 'ponto', position: 'Medina' },
      { label: 'Hospedagem', type: 'hospedagem', position: 'Gueliz' },
      { label: 'Restaurante', type: 'restaurante', position: 'Jemaa el-Fnaa' },
    ],
  },
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    country: 'Argentina',
    region: 'América do Sul',
    summary: 'Buenos Aires mistura cultura, gastronomia e vida urbana vibrante, com opções econômicas e boa mobilidade.',
    averageCost: 'R$ 320/dia',
    positives: ['Cultura rica', 'Gastronomia de qualidade', 'Bairros charmosos'],
    attentionPoints: ['Câmbio informal', 'Segurança à noite em algumas áreas', 'Trânsito em horários de pico'],
    recommendedPlaces: ['Palermo', 'Recoleta', 'San Telmo', 'Puerto Madero'],
    idealTraveler: 'Viajantes econômicos que desejam cultura, gastronomia e vida urbana',
    itinerary: ['Dia 1: Palermo e cafés', 'Dia 2: Centro histórico e museus', 'Dia 3: Tango e gastronomia'],
    tip: 'Use transporte público e compare câmbio oficial antes de trocar dinheiro.',
    rating: 4.6,
    safety: 'Boa',
    transit: 'Bom',
    stay: 'R$ 180/noite',
    budget: 'Médio',
    comparison: { lodging: 280, food: 130, transport: 90, safety: 78 },
    reportRows: [
      { category: 'Hospedagem', value: 'R$ 180/noite' },
      { category: 'Alimentação', value: 'R$ 65/dia' },
      { category: 'Transporte', value: 'R$ 35/dia' },
    ],
    stories: [
      { title: 'Fim de semana em Palermo', rating: 4.7, cost: 'R$ 680', travelType: 'Amigos', summary: 'Bairro excelente para cafés, restaurantes e vida noturna moderada.', actionLabel: 'Ver relato completo' },
      { title: 'Cultura e tango em Buenos Aires', rating: 4.5, cost: 'R$ 590', travelType: 'Casal', summary: 'Cidade com ótimas opções culturais e passeios a pé.', actionLabel: 'Ver relato completo' },
    ],
    mapMarkers: [
      { label: 'Bar', type: 'restaurante', position: 'Palermo' },
      { label: 'Museu', type: 'ponto', position: 'Recoleta' },
      { label: 'Hospedagem', type: 'hospedagem', position: 'San Telmo' },
    ],
  },
  {
    id: 'toquio',
    name: 'Tóquio',
    country: 'Japão',
    region: 'Ásia',
    summary: 'Tóquio combina tecnologia, segurança, gastronomia e bairros muito diferentes entre si, ideal para quem quer organização e variedade.',
    averageCost: 'R$ 520/dia',
    positives: ['Segurança alta', 'Transporte eficiente', 'Cultura e comida muito ricas'],
    attentionPoints: ['Custo mais alto', 'Planejamento de reservas', 'Idioma local pode ser um desafio'],
    recommendedPlaces: ['Shibuya', 'Asakusa', 'Harajuku', 'Akihabara'],
    idealTraveler: 'Viajante que valoriza conforto, segurança e uma experiência urbana muito bem estruturada.',
    itinerary: ['Dia 1: Shibuya e Harajuku', 'Dia 2: Asakusa e templos', 'Dia 3: Akihabara e descanso'],
    tip: 'Aproveite o transporte ferroviário e prefira bairros bem conectados para reduzir deslocamentos.',
    rating: 4.9,
    safety: 'Alta',
    transit: 'Excelente',
    stay: 'R$ 280/noite',
    budget: 'Alto',
    comparison: { lodging: 360, food: 220, transport: 140, safety: 90 },
    reportRows: [
      { category: 'Hospedagem', value: 'R$ 280/noite' },
      { category: 'Alimentação', value: 'R$ 90/dia' },
      { category: 'Transporte', value: 'R$ 45/dia' },
    ],
    stories: [
      { title: 'Viagem tecnológica e confortável', rating: 4.9, cost: 'R$ 1.100', travelType: 'Trabalho', summary: 'Ótimo para quem quer eficiência, segurança e boa experiência urbana.', actionLabel: 'Ver relato completo' },
      { title: 'Semana em Tóquio com cultura', rating: 4.8, cost: 'R$ 980', travelType: 'Solo', summary: 'Muito fácil de circular e com bairros que oferecem experiências bem diferentes.', actionLabel: 'Ver relato completo' },
    ],
    mapMarkers: [
      { label: 'Restaurante', type: 'restaurante', position: 'Shibuya' },
      { label: 'Ponto turístico', type: 'ponto', position: 'Asakusa' },
      { label: 'Hospedagem', type: 'hospedagem', position: 'Shinjuku' },
    ],
  },
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
  const [smartAnalysis, setSmartAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPreferences, setSearchPreferences] = useState({
    travelType: 'solo',
    budget: 'médio',
    duration: '5 dias',
    interests: ['praia', 'natureza'],
    comfort: 'médio',
    accessible: true,
    safe: true,
  });
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
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
    const query = searchQuery.toLowerCase();
    return mockDestinationProfiles.filter((destination) => {
      const haystack = `${destination.name} ${destination.country} ${destination.region} ${destination.summary}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchQuery]);

  const destinationA = destinations.find((item) => item.id === comparisonA) || destinations[0];
  const destinationB = destinations.find((item) => item.id === comparisonB) || destinations[1];

  const handleInterestToggle = (interest) => {
    setSearchPreferences((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }));
  };

  const handleGenerateSuggestion = (event) => {
    event.preventDefault();
    setSearchLoading(true);
    setSmartAnalysis(null);
    setAnalysisError('');

    window.setTimeout(() => {
      const query = searchQuery.trim().toLowerCase();
      const scoredResults = mockDestinationProfiles
        .map((destination) => {
          let score = 0;
          const haystack = `${destination.name} ${destination.country} ${destination.region} ${destination.summary}`.toLowerCase();
          if (query && haystack.includes(query)) {
            score += 5;
          }
          if (searchPreferences.interests.some((interest) => destination.summary.toLowerCase().includes(interest))) {
            score += 3;
          }
          if (searchPreferences.budget === destination.budget.toLowerCase()) {
            score += 3;
          }
          if (searchPreferences.travelType === 'economica' && destination.budget === 'Baixo') {
            score += 2;
          }
          if (searchPreferences.safe && destination.safety === 'Alta') {
            score += 2;
          }
          if (searchPreferences.accessible && destination.transit === 'Excelente') {
            score += 2;
          }
          return { ...destination, score };
        })
        .sort((first, second) => second.score - first.score);

      const recommendation = scoredResults[0] || mockDestinationProfiles[0];
      setSearchResult(recommendation);
      setSelectedDestination(recommendation);
      setSearchLoading(false);
    }, 900);
  };

  const handleGenerateSmartAnalysis = () => {
    setSmartAnalysis(null);
    setAnalysisLoading(true);
    setAnalysisError('');

    const destinationName = (searchResult?.name || searchQuery || '').toLowerCase();
    const isBuenosAires = destinationName.includes('buenos') || destinationName.includes('aires');

    window.setTimeout(() => {
      if (isBuenosAires) {
        setSmartAnalysis({
          title: 'Com base em 38 relatos anônimos sobre Buenos Aires:',
          items: [
            'Gasto médio diário: R$ 320 a R$ 480',
            'Bairro mais recomendado: Palermo',
            'Transporte mais citado: Uber e metrô',
            'Alerta recorrente: atenção ao câmbio informal',
            'Perfil mais satisfeito: viajantes econômicos',
            '82% dos viajantes disseram que voltariam',
          ],
        });
      } else {
        setSmartAnalysis({
          title: `Análise inteligente para ${searchResult?.name || 'o destino selecionado'}:`,
          items: [
            `Gasto médio diário: ${searchResult?.averageCost || 'R$ 0/dia'}`,
            `Bairro mais recomendado: ${searchResult?.recommendedPlaces?.[0] || 'N/A'}`,
            `Transporte mais citado: ${searchResult?.transit || 'N/A'}`,
            `Alerta recorrente: ${searchResult?.attentionPoints?.[0] || 'Atenção aos dados mockados'}`,
            `Perfil mais satisfeito: ${searchResult?.idealTraveler || 'Viajante geral'}`,
            'Análise gerada com base em dados simulados.',
          ],
        });
      }
      setAnalysisLoading(false);
    }, 700);
  };

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
      <section className="card hero-card">
        <div>
          <p className="eyebrow">Buscar destino</p>
          <h3>Encontre um local com base em relatos, preferências e comportamento de viajantes</h3>
          <p>Os resultados abaixo são mockados, mas a lógica já foi organizada para evoluir para uma recomendação com IA.</p>
        </div>
        <div className="metric-pill">Sugestão simulada · IA futura</div>
      </section>

      <section className="search-layout">
        <div className="card search-panel">
          <div className="section-header">
            <h4>Perfil de busca</h4>
            <span className="chip">Mockado</span>
          </div>
          <form className="search-form" onSubmit={handleGenerateSuggestion}>
            <label className="full-width">
              Para onde você quer viajar?
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ex.: Lisboa, praia, natureza ou cultura"
              />
            </label>

            <div className="suggestion-list">
              {filteredDestinations.slice(0, 4).map((destination) => (
                <button type="button" key={destination.id} className="suggestion-pill" onClick={() => setSearchQuery(destination.name)}>
                  {destination.name} · {destination.country}
                </button>
              ))}
            </div>

            <div className="filter-grid">
              <label>
                Tipo de viagem
                <select value={searchPreferences.travelType} onChange={(event) => setSearchPreferences({ ...searchPreferences, travelType: event.target.value })}>
                  <option value="solo">Solo</option>
                  <option value="casal">Casal</option>
                  <option value="familia">Família</option>
                  <option value="amigos">Amigos</option>
                  <option value="trabalho">Trabalho</option>
                  <option value="economica">Econômica</option>
                  <option value="aventura">Aventura</option>
                </select>
              </label>

              <label>
                Faixa de orçamento
                <select value={searchPreferences.budget} onChange={(event) => setSearchPreferences({ ...searchPreferences, budget: event.target.value })}>
                  <option value="baixo">Baixo</option>
                  <option value="médio">Médio</option>
                  <option value="alto">Alto</option>
                </select>
              </label>

              <label>
                Duração estimada
                <select value={searchPreferences.duration} onChange={(event) => setSearchPreferences({ ...searchPreferences, duration: event.target.value })}>
                  <option value="3 dias">3 dias</option>
                  <option value="5 dias">5 dias</option>
                  <option value="7 dias">7 dias</option>
                  <option value="10 dias">10 dias</option>
                </select>
              </label>

              <label>
                Nível de conforto
                <select value={searchPreferences.comfort} onChange={(event) => setSearchPreferences({ ...searchPreferences, comfort: event.target.value })}>
                  <option value="simples">Simples</option>
                  <option value="médio">Médio</option>
                  <option value="alto">Alto</option>
                </select>
              </label>
            </div>

            <div className="filter-section">
              <p className="helper-text">Interesses</p>
              <div className="tag-row">
                {['praia', 'natureza', 'gastronomia', 'cultura', 'compras', 'vida noturna', 'trilhas', 'descanso'].map((interest) => (
                  <button key={interest} type="button" className={searchPreferences.interests.includes(interest) ? 'tag active-tag' : 'tag'} onClick={() => handleInterestToggle(interest)}>
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="toggle-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={searchPreferences.accessible} onChange={(event) => setSearchPreferences({ ...searchPreferences, accessible: event.target.checked })} />
                Destino acessível
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={searchPreferences.safe} onChange={(event) => setSearchPreferences({ ...searchPreferences, safe: event.target.checked })} />
                Destino seguro
              </label>
            </div>

            <div className="action-group">
              <button type="submit" className="primary-btn">Gerar sugestão</button>
              <button type="button" className="ghost-btn" onClick={handleGenerateSmartAnalysis}>Gerar análise inteligente</button>
            </div>
          </form>
        </div>

        <div className="card result-panel">
          {searchLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Gerando sugestão personalizada...</p>
              <span>Estamos analisando relatos mockados, preferências e padrões de recomendação.</span>
            </div>
          ) : searchResult ? (
            <>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Resumo Inteligente do Destino</p>
                  <h4>{searchResult.name}, {searchResult.country}</h4>
                </div>
                <div className="metric-pill">{searchResult.averageCost}</div>
              </div>

              <div className="summary-box">
                <h5>Resumo geral</h5>
                <p>{searchResult.summary}</p>
              </div>

              <div className="insight-grid">
                <article className="insight-card">
                  <h5>Média de gastos</h5>
                  <p>{searchResult.averageCost}</p>
                </article>
                <article className="insight-card">
                  <h5>Pontos positivos</h5>
                  <ul>
                    {searchResult.positives.map((positive) => <li key={positive}>{positive}</li>)}
                  </ul>
                </article>
                <article className="insight-card">
                  <h5>Pontos de atenção</h5>
                  <ul>
                    {searchResult.attentionPoints.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </article>
              </div>

              <div className="summary-box">
                <h5>Lugares mais recomendados</h5>
                <p>{searchResult.recommendedPlaces.join(' • ')}</p>
              </div>

              <div className="summary-box">
                <h5>Melhor perfil de viajante</h5>
                <p>{searchResult.idealTraveler}</p>
              </div>

              <div className="summary-box">
                <h5>Roteiro simples</h5>
                <ul>
                  {searchResult.itinerary.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <div className="summary-box">
                <h5>Dica final personalizada</h5>
                <p>{searchResult.tip}</p>
              </div>

              <div className="card-footer">
                <span>Baseado em relatos mockados e preferências do perfil</span>
                <button onClick={() => { setSelectedDestination(searchResult); setActiveView('details'); }}>Ver detalhes</button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h4>Nenhuma sugestão gerada ainda</h4>
              <p>Defina seus filtros e clique em “Gerar sugestão” para ver um resumo inicial do destino.</p>
            </div>
          )}

          {(analysisLoading || smartAnalysis) ? (
            <div className="card analysis-card">
              <div className="section-header">
                <h4>Análise inteligente</h4>
                <span className="chip">Mockado</span>
              </div>
              {analysisLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <p>Gerando análise inteligente...</p>
                </div>
              ) : smartAnalysis ? (
                <>
                  <p>{smartAnalysis.title}</p>
                  <ul>
                    {smartAnalysis.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </>
              ) : null}
              {analysisError ? <p className="error-text">{analysisError}</p> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <h4>Relatos encontrados</h4>
          <span className="chip">{searchResult?.stories?.length ? `${searchResult.stories.length} relatos` : 'Sem relatos'}</span>
        </div>
        {searchResult?.stories?.length ? (
          <div className="destination-grid">
            {searchResult.stories.map((story) => (
              <article key={story.title} className="destination-card">
                <div className="destination-top">
                  <h5>{story.title}</h5>
                  <span className="chip">⭐ {story.rating}</span>
                </div>
                <p><strong>Custo:</strong> {story.cost}</p>
                <p><strong>Tipo:</strong> {story.travelType}</p>
                <p>{story.summary}</p>
                <div className="card-footer">
                  <span>Relato mockado</span>
                  <button type="button" className="ghost-btn">{story.actionLabel}</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum relato encontrado para o filtro atual. Experimente outra combinação de preferências.</p>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <h4>Mapa mockado</h4>
          <span className="chip">Marcadores simulados</span>
        </div>
        <div className="map-box search-map">
          <div className="map-pin" />
          <p>{searchResult ? `${searchResult.name} · ${searchResult.country}` : 'Selecione um destino para visualizar os pontos destacados'}</p>
          <div className="map-marker-list">
            {(searchResult?.mapMarkers || []).map((marker) => (
              <span key={`${marker.label}-${marker.position}`} className="tag">{marker.label} · {marker.position}</span>
            ))}
          </div>
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
