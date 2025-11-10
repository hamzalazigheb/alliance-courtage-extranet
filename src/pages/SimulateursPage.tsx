import React, { useState, useEffect } from 'react';

// Simulateurs Page Component
function SimulateursPage() {
  const [activeSimulator, setActiveSimulator] = useState<string | null>(null);

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
        {/* 1. Simulateur IR */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">💰</span>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Impôt sur le Revenu</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Calculez votre impôt sur le revenu selon les tranches d'imposition</p>
          <button 
            onClick={() => setActiveSimulator('ir')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
              Simulation IR
            </button>
          </div>

        {/* 2. Simulateur IFI */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🏠</span>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Fortune Immobilière (IFI)</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Estimez votre impôt sur la fortune immobilière</p>
          <button 
            onClick={() => setActiveSimulator('ifi')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Simulation IFI
            </button>
          </div>

        {/* 3. Simulateur Succession */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">📋</span>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Diagnostic Succession</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Calculez les droits de succession pour vos héritiers</p>
          <button 
            onClick={() => setActiveSimulator('succession')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Diagnostic Succession
            </button>
      </div>

        {/* 4. Simulateur Placement */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">📈</span>
              </div>
            </div>
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Simulateur Placement</h3>
          <p className="text-gray-600 text-center text-sm mb-6">Estimez le rendement et le capital accumulé de vos placements</p>
          <button 
            onClick={() => setActiveSimulator('placement')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Simulateur Placement
            </button>
          </div>
        </div>

      {/* Modals pour chaque simulateur */}
      {activeSimulator === 'ir' && (
        <IRSimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'ifi' && (
        <IFISimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'succession' && (
        <SuccessionSimulator onClose={() => setActiveSimulator(null)} />
      )}
      {activeSimulator === 'placement' && (
        <PlacementSimulator onClose={() => setActiveSimulator(null)} />
      )}
      </div>
  );
}

// Simulateur IR - Amélioré avec sliders et calcul temps réel
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

// Simulateur IFI - Amélioré avec sliders et calcul temps réel
function IFISimulator({ onClose }: { onClose: () => void }) {
  const [patrimoine, setPatrimoine] = useState(2000000);
  const [dettes, setDettes] = useState(300000);
  const [result, setResult] = useState<{ifi: number, base: number, patrimoineNet: number} | null>(null);

  useEffect(() => {
    const calculateIFI = () => {
      const patrimoineBrut = patrimoine;
      const dettesValue = dettes;
      
      if (patrimoineBrut <= 0) {
        setResult(null);
        return;
      }

      const patrimoineNet = patrimoineBrut - dettesValue;
      const baseImposable = Math.max(0, patrimoineNet - 1300000); // Abattement de 1.3M€

      if (baseImposable <= 0) {
        setResult({ ifi: 0, base: 0, patrimoineNet });
        return;
      }

      // Barème IFI 2024
      let ifi = 0;
      if (baseImposable > 800000) {
        const tranche2 = baseImposable - 800000;
        ifi += tranche2 * 0.007; // 0.70%
      }

      setResult({ ifi: Math.round(ifi), base: Math.round(baseImposable), patrimoineNet: Math.round(patrimoineNet) });
    };

    calculateIFI();
  }, [patrimoine, dettes]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Simulateur IFI</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Valeur du patrimoine immobilier</label>
                <span className="text-lg font-bold text-purple-600">{patrimoine.toLocaleString('fr-FR')} €</span>
            </div>
              <input
                type="range"
                min="0"
                max="10000000"
                step="50000"
                value={patrimoine}
                onChange={(e) => setPatrimoine(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>10 M€</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Valeur de tous vos biens immobiliers</p>
          </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Dettes immobilières</label>
                <span className="text-lg font-bold text-purple-600">{dettes.toLocaleString('fr-FR')} €</span>
              </div>
              <input
                type="range"
                min="0"
                max={patrimoine}
                step="10000"
                value={dettes}
                onChange={(e) => setDettes(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>{patrimoine.toLocaleString('fr-FR')} €</span>
            </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Patrimoine net:</span>
                  <span className="font-semibold">{result?.patrimoineNet.toLocaleString('fr-FR') || '...'} €</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Abattement (1.3M€):</span>
                  <span className="font-semibold">1 300 000 €</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-300">
                  <span>Base imposable:</span>
                  <span className="font-bold text-purple-700">{result?.base.toLocaleString('fr-FR') || '0'} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-1">IFI à payer</div>
                    <div className="text-4xl font-bold text-purple-700">
                      {result.ifi === 0 ? '0 €' : `${result.ifi.toLocaleString('fr-FR')} €`}
                    </div>
                  </div>
                  
                  {result.ifi === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-green-600 font-semibold mb-2">✅ Vous n'êtes pas soumis à l'IFI</div>
                      <p className="text-xs text-gray-600">Votre patrimoine net est inférieur au seuil de 1.3M€</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Taux IFI</span>
                        <span className="font-medium">0.70%</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-purple-200">
                        <span>Patrimoine net après IFI</span>
                        <span className="font-semibold text-green-600">
                          {(result.patrimoineNet - result.ifi).toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {result.ifi > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Détails du calcul</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Patrimoine net</span>
                        <span className="font-medium">{result.patrimoineNet.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Abattement</span>
                        <span className="font-medium">- 1 300 000 €</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-300">
                        <span>Base imposable</span>
                        <span className="font-medium">{result.base.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-300">
                        <span>× Taux 0.70%</span>
                        <span className="font-bold">{result.ifi.toLocaleString('fr-FR')} €</span>
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

// Simulateur Succession - Amélioré avec sliders et calcul temps réel
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

// Simulateur Placement - Amélioré avec sliders et calcul temps réel
function PlacementSimulator({ onClose }: { onClose: () => void }) {
  const [capitalInitial, setCapitalInitial] = useState(10000);
  const [versementMensuel, setVersementMensuel] = useState(200);
  const [tauxRendement, setTauxRendement] = useState(3);
  const [duree, setDuree] = useState(10);
  const [result, setResult] = useState<{capitalFinal: number, gains: number, totalVerse: number} | null>(null);

  useEffect(() => {
    const calculatePlacement = () => {
      const initial = capitalInitial;
      const mensuel = versementMensuel;
      const taux = tauxRendement / 100 / 12; // Taux mensuel
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
    };

    calculatePlacement();
  }, [capitalInitial, versementMensuel, tauxRendement, duree]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Simulateur Placement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Capital initial</label>
                <span className="text-lg font-bold text-orange-600">{capitalInitial.toLocaleString('fr-FR')} €</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={capitalInitial}
                onChange={(e) => setCapitalInitial(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>100 000 €</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Versement mensuel</label>
                <span className="text-lg font-bold text-orange-600">{versementMensuel.toLocaleString('fr-FR')} €</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={versementMensuel}
                onChange={(e) => setVersementMensuel(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span>2 000 €</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Taux de rendement annuel</label>
                <span className="text-lg font-bold text-orange-600">{tauxRendement}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={tauxRendement}
                onChange={(e) => setTauxRendement(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Durée</label>
                <span className="text-lg font-bold text-orange-600">{duree} ans</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={duree}
                onChange={(e) => setDuree(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 an</span>
                <span>40 ans</span>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-1">Capital final</div>
                    <div className="text-4xl font-bold text-orange-700">{result.capitalFinal.toLocaleString('fr-FR')} €</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total versé</span>
                      <span className="font-medium">{result.totalVerse.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gains générés</span>
                      <span className="font-medium text-green-600">+ {result.gains.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
                      <span>Rendement</span>
                      <span className="font-semibold text-orange-700">
                        {((result.gains / result.totalVerse) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Répartition</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Capital versé</span>
                        <span className="font-medium">{result.totalVerse.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gray-400 h-3 rounded-full transition-all"
                          style={{ width: `${(result.totalVerse / result.capitalFinal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Gains (intérêts)</span>
                        <span className="font-medium">{result.gains.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${(result.gains / result.capitalFinal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-gray-700">
                    <div className="flex justify-between mb-1">
                      <span>Versement mensuel:</span>
                      <span className="font-medium">{versementMensuel.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Durée totale:</span>
                      <span className="font-medium">{duree * 12} mois</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-blue-300">
                      <span>Total des versements:</span>
                      <span className="font-semibold">{(versementMensuel * duree * 12).toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </div>
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

export default SimulateursPage;

