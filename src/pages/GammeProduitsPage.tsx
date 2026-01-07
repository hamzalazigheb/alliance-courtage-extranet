import React, { useState, useEffect } from "react";
import { buildAPIURL } from '../api';

// Composant pour afficher les fichiers d'un produit (chargés via API)
const ProductFilesSection: React.FC<{
  productId: number;
  productKey: string;
  productFiles: Record<string, any[]>;
  setProductFiles: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}> = ({ productId, productKey, productFiles, setProductFiles }) => {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Charger les fichiers si pas déjà chargés
    if (!productFiles[productKey]) {
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productKey]);
  
  const loadFiles = async () => {
    try {
      setLoading(true);
      console.log(`📂 Chargement fichiers pour produit ID ${productId} (${productKey})...`);
      
      // Charger depuis la NOUVELLE API (100% DB)
      const response = await fetch(buildAPIURL(`/gamme-products/${productId}/files`), {
        headers: { 'x-auth-token': localStorage.getItem('token') || '' }
      });
      
      if (response.ok) {
        const files = await response.json();
        console.log(`📄 Fichiers reçus pour produit ${productId}:`, files);
        
        // Filtrer les fichiers qui ont du contenu (file_size > 0)
        const validFiles = files.filter((f: any) => f.file_size > 0);
        setProductFiles(prev => ({ ...prev, [productKey]: validFiles }));
        
        if (validFiles.length > 0) {
          console.log(`✅ ${validFiles.length} fichier(s) valide(s) chargé(s) pour produit ID ${productId}`);
        } else {
          console.log(`⚠️ Aucun fichier valide pour produit ID ${productId}`);
        }
      } else {
        console.warn(`⚠️ Réponse non-OK (${response.status}) pour produit ID ${productId}`);
        setProductFiles(prev => ({ ...prev, [productKey]: [] }));
      }
    } catch (error) {
      console.error(`❌ Erreur chargement fichiers pour produit ${productId}:`, error);
      setProductFiles(prev => ({ ...prev, [productKey]: [] }));
    } finally {
      setLoading(false);
    }
  };
  
  const files = productFiles[productKey] || [];
  
  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-300">
        <p className="text-xs text-gray-500">Chargement des documents...</p>
      </div>
    );
  }
  
  if (files.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3 pt-3 border-t-2 border-slate-200">
      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
        <svg className="w-4 h-4 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Documents associés
      </h4>
      <div className="space-y-2">
        {files.map((file: any) => (
          <div key={file.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border-2 border-slate-200 hover:border-blue-400 hover:bg-slate-100 transition-all group">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs text-slate-700 font-semibold truncate flex-1">
                {file.file_name}
              </span>
            </div>
            <a
              href={buildAPIURL(`/gamme-products/${productId}/files/${file.id}/download`)}
              download={file.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold flex items-center space-x-1 shadow-md hover:shadow-lg ml-2"
              title="Télécharger"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Télécharger</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function GammeProduitsPage() {
  const [selectedClientType, setSelectedClientType] = useState("particulier");
  const [selectedProductType, setSelectedProductType] = useState("epargne");
  const [cmsProducts, setCmsProducts] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [productFiles, setProductFiles] = useState<Record<string, any[]>>({});
  const [productTypes, setProductTypes] = useState<{ id: string; name: string }[]>([
    { id: "epargne", name: "Épargne" },
    { id: "retraite", name: "Retraite" },
    { id: "prevoyance", name: "Prévoyance" },
    { id: "sante", name: "Santé" },
    { id: "cif", name: "CIF" }
  ]);

  const clientTypes = [
    { id: "particulier", name: "Particulier", icon: "👤" },
    { id: "professionnel", name: "Professionnel", icon: "💼" },
    { id: "entreprise", name: "Entreprise", icon: "🏢" }
  ];

  useEffect(() => {
    const load = async () => {
      try {
        // Charger les familles depuis la DB
        const familiesResp = await fetch(buildAPIURL('/gamme-products/families'), {
          headers: { 'x-auth-token': localStorage.getItem('token') || '' }
        });
        if (familiesResp.ok) {
          const families = await familiesResp.json();
          console.log('✅ Familles chargées depuis DB:', families.length);
          // Filtrer les familles vides/invalides
          const validFamilies = families.filter((f: any) => 
            f.value && f.value.trim() && f.label && f.label.trim()
          );
          if (validFamilies && validFamilies.length > 0) {
            setProductTypes(validFamilies.map((f: any) => ({
              id: f.value,
              name: f.label
            })));
            // Si la famille sélectionnée n'existe plus, sélectionner la première
            if (!families.some((f: any) => f.value === selectedProductType)) {
              setSelectedProductType(families[0].value);
            }
          }
        }

        // Charger les produits depuis la NOUVELLE API (100% DB)
        const resp = await fetch(buildAPIURL('/gamme-products'), {
          headers: { 'x-auth-token': localStorage.getItem('token') || '' }
        });
        if (resp.ok) {
          const products = await resp.json();
          console.log('✅ Produits chargés depuis DB:', products.length);
          
          // Convertir les produits DB au format attendu par l'interface
          // Structure dynamique basée sur les familles chargées
          const groupedProducts: any = {
            particulier: {},
            professionnel: {},
            entreprise: {}
          };
          
          // Initialiser toutes les familles pour chaque type de client
          const familiesResp2 = await fetch(buildAPIURL('/gamme-products/families'));
          const allFamilies = familiesResp2.ok ? await familiesResp2.json() : productTypes.map(p => ({ value: p.id }));
          
          ['particulier', 'professionnel', 'entreprise'].forEach(clientType => {
            allFamilies.forEach((family: any) => {
              groupedProducts[clientType][family.value] = [];
            });
          });
          
          products.forEach((product: any) => {
            const { client_type, family, product_name, description } = product;
            if (groupedProducts[client_type]) {
              // S'assurer que la famille existe
              if (!groupedProducts[client_type][family]) {
                groupedProducts[client_type][family] = [];
              }
              // Vérifier si le produit existe déjà (éviter doublons)
              const exists = groupedProducts[client_type][family].some(
                (p: any) => p.name === product_name
              );
              if (!exists) {
                groupedProducts[client_type][family].push({
                  name: product_name,
                  description: description || '',
                  id: product.id // Garder l'ID pour charger les fichiers
                });
              }
            }
          });
          
          setCmsProducts({ products: groupedProducts });
          console.log('📦 Produits groupés chargés:', groupedProducts);
        }
      } catch (error) {
        console.error('❌ Erreur chargement produits depuis DB:', error);
        // Fallback si erreur
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
          { name: "Assurance vie", description: "" },
          { name: "Capitalisation", description: "" },
          { name: "PEA assurance", description: "" }
        ],
        retraite: [{ name: "PER", description: "" }],
        prevoyance: [
          { name: "Assurance décès / invalidité / incapacité", description: "" },
          { name: "Assurance emprunteur", description: "" }
        ],
        sante: [{ name: "Mutuelle santé", description: "" }],
        cif: [
          { name: "SCPI", description: "" },
          { name: "Private Equity", description: "" },
          { name: "Défiscalisation", description: "" },
          { name: "Diversification", description: "" }
        ]
      },
      professionnel: {
        epargne: [
          { name: "Capitalisation", description: "" },
          { name: "PEE", description: "" }
        ],
        retraite: [
          { name: "PER", description: "" },
          { name: "PERCO", description: "" }
        ],
        prevoyance: [
          { name: "Assurance décès / invalidité / incapacité", description: "" },
          { name: "Assurance emprunteur", description: "" }
        ],
        sante: [{ name: "Mutuelle santé", description: "" }],
        cif: [
          { name: "Conseil professionnel", description: "" },
          { name: "Investissements professionnels", description: "" },
          { name: "Gestion patrimoniale", description: "" },
          { name: "Placements spécialisés", description: "" }
        ]
      },
      entreprise: {
        epargne: [
          { name: "Capitalisation", description: "" },
          { name: "PEE", description: "" },
          { name: "Intéressement", description: "" },
          { name: "Participation", description: "" },
          { name: "IFC", description: "" }
        ],
        retraite: [
          { name: "PER Entreprise", description: "" },
          { name: "PERCO", description: "" }
        ],
        prevoyance: [{ name: "Prévoyance collective", description: "" }],
        sante: [{ name: "Mutuelle santé collective", description: "" }],
        cif: [
          { name: "Conseil d'entreprise", description: "" },
          { name: "Investissements corporatifs", description: "" },
          { name: "Gestion financière", description: "" },
          { name: "Stratégies d'investissement", description: "" }
        ]
      }
    };
    const matrix = cmsProducts?.products || fallback;
    const products = (matrix[selectedClientType] && matrix[selectedClientType][selectedProductType]) || [];
    // Convertir les anciens produits (strings) en objets si nécessaire, en préservant l'ID et les documents
    return products.map((p: any) => {
      if (typeof p === 'string') {
        return { name: p, description: '', documents: [] };
      }
      return { 
        id: p.id, // ⭐ IMPORTANT: Inclure l'ID pour charger les fichiers depuis la DB
        name: p.name || '', 
        description: p.description || '',
        documents: p.documents && Array.isArray(p.documents) ? p.documents : []
      };
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Client Type Selection */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl p-8 border-2 border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Type de Client
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clientTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedClientType(type.id)}
              className={`p-5 rounded-xl border-2 transition-all duration-300 font-semibold ${
                selectedClientType === type.id
                  ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 shadow-lg scale-105"
                  : "border-slate-300 bg-white hover:border-slate-400 text-slate-700 hover:shadow-md"
              }`}
            >
              <div className="text-base">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Product Type Selection */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl p-8 border-2 border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Type de Produit
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(cmsProducts?.products && Object.keys(cmsProducts.products[selectedClientType] || {}).length > 0
            ? Object.keys(cmsProducts.products[selectedClientType] || {})
                .filter((k: string) => k && k.trim()) // Filtrer les clés vides
                .map((k: string) => {
                  // Trouver le nom correct dans productTypes
                  const found = productTypes.find(pt => pt.id === k);
                  return { id: k, name: found ? found.name : k };
                })
            : productTypes
          ).map((type: any) => (
            <button
              key={type.id}
              onClick={() => setSelectedProductType(type.id)}
              className={`p-5 rounded-xl border-2 transition-all duration-300 font-semibold ${
                selectedProductType === type.id
                  ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 shadow-lg scale-105"
                  : "border-slate-300 bg-white hover:border-slate-400 text-slate-700 hover:shadow-md"
              }`}
            >
              <div className="text-sm capitalize">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Products Display */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl p-8 border-2 border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Produits {clientTypes.find(t => t.id === selectedClientType)?.name} - {(
            cmsProducts?.products && cmsProducts.products[selectedClientType] && cmsProducts.products[selectedClientType][selectedProductType]
              ? selectedProductType
              : productTypes.find(t => t.id === selectedProductType)?.name
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getProducts().map((product: { id?: number; name: string; description: string; documents?: any[] }, index: number) => (
            <div key={product.id || index} className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border-2 border-slate-200 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-4">
                <h3 className="font-bold text-white text-base flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {product.name}
                </h3>
              </div>
              <div className="p-4">
                {product.description && (
                  <p className="text-sm text-slate-600 mb-3 font-medium">
                    {product.description}
                  </p>
                )}
                
                {/* Section Documents - Chargement via API (100% DB) */}
                {product.id && (
                  <ProductFilesSection 
                    productId={product.id}
                    productKey={`${selectedClientType}_${selectedProductType}_${product.name}`}
                    productFiles={productFiles}
                    setProductFiles={setProductFiles}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

