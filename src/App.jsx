import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CardSearch } from './components/DeckBuilder/CardSearch';
import { DeckEditor } from './components/DeckBuilder/DeckEditor';
import { HandTester } from './components/Simulator/HandTester';
import { BatchSim } from './components/Simulator/BatchSim';
import { fetchCardDatabase, getCardById } from './services/ygoproapi';
import { generateYDK, parseYDK } from './utils/ydk';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Button } from './components/ui/Button';
import { CardDetailModal } from './components/CardDetailModal';
import { ComboBuilder } from './components/ComboBuilder/ComboBuilder';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-red-400 p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <div className="bg-slate-900 p-6 rounded-lg border border-red-500/20 max-w-2xl overflow-auto text-left w-full">
            <pre className="font-mono text-sm whitespace-pre-wrap break-words">
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('builder'); // builder, simulator, analysis

  // Card Detail Modal State
  const [viewingCard, setViewingCard] = useState(null);

  // Deck State
  const [deck, setDeck] = useState({
    main: [],
    extra: [],
    side: []
  });

  const [combos, setCombos] = useState([]);

  // Load API data on mount
  useEffect(() => {
    fetchCardDatabase().then(() => {
      setLoading(false);
    });

    // Hash routing listener
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'builder';
      setView(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Init

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleAddCard = (card) => {
    // Determine target deck based on type
    let target = 'main';
    const type = card.type.toLowerCase();
    if (type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link') || type.includes('token')) {
      target = 'extra';
    }

    // Add check for 3-card limit
    const allCards = [...deck.main, ...deck.extra, ...deck.side];
    const count = allCards.filter(c => c.name === card.name).length;
    if (count >= 3) {
      alert("You can only have 3 copies of a card!");
      return;
    }

    // Clone card with unique ID for analyzer logic (so duplicates are distinct objects)
    const cardWithUid = { ...card, uid: crypto.randomUUID() };

    setDeck(prev => ({
      ...prev,
      [target]: [...prev[target], cardWithUid]
    }));
  };

  const handleRemoveCard = (section, index) => {
    setDeck(prev => {
      const newSection = [...prev[section]];
      newSection.splice(index, 1);
      return { ...prev, [section]: newSection };
    });
  };

  const handleExportYDK = () => {
    const ydkIds = {
      main: deck.main.map(c => c.id),
      extra: deck.extra.map(c => c.id),
      side: deck.side.map(c => c.id)
    };
    const content = generateYDK(ydkIds);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deck.ydk';
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-blue-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-slate-400 animate-pulse">Summoning Card Database...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
        {view === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
            {/* Left: Card Search (4 cols) */}
            <div className="lg:col-span-4 h-full">
              <CardSearch onAddCard={handleAddCard} onView={setViewingCard} />
            </div>

            {/* Right: Deck Editor (8 cols) */}
            <div className="lg:col-span-8 h-full flex flex-col gap-4">
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleExportYDK}>
                  <Download className="w-4 h-4" /> Export YDK
                </Button>
                <Button variant="secondary" className="relative">
                  <Upload className="w-4 h-4" /> Import YDK
                  {/* Input hidden overlay for file upload ideally */}
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".ydk"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const text = await file.text();

                      try {
                        // Import logic
                        const parsed = parseYDK(text);

                        // Helper to map IDs to objects with unique UIDs
                        const mapIds = (ids) => {
                          return ids.map(id => {
                            const card = getCardById(id);
                            if (card) {
                              return { ...card, uid: crypto.randomUUID() };
                            }
                            return null;
                          }).filter(c => c);
                        };

                        setDeck({
                          main: mapIds(parsed.main),
                          extra: mapIds(parsed.extra),
                          side: mapIds(parsed.side)
                        });
                      } catch (err) {
                        console.error(err);
                        alert("Failed to parse deck file.");
                      }

                      // Reset input
                      e.target.value = '';
                    }}
                  />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <DeckEditor deck={deck} setDeck={setDeck} onRemoveCard={handleRemoveCard} onView={setViewingCard} />
              </div>
            </div>
          </div>
        )}

        {view === 'combos' && (
          <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
            <ComboBuilder
              combos={combos}
              setCombos={setCombos}
              onAddCard={handleAddCard}
              onView={setViewingCard}
              deck={deck}
            />
          </div>
        )}

        {view === 'simulator' && (
          <div className="max-w-4xl mx-auto">
            <HandTester deck={deck.main} combos={combos} onView={setViewingCard} />
          </div>
        )}

        {view === 'analysis' && (
          <div className="max-w-4xl mx-auto">
            <BatchSim deck={deck.main} combos={combos} />
          </div>
        )}

        {/* Global Card Detail Modal */}
        <CardDetailModal card={viewingCard} onClose={() => setViewingCard(null)} />
      </Layout>
    </ErrorBoundary>
  );
}


export default App;
