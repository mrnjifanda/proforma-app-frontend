'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Package,
  FileText,
  CheckCircle,
  DollarSign,
  Calendar,
  BarChart3,
  AlertCircle,
  Target,
  Filter,
  RefreshCw,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import clientService from '@/api/client.service';
import produitService from '@/api/produit.service';
import proformaService from '@/api/proforma.service';
import { ContenuItem, Produit, ProduitAvecVentes, Proforma, Client } from '@/utils/types';
import EnhancedStatCard from '@/components/customs/Dashboard/EnhancedStatCard';
import ChartCard from '@/components/customs/Dashboard/ChartCard';
import { toastError, toastSuccess } from '@/utils/libs/toastify';
import { configEntreprise } from '@/utils/constants';

// Interfaces
interface DashboardStats {
  totalClients: number;
  totalProduits: number;
  proformasEnCours: number;
  devisAcceptes: number;
  chiffreAffaireMois: number;
  evolutionClients: number;
  evolutionProduits: number;
  evolutionProformas: number;
  evolutionDevis: number;
  evolutionCA: number;
}

interface ChartData {
  name: string;
  value: number;
  fullDate: string;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

type TimeFilter = 'week' | 'month' | 'quarter' | 'year';

export default function EnhancedDashboardPage() {
  // États
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProduits: 0,
    proformasEnCours: 0,
    devisAcceptes: 0,
    chiffreAffaireMois: 0,
    evolutionClients: 0,
    evolutionProduits: 0,
    evolutionProformas: 0,
    evolutionDevis: 0,
    evolutionCA: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  const [salesData, setSalesData] = useState<ChartData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([
    { name: 'Acceptés', value: 0, color: '#10B981' },
    { name: 'En attente', value: 0, color: '#F59E0B' },
    { name: 'Refusés', value: 0, color: '#EF4444' }
  ]);
  const [topProduits, setTopProduits] = useState<ProduitAvecVentes[]>([]);
  const [, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    toastSuccess({ message: 'Données actualisées avec succès' });
  };

  // Fonction pour formater les valeurs monétaires
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
  };

  // Calculer les données pour les graphiques en fonction du filtre de temps
  const calculateChartData = useMemo(() => {

    if (!proformas.length) return [];

    const periodData: ChartData[] = [];
    let dataPoints = 6; // Par défaut 6 mois

    if (timeFilter === 'week') {
      dataPoints = 7; // 7 jours
    } else if (timeFilter === 'quarter') {
      dataPoints = 4; // 4 trimestres
    } else if (timeFilter === 'year') {
      dataPoints = 12; // 12 mois
    }

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date();
      let periodStart: Date;
      let periodEnd: Date;
      let periodName: string;

      if (timeFilter === 'week') {
        date.setDate(date.getDate() - i);
        periodStart = new Date(date);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(date);
        periodEnd.setHours(23, 59, 59, 999);
        periodName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      } else if (timeFilter === 'month') {
        date.setMonth(date.getMonth() - i);
        periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
        periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        periodName = date.toLocaleDateString('fr-FR', { month: 'short' });
      } else if (timeFilter === 'quarter') {
        const quarter = Math.floor(date.getMonth() / 3);
        date.setMonth(quarter * 3 - i * 3);
        periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
        periodEnd = new Date(date.getFullYear(), date.getMonth() + 3, 0, 23, 59, 59, 999);
        periodName = `T${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      } else { // year
        date.setFullYear(date.getFullYear() - i);
        periodStart = new Date(date.getFullYear(), 0, 1);
        periodEnd = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        periodName = date.getFullYear().toString();
      }

      // Calculer le CA pour cette période
      const periodCA = proformas.filter(p => {
        const proformaDate = new Date(p.created_at as Date);
        return proformaDate >= periodStart && proformaDate <= periodEnd && p.statut === 'accepte';
      })
        .reduce((total, p) => total + (p.totalTTC || 0), 0);

      periodData.push({
        name: periodName,
        value: periodCA,
        fullDate: periodStart.toLocaleDateString('fr-FR')
      });
    }

    return periodData;
  }, [proformas, timeFilter]);

  // Calculer les statistiques de statut des proformas
  const calculateStatusData = useMemo(() => {
    if (!proformas.length) return statusData;

    const acceptes = proformas.filter(p => p.statut === 'accepte').length;
    const enAttente = proformas.filter(p => p.statut === 'en_attente').length;
    const refuses = proformas.filter(p => p.statut === 'refuse').length;

    return [
      { name: 'Acceptés', value: acceptes, color: '#10B981' },
      { name: 'En attente', value: enAttente, color: '#F59E0B' },
      { name: 'Refusés', value: refuses, color: '#EF4444' }
    ];
  }, [proformas]);

  // Calculer les top produits
  const calculateTopProduits = useMemo(() => {
    if (!proformas.length) return [];

    const produitStats = new Map();

    proformas.forEach(proforma => {
      if (proforma.statut === 'accepte' && proforma.contenu) {
        proforma.contenu.forEach((item: ContenuItem) => {
          const key = item.produit || item.nom;
          if (produitStats.has(key)) {
            const existing = produitStats.get(key);
            produitStats.set(key, {
              ...existing,
              totalCA: existing.totalCA + (item.totalLigneTTC || 0),
              quantiteVendue: existing.quantiteVendue + (item.quantite || 0)
            });
          } else {
            produitStats.set(key, {
              nom: item.nom,
              reference: item.reference || 'N/A',
              totalCA: item.totalLigneTTC || 0,
              quantiteVendue: item.quantite || 0
            });
          }
        });
      }
    });

    return Array.from(produitStats.values())
      .sort((a, b) => b.totalCA - a.totalCA)
      .slice(0, 5);
  }, [proformas]);

  // Calculer les métriques de performance
  const performanceMetrics = useMemo(() => {
    if (!proformas.length) return {
      tauxConversion: 0,
      devisMoyen: 0,
      tempsMoyen: 0
    };

    const totalDevis = proformas.length;
    const devisAcceptes = proformas.filter(p => p.statut === 'accepte').length;
    const tauxConversion = totalDevis > 0 ? (devisAcceptes / totalDevis) * 100 : 0;

    const caTotal = proformas
      .filter(p => p.statut === 'accepte')
      .reduce((total, p) => total + (p.totalTTC || 0), 0);

    const devisMoyen = devisAcceptes > 0 ? caTotal / devisAcceptes : 0;

    // Calcul approximatif du temps moyen de traitement (en jours)
    let totalDays = 0;
    let count = 0;

    proformas.forEach(p => {
      if (p.created_at && p.updated_at && p.statut !== 'en_attente') {
        const created = new Date(p.created_at);
        const updated = new Date(p.updated_at);
        const diffTime = Math.abs(updated.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        count++;
      }
    });

    const tempsMoyen = count > 0 ? totalDays / count : 0;

    return {
      tauxConversion,
      devisMoyen,
      tempsMoyen
    };
  }, [proformas]);

  // Chargement des données depuis les APIs
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [clientsRes, produitsRes, proformasRes] = await Promise.allSettled([
        clientService.getAll({ limit: 1000, page: 0 }),
        produitService.getAll({ limit: 1000, page: 0 }),
        proformaService.getAll({ limit: 1000, page: 0 })
      ]);

      // Gérer les réponses
      const clientsData = clientsRes.status === 'fulfilled' ? clientsRes.value.data.data?.content || [] : [];
      const produitsData = produitsRes.status === 'fulfilled' ? produitsRes.value.data.data?.content || [] : [];
      const proformasData = proformasRes.status === 'fulfilled' ? proformasRes.value.data.data?.content || [] : [];

      setClients(clientsData);
      setProduits(produitsData);
      setProformas(proformasData);

      // Calculer les statistiques de base
      const totalClients = clientsData.length;
      const totalProduits = produitsData.filter((p: Produit) => p.actif).length;
      const proformasEnCours = proformasData.filter((p: Proforma) => p.statut === 'en_attente').length;
      const devisAcceptes = proformasData.filter((p: Proforma) => p.statut === 'accepte').length;

      // Calculer le CA du mois en cours
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const chiffreAffaireMois = proformasData
        .filter((p: Proforma) => {
          const proformaDate = new Date(p.created_at as Date);
          return proformaDate.getMonth() === currentMonth &&
            proformaDate.getFullYear() === currentYear &&
            p.statut === 'accepte';
        })
        .reduce((total: number, p: Proforma) => total + (p.totalTTC || 0), 0);

      // Calculer les évolutions (comparaison avec le mois précédent)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const prevMonthCA = proformasData
        .filter((p: Proforma) => {
          const proformaDate = new Date(p.created_at as Date);
          return proformaDate.getMonth() === prevMonth &&
            proformaDate.getFullYear() === prevMonthYear &&
            p.statut === 'accepte';
        })
        .reduce((total: number, p: Proforma) => total + (p.totalTTC || 0), 0);

      const evolutionCA = prevMonthCA > 0 ?
        ((chiffreAffaireMois - prevMonthCA) / prevMonthCA) * 100 :
        chiffreAffaireMois > 0 ? 100 : 0;

      // Mettre à jour les statistiques
      setStats({
        totalClients,
        totalProduits,
        proformasEnCours,
        devisAcceptes,
        chiffreAffaireMois,
        evolutionClients: 0, // À calculer si les données historiques sont disponibles
        evolutionProduits: 0, // À calculer si les données historiques sont disponibles
        evolutionProformas: 0, // À calculer si les données historiques sont disponibles
        evolutionDevis: 0, // À calculer si les données historiques sont disponibles
        evolutionCA
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données');
      toastError({ message: 'Erreur lors du chargement des données du tableau de bord.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Mettre à jour les données dérivées lorsque les données sources changent
  useEffect(() => {
    setSalesData(calculateChartData);
    setStatusData(calculateStatusData);
    setTopProduits(calculateTopProduits);
  }, [calculateChartData, calculateStatusData, calculateTopProduits]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium text-lg">Chargement du tableau de bord...</p>
          <p className="text-gray-500 text-sm mt-2">Récupération des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* En-tête avec bienvenue */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3 flex items-center">
                  <Target className="w-10 h-10 mr-4" />
                  Tableau de Bord {configEntreprise.nom}
                </h1>
                <p className="text-xl text-indigo-100 mb-2">Gérez efficacement vos devis et proformas</p>
                <p className="text-indigo-200">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
                <div className="hidden md:block">
                  <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <BarChart3 className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <EnhancedStatCard
            title="Total Clients"
            value={stats.totalClients}
            evolution={stats.evolutionClients}
            icon={Users}
            color="blue"
          />
          <EnhancedStatCard
            title="Produits Actifs"
            value={stats.totalProduits}
            evolution={stats.evolutionProduits}
            icon={Package}
            color="green"
          />
          <EnhancedStatCard
            title="Devis en cours"
            value={stats.proformasEnCours}
            evolution={stats.evolutionProformas}
            icon={FileText}
            color="yellow"
          />
          <EnhancedStatCard
            title="Devis Acceptés"
            value={stats.devisAcceptes}
            evolution={stats.evolutionDevis}
            icon={CheckCircle}
            color="purple"
          />
          <EnhancedStatCard
            title="CA du mois"
            value={stats.chiffreAffaireMois.toLocaleString('fr-FR')}
            evolution={stats.evolutionCA}
            icon={DollarSign}
            color="red"
            suffix=" $"
          />
        </div>

        {/* Filtres de période */}
        <div className="flex justify-end">
          <div className="bg-white rounded-xl p-2 shadow-sm flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Période:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="bg-gray-100 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="week">7 derniers jours</option>
              <option value="month">6 derniers mois</option>
              <option value="quarter">4 derniers trimestres</option>
              <option value="year">12 derniers mois</option>
            </select>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Évolution du chiffre d'affaires */}
          <ChartCard title={`Évolution du Chiffre d'Affaires (${timeFilter === 'week' ? '7 jours' : timeFilter === 'month' ? '6 mois' : timeFilter === 'quarter' ? '4 trimestres' : '12 mois'})`} className="xl:col-span-1">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" tickFormatter={(value) => `$${value.toLocaleString('fr-FR')}`} />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toLocaleString('fr-FR')}`, 'Chiffre d\'affaires']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#FFFFFF'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366F1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Répartition des statuts */}
          <ChartCard title="Répartition des Statuts Devis">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  dataKey="value"
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, 'Nombre de devis']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4 space-x-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Section Performance et Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Métriques de Performance */}
          <ChartCard title="Métriques de Performance" className="xl:col-span-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taux de conversion</p>
                    <p className="text-2xl font-bold text-gray-900">{performanceMetrics.tauxConversion.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Devis moyen</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(performanceMetrics.devisMoyen)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Temps moyen de traitement</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {performanceMetrics.tempsMoyen > 0 ? `${performanceMetrics.tempsMoyen.toFixed(1)} jours` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Top Produits */}
          <ChartCard title="Top Produits (CA)" className="xl:col-span-2">
            <div className="space-y-4">
              {topProduits.length > 0 ? (
                topProduits.map((produit, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{produit.nom}</p>
                        <p className="text-sm text-gray-600">Ref: {produit.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(produit.totalCA)}</p>
                      <p className="text-sm text-gray-500">{produit.quantiteVendue} vendus</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune vente enregistrée</p>
                </div>
              )}
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  );
}