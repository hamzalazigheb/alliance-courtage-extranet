import React, { useState, useEffect } from 'react';
import { simulatorsAPI } from '../api';

// Simulateurs Page Component
function SimulateursPage() {
  const [activeSimulator, setActiveSimulator] = useState<string | null>(null);

  // Fonction pour logger l'accès à un simulateur (quand l'utilisateur ouvre le modal)
  const logSimulatorAccess = async (simulatorType: string) => {
    try {
      await simulatorsAPI.logUsage(simulatorType, null, 'Accès au simulateur');
    } catch (error) {
      // Ne pas afficher d'erreur à l'utilisateur, juste logger en console
      console.error('Erreur lors de l\'enregistrement de l\'accès:', error);
    }
  };

  // Handler pour ouvrir un simulateur et logger l'accès
  const handleOpenSimulator = (simulatorType: string) => {
    setActiveSimulator(simulatorType);
    logSimulatorAccess(simulatorType);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">SIMULATEURS</h1>
        <p className="text-gray-600 text-lg">
          Outils de simulation pour vos calculs fiscaux et financiers
        </p>
      </div>

      {/* Grid des 4 simulateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Simulateur d'Investissement */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Simulation d'Investissement</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Analysez la croissance de vos placements sur le long terme</p>
          <button 
            onClick={() => handleOpenSimulator('investment')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Lancer la simulation
          </button>
          </div>

        {/* 2. Simulateur Capitalisation Composée */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Capitalisation Composée</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Calculez la croissance de vos investissements avec intérêts composés</p>
          <button 
            onClick={() => handleOpenSimulator('capitalisation')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Lancer la simulation
          </button>
          </div>

        {/* 3. Simulateur Fiscal Patrimoine */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Simulateur Fiscal</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Calculez précisément vos impôts et optimisez votre stratégie fiscale</p>
          <button 
            onClick={() => handleOpenSimulator('fiscal')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Calculer mes impôts
          </button>
      </div>

        {/* 4. Comparaison Assurance-vie vs PER */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Comparaison AV vs PER</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Comparez l'assurance-vie et le PER pour optimiser votre retraite</p>
          <button 
            onClick={() => handleOpenSimulator('comparaison')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Lancer la comparaison
          </button>
          </div>
        </div>

      {/* Modals pour chaque simulateur */}
      {activeSimulator === 'investment' && (
        <InvestmentSimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'capitalisation' && (
        <CapitalisationSimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'fiscal' && (
        <FiscalSimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'comparaison' && (
        <ComparaisonSimulator onClose={() => setActiveSimulator(null)} />
      )}
      </div>
  );
}

// Simulateur d'Investissement - Nouveau design avec inputs
function InvestmentSimulator({ onClose }: { onClose: () => void }) {
  const [capitalInitial, setCapitalInitial] = useState(10000);
  const [versementMensuel, setVersementMensuel] = useState(500);
  const [rendementAnnuel, setRendementAnnuel] = useState(7);
  const [duree, setDuree] = useState(20);
  const [result, setResult] = useState<{capitalFinal: number, gains: number, totalVerse: number} | null>(null);
  const [showResult, setShowResult] = useState(false);

  const calculateInvestment = () => {
    const initial = capitalInitial;
    const mensuel = versementMensuel;
    const taux = rendementAnnuel / 100 / 12; // Taux mensuel
    const annees = duree;

    if ((initial <= 0 && mensuel <= 0) || annees <= 0) {
      setResult(null);
      return;
    }

    let capital = initial;
    const nbMois = annees * 12;

    // Calcul avec intérêts composés mensuels
    for (let mois = 0; mois < nbMois; mois++) {
      capital = capital * (1 + taux) + mensuel;
    }

    const capitalFinal = Math.round(capital);
    const totalVerse = initial + (mensuel * nbMois);
    const gains = capitalFinal - totalVerse;

    setResult({ capitalFinal, gains, totalVerse });
    setShowResult(true);
  };

  const resetSimulation = () => {
    setCapitalInitial(10000);
    setVersementMensuel(500);
    setRendementAnnuel(7);
    setDuree(20);
    setResult(null);
    setShowResult(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Simulation d'Investissement</h2>
              <p className="text-gray-600 text-sm mt-1">Analysez la croissance de vos placements sur le long terme</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        {!showResult ? (
          <>
            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Capital Initial */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3">CAPITAL INITIAL</label>
                <div className="relative">
                  <input
                    type="number"
                    value={capitalInitial}
                    onChange={(e) => setCapitalInitial(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-medium"
                    placeholder="10000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Montant de départ de votre investissement</p>
              </div>

              {/* Versement Mensuel */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3">VERSEMENT MENSUEL</label>
                <div className="relative">
                  <input
                    type="number"
                    value={versementMensuel}
                    onChange={(e) => setVersementMensuel(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-medium"
                    placeholder="500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Montant investi chaque mois</p>
              </div>

              {/* Rendement Annuel */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3">RENDEMENT ANNUEL</label>
                <div className="relative">
                  <input
                    type="number"
                    value={rendementAnnuel}
                    onChange={(e) => setRendementAnnuel(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-medium"
                    placeholder="7"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Taux de rendement annuel moyen</p>
              </div>

              {/* Durée d'Investissement */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3">DURÉE D'INVESTISSEMENT</label>
                <div className="relative">
                  <input
                    type="number"
                    value={duree}
                    onChange={(e) => setDuree(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 pr-16 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-medium"
                    placeholder="20"
                    min="1"
                    max="100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">ans</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Période de placement en années</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={calculateInvestment}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Lancer la simulation
              </button>
              <button
                onClick={resetSimulation}
                className="px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Résultats */}
            <div className="space-y-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-600 mb-2">Capital final estimé</div>
                  <div className="text-5xl font-bold text-blue-700">{result?.capitalFinal.toLocaleString('fr-FR')} €</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Total versé</div>
                    <div className="text-xl font-bold text-gray-800">{result?.totalVerse.toLocaleString('fr-FR')} €</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Gains générés</div>
                    <div className="text-xl font-bold text-green-600">+ {result?.gains.toLocaleString('fr-FR')} €</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Rendement</div>
                    <div className="text-xl font-bold text-blue-600">
                      {result ? ((result.gains / result.totalVerse) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4">Détails de la simulation</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capital initial:</span>
                    <span className="font-medium">{capitalInitial.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versement mensuel:</span>
                    <span className="font-medium">{versementMensuel.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rendement annuel:</span>
                    <span className="font-medium">{rendementAnnuel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durée:</span>
                    <span className="font-medium">{duree} ans ({duree * 12} mois)</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-800">Total des versements:</span>
                    <span className="font-bold text-gray-900">{(capitalInitial + versementMensuel * duree * 12).toLocaleString('fr-FR')} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowResult(false)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Nouvelle simulation
              </button>
              <button
                onClick={resetSimulation}
                className="px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Simulateur IR - Conservé pour référence (non utilisé)
function IRSimulator({ onClose }: { onClose: () => void }) {
  const [revenuNet, setRevenuNet] = useState(50000);
  const [situation, setSituation] = useState('celibataire');
  const [nbEnfants, setNbEnfants] = useState(0);
  const [result, setResult] = useState<{impot: number, taux: number, tranches: any[], revenuApresImpot: number} | null>(null);

  useEffect(() => {
    const calculateIR = () => {
      const revenu = revenuNet;
      if (revenu <= 0) {
        setResult(null);
        return;
      }

      // Calcul du nombre de parts fiscales
      let parts = 1;
      if (situation === 'marie') {
        parts = 2;
      } else if (situation === 'pacse') {
        parts = 2;
      }
      
      parts += nbEnfants * 0.5;
      if (situation === 'marie' && nbEnfants > 2) {
        parts += (nbEnfants - 2) * 0.5;
      }

      const revenuImposable = revenu / parts;

      // Barème 2024 (pour déclaration 2025)
      const tranches: any[] = [];
      let impot = 0;
      
      if (revenuImposable > 11088) {
        const tranche1 = Math.min(revenuImposable, 28288) - 11088;
        const impot1 = tranche1 * 0.11;
        impot += impot1;
        tranches.push({ montant: tranche1, taux: 11, impot: impot1, limite: 28288 });
      }
      if (revenuImposable > 28288) {
        const tranche2 = Math.min(revenuImposable, 80624) - 28288;
        const impot2 = tranche2 * 0.30;
        impot += impot2;
        tranches.push({ montant: tranche2, taux: 30, impot: impot2, limite: 80624 });
      }
      if (revenuImposable > 80624) {
        const tranche3 = Math.min(revenuImposable, 173041) - 80624;
        const impot3 = tranche3 * 0.41;
        impot += impot3;
        tranches.push({ montant: tranche3, taux: 41, impot: impot3, limite: 173041 });
      }
      if (revenuImposable > 173041) {
        const tranche4 = revenuImposable - 173041;
        const impot4 = tranche4 * 0.45;
        impot += impot4;
        tranches.push({ montant: tranche4, taux: 45, impot: impot4, limite: Infinity });
      }

      const impotTotal = impot * parts;
      const taux = (impotTotal / revenu) * 100;
      const revenuApresImpot = revenu - impotTotal;

      setResult({ 
        impot: Math.round(impotTotal), 
        taux: Math.round(taux * 10) / 10,
        tranches,
        revenuApresImpot: Math.round(revenuApresImpot)
      });
    };

    calculateIR();
  }, [revenuNet, situation, nbEnfants]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Simulateur Impôt sur le Revenu</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Revenu net imposable</label>
                <span className="text-lg font-bold text-blue-600">{revenuNet.toLocaleString('fr-FR')} €</span>
            </div>
              <input
                type="range"
                min="0"
                max="200000"
                step="1000"
                value={revenuNet}
                onChange={(e) => setRevenuNet(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>200 000 €</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Situation familiale</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSituation('celibataire')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                    situation === 'celibataire'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Célibataire
                </button>
                <button
                  onClick={() => setSituation('marie')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                    situation === 'marie'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Marié(e)
                </button>
                <button
                  onClick={() => setSituation('pacse')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                    situation === 'pacse'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pacsé(e)
            </button>
              </div>
          </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Nombre d'enfants</label>
                <span className="text-lg font-bold text-blue-600">{nbEnfants}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={nbEnfants}
                onChange={(e) => setNbEnfants(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>5</span>
            </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-1">Impôt à payer</div>
                    <div className="text-4xl font-bold text-blue-700">{result.impot.toLocaleString('fr-FR')} €</div>
              </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenu annuel</span>
                      <span className="font-medium">{revenuNet.toLocaleString('fr-FR')} €</span>
            </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taux moyen</span>
                      <span className="font-medium">{result.taux}%</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-blue-200">
                      <span>Revenu après impôt</span>
                      <span className="text-green-600">{result.revenuApresImpot.toLocaleString('fr-FR')} €</span>
          </div>
        </div>
      </div>

                {result.tranches.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Répartition par tranche</h4>
                    <div className="space-y-2">
                      {result.tranches.map((t, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between mb-1">
                            <span>Tranche {t.taux}%</span>
                            <span className="font-medium">{Math.round(t.impot).toLocaleString('fr-FR')} €</span>
              </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${(t.impot / result.impot) * 100}%` }}
                            ></div>
            </div>
          </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                Ajustez les paramètres pour voir le calcul
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulateur Capitalisation Composée - Avec onglets
function CapitalisationSimulator({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'capitalisation' | 'amortissement' | 'roi'>('capitalisation');
  const [montantInitial, setMontantInitial] = useState(10000);
  const [tauxAnnuel, setTauxAnnuel] = useState(3);
  const [duree, setDuree] = useState(5);
  const [capitalisation, setCapitalisation] = useState('mensuelle');
  const [versementPeriodique, setVersementPeriodique] = useState(0);
  const [result, setResult] = useState<{
    montantFinal: number;
    interetsGeneres: number;
    capitalInitial: number;
    versementsTotaux: number;
    cagr: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);

  // États pour Amortissement de prêt
  const [montantPret, setMontantPret] = useState(200000);
  const [tauxPret, setTauxPret] = useState(3.5);
  const [dureePret, setDureePret] = useState(20);
  const [amortissementResult, setAmortissementResult] = useState<{
    mensualite: number;
    coutTotal: number;
    interetsTotaux: number;
    tableau: Array<{
      mois: number;
      mensualite: number;
      capital: number;
      interets: number;
      capitalRestant: number;
    }>;
  } | null>(null);

  // États pour Analyse ROI
  const [investissementInitial, setInvestissementInitial] = useState(50000);
  const [revenusAnnuels, setRevenusAnnuels] = useState(8000);
  const [chargesAnnuelles, setChargesAnnuelles] = useState(2000);
  const [dureeROI, setDureeROI] = useState(10);
  const [valorisationFinale, setValorisationFinale] = useState(60000);
  const [roiResult, setRoiResult] = useState<{
    roi: number;
    roiAnnualise: number;
    cashflowTotal: number;
    plusValue: number;
    rendementNet: number;
    delaiRecuperation: number;
  } | null>(null);

  // Calcul Amortissement de prêt
  const calculateAmortissement = () => {
    const P = montantPret;
    const r = tauxPret / 100 / 12; // Taux mensuel
    const n = dureePret * 12; // Nombre de mensualités

    // Formule mensualité: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const mensualite = r > 0 
      ? P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      : P / n;

    const coutTotal = mensualite * n;
    const interetsTotaux = coutTotal - P;

    // Génération du tableau d'amortissement (premières et dernières lignes)
    const tableau: Array<{
      mois: number;
      mensualite: number;
      capital: number;
      interets: number;
      capitalRestant: number;
    }> = [];

    let capitalRestant = P;
    for (let i = 1; i <= n; i++) {
      const interetsMois = capitalRestant * r;
      const capitalMois = mensualite - interetsMois;
      capitalRestant = capitalRestant - capitalMois;

      // Garder uniquement les 12 premiers mois et les 12 derniers
      if (i <= 12 || i > n - 12) {
        tableau.push({
          mois: i,
          mensualite: Math.round(mensualite * 100) / 100,
          capital: Math.round(capitalMois * 100) / 100,
          interets: Math.round(interetsMois * 100) / 100,
          capitalRestant: Math.max(0, Math.round(capitalRestant * 100) / 100)
        });
      }
    }

    setAmortissementResult({
      mensualite: Math.round(mensualite * 100) / 100,
      coutTotal: Math.round(coutTotal),
      interetsTotaux: Math.round(interetsTotaux),
      tableau
    });
  };

  // Calcul Analyse ROI
  const calculateROI = () => {
    const cashflowAnnuel = revenusAnnuels - chargesAnnuelles;
    const cashflowTotal = cashflowAnnuel * dureeROI;
    const plusValue = valorisationFinale - investissementInitial;
    const gainTotal = cashflowTotal + plusValue;
    
    const roi = (gainTotal / investissementInitial) * 100;
    const roiAnnualise = Math.pow(1 + roi / 100, 1 / dureeROI) * 100 - 100;
    const rendementNet = (cashflowAnnuel / investissementInitial) * 100;
    
    // Délai de récupération (en années)
    const delaiRecuperation = cashflowAnnuel > 0 ? investissementInitial / cashflowAnnuel : 0;

    setRoiResult({
      roi: Math.round(roi * 10) / 10,
      roiAnnualise: Math.round(roiAnnualise * 10) / 10,
      cashflowTotal: Math.round(cashflowTotal),
      plusValue: Math.round(plusValue),
      rendementNet: Math.round(rendementNet * 10) / 10,
      delaiRecuperation: Math.round(delaiRecuperation * 10) / 10
    });
  };

  const calculateCapitalisation = () => {
    const PV = montantInitial;
    const r = tauxAnnuel / 100;
    const n = duree;
    const PMT = versementPeriodique;
    
    // Fréquence de capitalisation
    let freq = 12; // mensuelle par défaut
    if (capitalisation === 'trimestrielle') freq = 4;
    else if (capitalisation === 'semestrielle') freq = 2;
    else if (capitalisation === 'annuelle') freq = 1;
    
    const ratePerPeriod = r / freq;
    const numPeriods = n * freq;
    
    // Formule: VF = VP x (1+r)^n + PMT x [(1+r)^n-1] / r
    const futureValue = PV * Math.pow(1 + ratePerPeriod, numPeriods) + 
                       (PMT > 0 ? PMT * ((Math.pow(1 + ratePerPeriod, numPeriods) - 1) / ratePerPeriod) : 0);
    
    const montantFinal = Math.round(futureValue);
    const versementsTotaux = PV + (PMT * numPeriods);
    const interetsGeneres = montantFinal - versementsTotaux;
    const cagr = versementsTotaux > 0 ? ((montantFinal / versementsTotaux) ** (1 / n) - 1) * 100 : 0;
    
    setResult({
      montantFinal,
      interetsGeneres,
      capitalInitial: PV,
      versementsTotaux,
      cagr: Math.round(cagr * 10) / 10
    });
    setShowResult(true);
  };

  const resetSimulation = () => {
    setMontantInitial(10000);
    setTauxAnnuel(3);
    setDuree(5);
    setCapitalisation('mensuelle');
    setVersementPeriodique(0);
    setResult(null);
    setShowResult(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Simulateur Financier</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        {/* Onglets */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('capitalisation')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'capitalisation'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Capitalisation composée
          </button>
          <button
            onClick={() => setActiveTab('amortissement')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'amortissement'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Amortissement de prêt
          </button>
          <button
            onClick={() => setActiveTab('roi')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'roi'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Analyse ROI
          </button>
        </div>

        {activeTab === 'capitalisation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paramètres */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Paramètres</h3>
              <div className="space-y-6">
                {/* Montant initial */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Montant initial</label>
                  <input
                    type="number"
                    value={montantInitial}
                    onChange={(e) => setMontantInitial(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="10000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Capital de départ pour votre investissement</p>
                </div>

                {/* Taux annuel */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Taux annuel (%)</label>
                  <input
                    type="number"
                    value={tauxAnnuel}
                    onChange={(e) => setTauxAnnuel(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="3"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rendement annuel de votre placement</p>
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Durée (années)</label>
                  <input
                    type="number"
                    value={duree}
                    onChange={(e) => setDuree(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="5"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Horizon de placement en années</p>
                </div>

                {/* Capitalisation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Capitalisation</label>
                  <select
                    value={capitalisation}
                    onChange={(e) => setCapitalisation(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg bg-white"
                  >
                    <option value="mensuelle">Mensuelle</option>
                    <option value="trimestrielle">Trimestrielle</option>
                    <option value="semestrielle">Semestrielle</option>
                    <option value="annuelle">Annuelle</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Périodicité des intérêts composés</p>
                </div>

                {/* Versement périodique */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Versement périodique</label>
                  <input
                    type="number"
                    value={versementPeriodique}
                    onChange={(e) => setVersementPeriodique(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Apport régulier à votre investissement</p>
                </div>

                {/* Boutons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={resetSimulation}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={calculateCapitalisation}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Calculer mes résultats
                  </button>
                </div>
              </div>
            </div>

            {/* Résultats */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Résultats</h3>
              {showResult && result ? (
                <div className="space-y-4">
                  {/* Cartes principales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-xs font-semibold text-gray-600 mb-2">MONTANT FINAL</div>
                      <div className="text-2xl font-bold text-gray-800">{result.montantFinal.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="text-xs font-semibold text-gray-600 mb-2">INTÉRÊTS GÉNÉRÉS</div>
                      <div className="text-2xl font-bold text-green-600">{result.interetsGeneres.toLocaleString('fr-FR')} €</div>
                    </div>
                  </div>

                  {/* Cartes détails */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">CAPITAL INITIAL</div>
                      <div className="text-lg font-bold text-gray-800">{result.capitalInitial.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">VERSEMENTS TOTAUX</div>
                      <div className="text-lg font-bold text-gray-800">{result.versementsTotaux.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">CAGR</div>
                      <div className="text-lg font-bold text-gray-800">{result.cagr}%</div>
                    </div>
                  </div>

                  {/* Formule */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600">
                      La capitalisation composée utilise la formule : VF = VP x (1+r)^n + PMT x [(1+r)^n-1] / r
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">***</div>
                  <p className="text-sm">Remplissez les paramètres et cliquez sur "Calculer mes résultats"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'amortissement' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paramètres */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Paramètres du prêt</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Montant emprunté (€)</label>
                  <input
                    type="number"
                    value={montantPret}
                    onChange={(e) => setMontantPret(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="200000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Taux annuel (%)</label>
                  <input
                    type="number"
                    value={tauxPret}
                    onChange={(e) => setTauxPret(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="3.5"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Durée (années)</label>
                  <input
                    type="number"
                    value={dureePret}
                    onChange={(e) => setDureePret(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="20"
                    min="1"
                    max="30"
                  />
                </div>
                <button
                  onClick={calculateAmortissement}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Calculer l'amortissement
                </button>
              </div>
            </div>

            {/* Résultats */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Résultats</h3>
              {amortissementResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-purple-600 mb-1">MENSUALITÉ</div>
                      <div className="text-2xl font-bold text-purple-800">{amortissementResult.mensualite.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-600 mb-1">COÛT TOTAL</div>
                        <div className="text-lg font-bold text-gray-800">{amortissementResult.coutTotal.toLocaleString('fr-FR')} €</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-600 mb-1">INTÉRÊTS TOTAUX</div>
                        <div className="text-lg font-bold text-red-600">{amortissementResult.interetsTotaux.toLocaleString('fr-FR')} €</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tableau d'amortissement */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <span className="text-sm font-semibold text-gray-700">Tableau d'amortissement</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mois</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Mensualité</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Capital</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Intérêts</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Restant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {amortissementResult.tableau.map((row, index) => (
                            <tr key={index} className={index >= 12 && amortissementResult.tableau[index - 1]?.mois !== row.mois - 1 ? 'border-t-4 border-gray-300' : ''}>
                              <td className="px-3 py-2 text-gray-600">{row.mois}</td>
                              <td className="px-3 py-2 text-right text-gray-800">{row.mensualite.toLocaleString('fr-FR')} €</td>
                              <td className="px-3 py-2 text-right text-green-600">{row.capital.toLocaleString('fr-FR')} €</td>
                              <td className="px-3 py-2 text-right text-red-600">{row.interets.toLocaleString('fr-FR')} €</td>
                              <td className="px-3 py-2 text-right text-gray-800">{row.capitalRestant.toLocaleString('fr-FR')} €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-500 text-center">
                      Affichage des 12 premiers et 12 derniers mois
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🏠</div>
                  <p className="text-sm">Entrez les paramètres du prêt et cliquez sur "Calculer l'amortissement"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'roi' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paramètres */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Paramètres de l'investissement</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Investissement initial (€)</label>
                  <input
                    type="number"
                    value={investissementInitial}
                    onChange={(e) => setInvestissementInitial(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="50000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Capital investi au départ</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Revenus annuels (€)</label>
                  <input
                    type="number"
                    value={revenusAnnuels}
                    onChange={(e) => setRevenusAnnuels(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="8000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Loyers, dividendes, etc.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Charges annuelles (€)</label>
                  <input
                    type="number"
                    value={chargesAnnuelles}
                    onChange={(e) => setChargesAnnuelles(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="2000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Taxes, entretien, frais...</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Durée de détention (années)</label>
                  <input
                    type="number"
                    value={dureeROI}
                    onChange={(e) => setDureeROI(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="10"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Valorisation finale (€)</label>
                  <input
                    type="number"
                    value={valorisationFinale}
                    onChange={(e) => setValorisationFinale(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    placeholder="60000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Valeur estimée à la revente</p>
                </div>
                <button
                  onClick={calculateROI}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Calculer le ROI
                </button>
              </div>
            </div>

            {/* Résultats */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Résultats</h3>
              {roiResult ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
                    <div className="text-sm font-medium opacity-80 mb-1">RETOUR SUR INVESTISSEMENT (ROI)</div>
                    <div className="text-4xl font-bold">{roiResult.roi}%</div>
                    <div className="text-sm opacity-80 mt-2">soit {roiResult.roiAnnualise}% annualisé</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">CASHFLOW TOTAL</div>
                      <div className="text-lg font-bold text-green-600">+{roiResult.cashflowTotal.toLocaleString('fr-FR')} €</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">PLUS-VALUE</div>
                      <div className={`text-lg font-bold ${roiResult.plusValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roiResult.plusValue >= 0 ? '+' : ''}{roiResult.plusValue.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">RENDEMENT NET</div>
                      <div className="text-lg font-bold text-gray-800">{roiResult.rendementNet}%/an</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">DÉLAI RÉCUPÉRATION</div>
                      <div className="text-lg font-bold text-gray-800">{roiResult.delaiRecuperation} ans</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600">
                      <strong>ROI</strong> = (Gain total / Investissement initial) × 100<br />
                      <strong>Gain total</strong> = Cashflow total + Plus-value
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-sm">Entrez les paramètres et cliquez sur "Calculer le ROI"</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simulateur Fiscal Patrimoine - Avec onglets et calculs complets
function FiscalSimulator({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'revenus' | 'charges' | 'famille' | 'patrimoine'>('revenus');
  
  // Revenus
  const [salaires, setSalaires] = useState('');
  const [pensions, setPensions] = useState('');
  const [revenusFonciers, setRevenusFonciers] = useState('');
  const [revenusCapitaux, setRevenusCapitaux] = useState('');
  
  // Charges & Réductions
  const [fraisReels, setFraisReels] = useState('');
  const [pensionsAlimentaires, setPensionsAlimentaires] = useState('');
  const [donsOrganismes, setDonsOrganismes] = useState('');
  const [emploiDomicile, setEmploiDomicile] = useState('');
  const [gardeEnfants, setGardeEnfants] = useState('');
  const [investissementPME, setInvestissementPME] = useState('');
  const [perp, setPerp] = useState('');
  
  // Famille
  const [situation, setSituation] = useState('celibataire');
  const [nbEnfants, setNbEnfants] = useState(0);
  
  // Patrimoine
  const [patrimoineImmobilier, setPatrimoineImmobilier] = useState('');
  const [dettesImmobilieres, setDettesImmobilieres] = useState('');
  
  // Résultats
  const [result, setResult] = useState<{
    revenuBrutGlobal: number;
    partsFiscales: number;
    quotientFamilial: number;
    impotIR: number;
    totalImpot: number;
    tauxEffectif: number;
    patrimoineNet: number;
    impotIFI: number;
    tranches: Array<{montant: number, taux: number, impot: number}>;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const calculateFiscal = () => {
    // Calcul des revenus
    const salairesValue = parseFloat(salaires) || 0;
    const pensionsValue = parseFloat(pensions) || 0;
    const fonciersValue = parseFloat(revenusFonciers) || 0;
    const capitauxValue = parseFloat(revenusCapitaux) || 0;
    
    const revenuBrutGlobal = salairesValue + pensionsValue + fonciersValue + capitauxValue;
    
    // Calcul des parts fiscales
    let parts = 1;
    if (situation === 'marie' || situation === 'pacse') {
      parts = 2;
    }
    parts += nbEnfants * 0.5;
    if ((situation === 'marie' || situation === 'pacse') && nbEnfants > 2) {
      parts += (nbEnfants - 2) * 0.5;
    }
    
    const quotientFamilial = revenuBrutGlobal / parts;
    
    // Barème 2025
    const tranches: Array<{montant: number, taux: number, impot: number}> = [];
    let impot = 0;
    
    if (quotientFamilial > 11498) {
      const tranche1 = Math.min(quotientFamilial, 29315) - 11498;
      const impot1 = tranche1 * 0.11;
      impot += impot1;
      tranches.push({ montant: tranche1, taux: 11, impot: impot1 });
    }
    if (quotientFamilial > 29315) {
      const tranche2 = Math.min(quotientFamilial, 83823) - 29315;
      const impot2 = tranche2 * 0.30;
      impot += impot2;
      tranches.push({ montant: tranche2, taux: 30, impot: impot2 });
    }
    if (quotientFamilial > 83823) {
      const tranche3 = Math.min(quotientFamilial, 180294) - 83823;
      const impot3 = tranche3 * 0.41;
      impot += impot3;
      tranches.push({ montant: tranche3, taux: 41, impot: impot3 });
    }
    if (quotientFamilial > 180294) {
      const tranche4 = quotientFamilial - 180294;
      const impot4 = tranche4 * 0.45;
      impot += impot4;
      tranches.push({ montant: tranche4, taux: 45, impot: impot4 });
    }
    
    const impotIR = Math.round(impot * parts);
    const tauxEffectif = revenuBrutGlobal > 0 ? (impotIR / revenuBrutGlobal) * 100 : 0;
    
    // Calcul IFI
    const patrimoineValue = parseFloat(patrimoineImmobilier) || 0;
    const dettesValue = parseFloat(dettesImmobilieres) || 0;
    const patrimoineNet = patrimoineValue - dettesValue;
    const baseIFI = Math.max(0, patrimoineNet - 1300000);
    let impotIFI = 0;
    if (baseIFI > 800000) {
      impotIFI = Math.round((baseIFI - 800000) * 0.007);
    }
    
    setResult({
      revenuBrutGlobal: Math.round(revenuBrutGlobal),
      partsFiscales: parts,
      quotientFamilial: Math.round(quotientFamilial),
      impotIR,
      totalImpot: impotIR + impotIFI,
      tauxEffectif: Math.round(tauxEffectif * 10) / 10,
      patrimoineNet: Math.round(patrimoineNet),
      impotIFI,
      tranches
    });
    setShowResult(true);
  };

  const resetSimulation = () => {
    setSalaires('');
    setPensions('');
    setRevenusFonciers('');
    setRevenusCapitaux('');
    setSituation('celibataire');
    setNbEnfants(0);
    setPatrimoineImmobilier('');
    setDettesImmobilieres('');
    setResult(null);
    setShowResult(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Simulateur Fiscal Patrimoine</h2>
            <p className="text-sm text-gray-600 mt-1">Calculez précisément vos impôts et optimisez votre stratégie fiscale</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche - Inputs */}
          <div>
            {/* Onglets */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('revenus')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'revenus'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Revenus
              </button>
              <button
                onClick={() => setActiveTab('charges')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'charges'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Charges & Réductions
              </button>
              <button
                onClick={() => setActiveTab('famille')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'famille'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Famille
              </button>
              <button
                onClick={() => setActiveTab('patrimoine')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'patrimoine'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Patrimoine
              </button>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'revenus' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Salaires</label>
                  <label className="block text-xs text-gray-500 mb-1">Montant brut annuel (€)</label>
                  <input
                    type="number"
                    value={salaires}
                    onChange={(e) => setSalaires(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Ex: 45000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pensions</label>
                  <label className="block text-xs text-gray-500 mb-1">Montant annuel (€)</label>
                  <input
                    type="number"
                    value={pensions}
                    onChange={(e) => setPensions(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Ex: 25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Revenus fonciers</label>
                  <label className="block text-xs text-gray-500 mb-1">Loyers perçus (€)</label>
                  <input
                    type="number"
                    value={revenusFonciers}
                    onChange={(e) => setRevenusFonciers(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Ex: 12000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Revenus de capitaux mobiliers</label>
                  <label className="block text-xs text-gray-500 mb-1">Montant annuel (€)</label>
                  <input
                    type="number"
                    value={revenusCapitaux}
                    onChange={(e) => setRevenusCapitaux(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Ex: 5000"
                  />
                </div>
              </div>
            )}

            {activeTab === 'charges' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 Les charges déductibles réduisent votre revenu imposable. Les réductions d'impôt s'appliquent directement sur l'impôt dû.
                  </p>
                </div>
                
                <h4 className="font-semibold text-gray-700 border-b pb-2">Charges déductibles</h4>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frais réels professionnels (€)</label>
                  <input
                    type="number"
                    value={fraisReels}
                    onChange={(e) => setFraisReels(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">À la place de l'abattement de 10%</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pensions alimentaires versées (€)</label>
                  <input
                    type="number"
                    value={pensionsAlimentaires}
                    onChange={(e) => setPensionsAlimentaires(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Épargne retraite PERP/PER (€)</label>
                  <input
                    type="number"
                    value={perp}
                    onChange={(e) => setPerp(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Plafond : 10% du revenu imposable (max 35 194 €)</p>
                </div>
                
                <h4 className="font-semibold text-gray-700 border-b pb-2 mt-6">Réductions & Crédits d'impôt</h4>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dons aux organismes d'intérêt général (€)</label>
                  <input
                    type="number"
                    value={donsOrganismes}
                    onChange={(e) => setDonsOrganismes(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Réduction de 66% (75% pour aide aux personnes en difficulté)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Emploi à domicile (€)</label>
                  <input
                    type="number"
                    value={emploiDomicile}
                    onChange={(e) => setEmploiDomicile(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Crédit d'impôt de 50% (plafond 12 000 €)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frais de garde d'enfants -6 ans (€)</label>
                  <input
                    type="number"
                    value={gardeEnfants}
                    onChange={(e) => setGardeEnfants(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Crédit d'impôt de 50% (plafond 3 500 € par enfant)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Investissement PME (€)</label>
                  <input
                    type="number"
                    value={investissementPME}
                    onChange={(e) => setInvestissementPME(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Réduction de 18% (25% pour ESUS)</p>
                </div>

                {/* Récapitulatif des avantages fiscaux */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h5 className="font-semibold text-green-800 mb-2">📊 Estimation des avantages fiscaux</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Charges déductibles :</span>
                      <span className="font-medium text-gray-800">
                        {((parseFloat(fraisReels) || 0) + (parseFloat(pensionsAlimentaires) || 0) + (parseFloat(perp) || 0)).toLocaleString('fr-FR')} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Réductions d'impôt estimées :</span>
                      <span className="font-medium text-green-600">
                        -{(
                          (parseFloat(donsOrganismes) || 0) * 0.66 +
                          Math.min((parseFloat(emploiDomicile) || 0), 12000) * 0.5 +
                          Math.min((parseFloat(gardeEnfants) || 0), 3500) * 0.5 +
                          (parseFloat(investissementPME) || 0) * 0.18
                        ).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'famille' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Situation familiale</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSituation('celibataire')}
                      className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                        situation === 'celibataire'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Célibataire
                    </button>
                    <button
                      onClick={() => setSituation('marie')}
                      className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                        situation === 'marie'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Marié(e)
                    </button>
                    <button
                      onClick={() => setSituation('pacse')}
                      className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                        situation === 'pacse'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Pacsé(e)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre d'enfants</label>
                  <input
                    type="number"
                    value={nbEnfants}
                    onChange={(e) => setNbEnfants(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
            )}

            {activeTab === 'patrimoine' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Patrimoine immobilier</label>
                  <input
                    type="number"
                    value={patrimoineImmobilier}
                    onChange={(e) => setPatrimoineImmobilier(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Valeur totale (€)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dettes immobilières</label>
                  <input
                    type="number"
                    value={dettesImmobilieres}
                    onChange={(e) => setDettesImmobilieres(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Montant total (€)"
                  />
                </div>
              </div>
            )}

            {/* Bouton Calculer */}
            <button
              onClick={calculateFiscal}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              Calculer mes impôts
            </button>
          </div>

          {/* Colonne droite - Résultats */}
          <div className="space-y-4">
            {/* Barème 2025 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Barème 2025</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Jusqu'à 11 498€</span>
                  <span className="font-medium">0%</span>
                </div>
                <div className="flex justify-between">
                  <span>De 11 498€ à 29 315€</span>
                  <span className="font-medium">11%</span>
                </div>
                <div className="flex justify-between">
                  <span>De 29 316€ à 83 823€</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="flex justify-between">
                  <span>De 83 824€ à 180 294€</span>
                  <span className="font-medium">41%</span>
                </div>
                <div className="flex justify-between">
                  <span>Plus de 180 295€</span>
                  <span className="font-medium">45%</span>
                </div>
              </div>
            </div>

            {/* Résultats Fiscaux */}
            {showResult && result ? (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-amber-600 rounded-lg p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">Résultats Fiscaux 2025</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Revenu brut global</span>
                      <span className="font-semibold">{result.revenuBrutGlobal.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parts fiscales</span>
                      <span className="font-semibold">{result.partsFiscales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quotient familial</span>
                      <span className="font-semibold">{result.quotientFamilial.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impôt IR</span>
                      <span className="font-semibold">{result.impotIR.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total impôts</span>
                      <span className="font-semibold">{result.totalImpot.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="pt-2 border-t border-white/30 mt-2">
                      <div className="flex justify-between">
                        <span>{Math.round(result.totalImpot / 12).toLocaleString('fr-FR')}€/mois</span>
                        <span>Taux effectif: {result.tauxEffectif}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Résultats IFI */}
                {result.patrimoineNet > 0 && (
                  <div className="bg-gradient-to-r from-blue-600 to-amber-600 rounded-lg p-6 text-white">
                    <h3 className="font-bold text-lg mb-4">Résultats IFI 2025</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Patrimoine immobilier net</span>
                        <span className="font-semibold">{result.patrimoineNet.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Impôt IFI</span>
                        <span className="font-semibold">{result.impotIFI.toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Position dans le barème */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Votre position dans le barème progressif</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Jusqu'à 11 498€", taux: 0, limite: 11498 },
                      { label: "De 11 498€ à 29 315€", taux: 11, limite: 29315 },
                      { label: "De 29 316€ à 83 823€", taux: 30, limite: 83823 },
                      { label: "De 83 824€ à 180 294€", taux: 41, limite: 180294 },
                      { label: "Plus de 180 295€", taux: 45, limite: Infinity }
                    ].map((tranche, idx) => {
                      const trancheResult = result.tranches.find(t => t.taux === tranche.taux);
                      const montantDansTranche = trancheResult?.montant || 0;
                      const pourcentage = result.quotientFamilial > 0 ? (montantDansTranche / result.quotientFamilial) * 100 : 0;
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{tranche.label}</span>
                            <span className="font-medium">{tranche.taux}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(pourcentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-amber-600 rounded-lg p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">Résultats Fiscaux 2025</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Revenu brut global</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parts fiscales</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quotient familial</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impôt IR</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total impôts</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="pt-2 border-t border-white/30 mt-2">
                      <div className="flex justify-between">
                        <span>***€/mois</span>
                        <span>Taux effectif: ***%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-amber-600 rounded-lg p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">Résultats IFI 2025</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Patrimoine immobilier net</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impôt IFI</span>
                      <span className="font-semibold">***</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulateur Succession - Conservé pour référence (non utilisé)
function SuccessionSimulator({ onClose }: { onClose: () => void }) {
  const [patrimoine, setPatrimoine] = useState(500000);
  const [lien, setLien] = useState('enfants');
  const [result, setResult] = useState<{droits: number, net: number, abattement: number, taux: number} | null>(null);

  useEffect(() => {
    const calculateSuccession = () => {
      const patrimoineValue = patrimoine;
      if (patrimoineValue <= 0) {
        setResult(null);
        return;
      }

      // Abattements selon le lien de parenté (2024)
      let abattement = 0;
      if (lien === 'enfants') {
        abattement = 100000; // 100k€ par enfant
      } else if (lien === 'conjoint') {
        abattement = 80724; // Abattement conjoint survivant
      } else if (lien === 'parents') {
        abattement = 15858;
      } else {
        abattement = 7967; // Frères/sœurs
      }

      const baseImposable = Math.max(0, patrimoineValue - abattement);

      // Taux selon le lien
      let taux = 0;
      if (lien === 'enfants') {
        if (baseImposable <= 8081) taux = 0.05;
        else if (baseImposable <= 12109) taux = 0.10;
        else if (baseImposable <= 15932) taux = 0.15;
        else if (baseImposable <= 552324) taux = 0.20;
        else if (baseImposable <= 902838) taux = 0.30;
        else if (baseImposable <= 1805677) taux = 0.40;
        else taux = 0.45;
      } else if (lien === 'conjoint') {
        taux = 0; // Pas de droits entre époux
      } else if (lien === 'parents') {
        if (baseImposable <= 8072) taux = 0.35;
        else taux = 0.45;
      } else {
        if (baseImposable <= 24331) taux = 0.35;
        else taux = 0.45;
      }

      const droits = baseImposable * taux;
      const net = patrimoineValue - droits;

      setResult({ 
        droits: Math.round(droits), 
        net: Math.round(net),
        abattement,
        taux: taux * 100
      });
    };

    calculateSuccession();
  }, [patrimoine, lien]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Diagnostic Succession</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Valeur du patrimoine transmis</label>
                <span className="text-lg font-bold text-green-600">{patrimoine.toLocaleString('fr-FR')} €</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000000"
                step="10000"
                value={patrimoine}
                onChange={(e) => setPatrimoine(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>5 M€</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lien avec le bénéficiaire</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLien('conjoint')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    lien === 'conjoint'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Conjoint
                </button>
                <button
                  onClick={() => setLien('enfants')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    lien === 'enfants'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Enfants
                </button>
                <button
                  onClick={() => setLien('parents')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    lien === 'parents'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Parents
                </button>
                <button
                  onClick={() => setLien('autres')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    lien === 'autres'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Autres
            </button>
          </div>
        </div>

            {result && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-gray-700">
                  <div className="flex justify-between mb-1">
                    <span>Abattement:</span>
                    <span className="font-semibold">{result.abattement.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Base imposable:</span>
                    <span className="font-semibold">
                      {Math.max(0, patrimoine - result.abattement).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span>Taux appliqué:</span>
                    <span className="font-bold text-green-700">{result.taux}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-1">Droits de succession</div>
                    <div className="text-4xl font-bold text-green-700">{result.droits.toLocaleString('fr-FR')} €</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Patrimoine transmis</span>
                      <span className="font-medium">{patrimoine.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Droits de succession</span>
                      <span className="font-medium text-red-600">- {result.droits.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-green-200">
                      <span>Patrimoine net reçu</span>
                      <span className="text-green-600 text-lg">{result.net.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </div>

                {result.droits > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Répartition</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Droits à payer</span>
                          <span className="font-medium">{result.droits.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full transition-all"
                            style={{ width: `${(result.droits / patrimoine) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Patrimoine net</span>
                          <span className="font-medium">{result.net.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all"
                            style={{ width: `${(result.net / patrimoine) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                Ajustez les paramètres pour voir le calcul
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Comparaison Assurance-vie vs PER
function ComparaisonSimulator({ onClose }: { onClose: () => void }) {
  // Informations personnelles
  const [ageActuel, setAgeActuel] = useState('');
  const [ageRetraite, setAgeRetraite] = useState('');
  
  // Situation financière
  const [revenusAnnuels, setRevenusAnnuels] = useState('');
  const [epargneMensuelle, setEpargneMensuelle] = useState('');
  
  // Assurance-vie
  const [valeurAV, setValeurAV] = useState('');
  const [ancienneteAV, setAncienneteAV] = useState('');
  
  // PER
  const [versementsPER, setVersementsPER] = useState('');
  const [rendementPER, setRendementPER] = useState('');
  
  const [result, setResult] = useState<{
    avCapitalFinal: number;
    avImpot: number;
    avNet: number;
    perCapitalFinal: number;
    perImpot: number;
    perNet: number;
    difference: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const calculateComparaison = () => {
    const ageActuelValue = parseFloat(ageActuel) || 0;
    const ageRetraiteValue = parseFloat(ageRetraite) || 0;
    const epargneMensuelleValue = parseFloat(epargneMensuelle) || 0;
    const valeurAVValue = parseFloat(valeurAV) || 0;
    const ancienneteAVValue = parseFloat(ancienneteAV) || 0;
    const versementsPERValue = parseFloat(versementsPER) || 0;
    const rendementPERValue = parseFloat(rendementPER) || 0;
    
    const anneesRestantes = Math.max(0, ageRetraiteValue - ageActuelValue);
    const nbMois = anneesRestantes * 12;
    
    // Calcul Assurance-vie
    // Capital initial + épargne mensuelle avec intérêts composés
    // Taux moyen estimé à 3% pour l'AV
    const tauxAV = 0.03 / 12; // Taux mensuel
    let capitalAV = valeurAVValue;
    
    for (let mois = 0; mois < nbMois; mois++) {
      capitalAV = capitalAV * (1 + tauxAV) + epargneMensuelleValue;
    }
    
    const avCapitalFinal = Math.round(capitalAV);
    // Impôt AV : 7.5% sur les gains (après 8 ans)
    const gainsAV = avCapitalFinal - valeurAVValue - (epargneMensuelleValue * nbMois);
    const avImpot = ancienneteAVValue >= 8 ? Math.round(gainsAV * 0.075) : Math.round(gainsAV * 0.30);
    const avNet = avCapitalFinal - avImpot;
    
    // Calcul PER
    // Versements annuels avec intérêts composés
    const tauxPER = rendementPERValue / 100 / 12; // Taux mensuel
    let capitalPER = 0;
    
    for (let annee = 0; annee < anneesRestantes; annee++) {
      // Versement annuel au début de l'année
      capitalPER += versementsPERValue;
      // Capitalisation mensuelle
      for (let mois = 0; mois < 12; mois++) {
        capitalPER = capitalPER * (1 + tauxPER);
      }
    }
    
    const perCapitalFinal = Math.round(capitalPER);
    // Impôt PER : 30% sur le retrait
    const perImpot = Math.round(perCapitalFinal * 0.30);
    const perNet = perCapitalFinal - perImpot;
    
    // Différence
    const difference = avNet - perNet;
    
    setResult({
      avCapitalFinal,
      avImpot,
      avNet,
      perCapitalFinal,
      perImpot,
      perNet,
      difference
    });
    setShowResult(true);
  };

  const resetSimulation = () => {
    setAgeActuel('');
    setAgeRetraite('');
    setRevenusAnnuels('');
    setEpargneMensuelle('');
    setValeurAV('');
    setAncienneteAV('');
    setVersementsPER('');
    setRendementPER('');
    setResult(null);
    setShowResult(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Comparaison Assurance-vie vs PER</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche - Inputs */}
          <div className="space-y-6">
            {/* Informations personnelles */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <h3 className="font-semibold text-gray-800">Informations personnelles</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Vos données personnelles pour personnaliser les calculs</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge actuel</label>
                  <input
                    type="number"
                    value={ageActuel}
                    onChange={(e) => setAgeActuel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge de départ à la retraite</label>
                  <input
                    type="number"
                    value={ageRetraite}
                    onChange={(e) => setAgeRetraite(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Situation financière */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs font-bold">€</span>
                </div>
                <h3 className="font-semibold text-gray-800">Situation financière</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Vos revenus et épargne actuelle</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revenus annuels bruts (€)</label>
                  <input
                    type="number"
                    value={revenusAnnuels}
                    onChange={(e) => setRevenusAnnuels(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Épargne mensuelle (€)</label>
                  <input
                    type="number"
                    value={epargneMensuelle}
                    onChange={(e) => setEpargneMensuelle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Assurance-vie */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Assurance-vie</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Paramètres de votre contrat d'assurance-vie</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur actuelle du contrat (€)</label>
                  <input
                    type="number"
                    value={valeurAV}
                    onChange={(e) => setValeurAV(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ancienneté du contrat (années)</label>
                  <input
                    type="number"
                    value={ancienneteAV}
                    onChange={(e) => setAncienneteAV(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* PER */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Plan d'Épargne Retraite (PER)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Paramètres de votre PER</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Versements annuels actuels (€)</label>
                  <input
                    type="number"
                    value={versementsPER}
                    onChange={(e) => setVersementsPER(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rendement espéré (%)</label>
                  <input
                    type="number"
                    value={rendementPER}
                    onChange={(e) => setRendementPER(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Bouton */}
            <button
              onClick={calculateComparaison}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              Lancer la comparaison
            </button>
          </div>

          {/* Colonne droite - Résultats */}
          <div className="space-y-4">
            {showResult && result ? (
              <>
                {/* Assurance-vie */}
                <div className="bg-gray-800 rounded-lg p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">Assurance-vie</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Capital final</span>
                      <span className="font-semibold">{result.avCapitalFinal.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impôt (7.5%)</span>
                      <span className="font-semibold">{result.avImpot.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-600">
                      <span>Net après impôt</span>
                      <span className="font-bold text-lg">{result.avNet.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </div>

                {/* PER */}
                <div className="bg-amber-700 rounded-lg p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">Plan d'Épargne Retraite</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Capital final</span>
                      <span className="font-semibold">{result.perCapitalFinal.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impôt (30%)</span>
                      <span className="font-semibold">{result.perImpot.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-amber-600">
                      <span>Net après impôt</span>
                      <span className="font-bold text-lg">{result.perNet.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </div>

                {/* Résultat comparaison */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Résultat de la comparaison</h3>
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${result.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.difference >= 0 ? '+' : ''}{result.difference.toLocaleString('fr-FR')} €
                    </div>
                    <p className="text-sm text-gray-500">
                      {result.difference >= 0 ? "L'assurance-vie est plus avantageuse" : "Le PER est plus avantageux"}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Prendre RDV pour connaître le détail</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Assurance-vie placeholder */}
                <div className="bg-gray-800 rounded-lg p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">Assurance-vie</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Capital final</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impôt (7.5%)</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-600">
                      <span>Net après impôt</span>
                      <span className="font-bold text-lg">***</span>
                    </div>
                  </div>
                </div>

                {/* PER placeholder */}
                <div className="bg-amber-700 rounded-lg p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">Plan d'Épargne Retraite</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Capital final</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impôt (30%)</span>
                      <span className="font-semibold">***</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-amber-600">
                      <span>Net après impôt</span>
                      <span className="font-bold text-lg">***</span>
                    </div>
                  </div>
                </div>

                {/* Résultat comparaison placeholder */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Résultat de la comparaison</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600 mb-2">***€</div>
                    <p className="text-xs text-gray-400">Prendre RDV pour connaître le détail</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulateursPage;

