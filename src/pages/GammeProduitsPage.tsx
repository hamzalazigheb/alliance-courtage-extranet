import React, { useState, useEffect } from "react";
import { buildAPIURL } from '../api';

export default function GammeProduitsPage() {
  const [selectedClientType, setSelectedClientType] = useState("particulier");
  const [selectedProductType, setSelectedProductType] = useState("epargne");
  const [cmsProducts, setCmsProducts] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clientTypes = [
    { id: "particulier", name: "Particulier", icon: "👤" },
    { id: "professionnel", name: "Professionnel", icon: "💼" },
    { id: "entreprise", name: "Entreprise", icon: "🏢" }
  ];

  const productTypes = [
    { id: "epargne", name: "Épargne" },
    { id: "retraite", name: "Retraite" },
    { id: "prevoyance", name: "Prévoyance" },
    { id: "sante", name: "Santé" },
    { id: "cif", name: "Conseil en investissement financier" }
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(buildAPIURL('/cms/gamme-produits'), {
          headers: { 'x-auth-token': localStorage.getItem('token') || '' }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.content) {
            setCmsProducts(JSON.parse(data.content));
          }
        }
      } catch {
        // ignore and fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getProducts = () => {
    const fallback = {
      particulier: {
        epargne: [
          { name: "Assurance vie", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Capitalisation", description: "Solution adaptée aux besoins spécifiques" },
          { name: "PEA assurance", description: "Solution adaptée aux besoins spécifiques" }
        ],
        retraite: [{ name: "PER", description: "Solution adaptée aux besoins spécifiques" }],
        prevoyance: [
          { name: "Assurance décès / invalidité / incapacité", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Assurance emprunteur", description: "Solution adaptée aux besoins spécifiques" }
        ],
        sante: [{ name: "Mutuelle santé", description: "Solution adaptée aux besoins spécifiques" }],
        cif: [
          { name: "SCPI", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Private Equity", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Défiscalisation", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Diversification", description: "Solution adaptée aux besoins spécifiques" }
        ]
      },
      professionnel: {
        epargne: [
          { name: "Capitalisation", description: "Solution adaptée aux besoins spécifiques" },
          { name: "PEE", description: "Solution adaptée aux besoins spécifiques" }
        ],
        retraite: [
          { name: "PER", description: "Solution adaptée aux besoins spécifiques" },
          { name: "PERCO", description: "Solution adaptée aux besoins spécifiques" }
        ],
        prevoyance: [
          { name: "Assurance décès / invalidité / incapacité", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Assurance emprunteur", description: "Solution adaptée aux besoins spécifiques" }
        ],
        sante: [{ name: "Mutuelle santé", description: "Solution adaptée aux besoins spécifiques" }],
        cif: [
          { name: "Conseil professionnel", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Investissements professionnels", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Gestion patrimoniale", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Placements spécialisés", description: "Solution adaptée aux besoins spécifiques" }
        ]
      },
      entreprise: {
        epargne: [
          { name: "Capitalisation", description: "Solution adaptée aux besoins spécifiques" },
          { name: "PEE", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Intéressement", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Participation", description: "Solution adaptée aux besoins spécifiques" },
          { name: "IFC", description: "Solution adaptée aux besoins spécifiques" }
        ],
        retraite: [
          { name: "PER Entreprise", description: "Solution adaptée aux besoins spécifiques" },
          { name: "PERCO", description: "Solution adaptée aux besoins spécifiques" }
        ],
        prevoyance: [{ name: "Prévoyance collective", description: "Solution adaptée aux besoins spécifiques" }],
        sante: [{ name: "Mutuelle santé collective", description: "Solution adaptée aux besoins spécifiques" }],
        cif: [
          { name: "Conseil d'entreprise", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Investissements corporatifs", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Gestion financière", description: "Solution adaptée aux besoins spécifiques" },
          { name: "Stratégies d'investissement", description: "Solution adaptée aux besoins spécifiques" }
        ]
      }
    };
    const matrix = cmsProducts?.products || fallback;
    const products = (matrix[selectedClientType] && matrix[selectedClientType][selectedProductType]) || [];
    // Convertir les anciens produits (strings) en objets si nécessaire
    return products.map((p: any) => {
      if (typeof p === 'string') {
        return { name: p, description: 'Solution adaptée aux besoins spécifiques' };
      }
      return { name: p.name || '', description: p.description || 'Solution adaptée aux besoins spécifiques' };
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Client Type Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Type de Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clientTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedClientType(type.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedClientType === type.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium text-gray-800">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Product Type Selection */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Type de Produit</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(cmsProducts?.products && Object.keys(cmsProducts.products[selectedClientType] || {}).length > 0
            ? Object.keys(cmsProducts.products[selectedClientType] || {}).map((k: string) => ({ id: k, name: k }))
            : productTypes
          ).map((type: any) => (
            <button
              key={type.id}
              onClick={() => setSelectedProductType(type.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedProductType === type.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium text-gray-800 text-sm">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Products Display */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Produits {clientTypes.find(t => t.id === selectedClientType)?.name} - {(
            cmsProducts?.products && cmsProducts.products[selectedClientType] && cmsProducts.products[selectedClientType][selectedProductType]
              ? selectedProductType
              : productTypes.find(t => t.id === selectedProductType)?.name
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getProducts().map((product: { name: string; description: string }, index: number) => (
            <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {product.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

