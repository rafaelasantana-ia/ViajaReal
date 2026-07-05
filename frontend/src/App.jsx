import { useEffect, useState } from 'react';

const API_URLS = [
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  'http://127.0.0.1:8001',
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

function App() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiTip, setAiTip] = useState('');

  useEffect(() => {
    fetchWithFallback('/stories')
      .then((data) => {
        setStories(data);
        setLoading(false);
      })
      .catch(() => {
        setStories([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchWithFallback('/mock-ai-tip')
      .then((data) => setAiTip(data.tip))
      .catch(() => setAiTip('Nenhuma sugestão disponível agora.'));
  }, []);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Relatos reais de viagem</p>
          <h1>ViajaReal</h1>
          <p className="subtitle">
            Compartilhe experiências anônimas sobre custo, transporte, hospedagem e segurança.
          </p>
        </div>
        <div className="card tip-card">
          <h3>Dica mockada</h3>
          <p>{aiTip}</p>
        </div>
      </header>

      <main>
        <section className="card">
          <h2>Últimos relatos</h2>
          {loading ? (
            <p>Carregando relatos...</p>
          ) : stories.length === 0 ? (
            <p>Nenhum relato encontrado ainda.</p>
          ) : (
            <div className="stories-grid">
              {stories.map((story) => (
                <article key={story.id} className="story-item">
                  <div className="story-meta">
                    <span>{story.city}</span>
                    <span>{story.country}</span>
                  </div>
                  <h3>{story.title}</h3>
                  <p>{story.story}</p>
                  <div className="story-footer">
                    <span>Gasto: {story.cost}</span>
                    <span>Segurança: {story.safety}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
