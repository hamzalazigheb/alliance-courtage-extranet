import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { productsAPI, Assurance, ProduitStructure } from '../api/products';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { theme } from '../utils/theme';

export const ProductsScreen: React.FC = () => {
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [montants, setMontants] = useState<{ [key: number]: { montant_total: number; montant_restant: number } }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProduitStructure | null>(null);
  const [reservationAmount, setReservationAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assurancesData, montantsData] = await Promise.all([
        productsAPI.getAll(),
        productsAPI.getMontants(),
      ]);
      setAssurances(assurancesData);
      setMontants(montantsData);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleReserve = async () => {
    if (!selectedProduct) return;

    const amount = parseFloat(reservationAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }

    const productMontant = montants[selectedProduct.id];
    if (productMontant && amount > productMontant.montant_restant) {
      Alert.alert('Erreur', 'Montant supérieur au montant disponible');
      return;
    }

    try {
      await productsAPI.createReservation({
        produit_id: selectedProduct.id,
        montant: amount,
      });
      Alert.alert('Succès', 'Réservation effectuée avec succès');
      setSelectedProduct(null);
      setReservationAmount('');
      await loadData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de créer la réservation');
    }
  };

  const renderProduct = ({ item }: { item: ProduitStructure }) => {
    const productMontant = montants[item.id] || {
      montant_total: item.montant_total,
      montant_restant: item.montant_restant || item.montant_total - item.montant_reserve,
    };

    return (
      <Card style={styles.productCard}>
        <Text style={styles.productTitle}>{item.titre}</Text>
        {item.description && (
          <Text style={styles.productDescription}>{item.description}</Text>
        )}
        <View style={styles.productInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Montant total:</Text>
            <Text style={styles.infoValue}>
              {productMontant.montant_total.toLocaleString('fr-FR')} €
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Disponible:</Text>
            <Text style={[styles.infoValue, styles.availableAmount]}>
              {productMontant.montant_restant.toLocaleString('fr-FR')} €
            </Text>
          </View>
        </View>
        <Button
          title="Réserver"
          onPress={() => setSelectedProduct(item)}
          disabled={productMontant.montant_restant <= 0}
          style={styles.reserveButton}
        />
      </Card>
    );
  };

  const renderAssurance = ({ item }: { item: Assurance }) => (
    <View style={styles.assuranceSection}>
      <Text style={styles.assuranceTitle}>{item.nom}</Text>
      <FlatList
        data={item.produits}
        renderItem={renderProduct}
        keyExtractor={(product) => product.id.toString()}
        scrollEnabled={false}
      />
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={assurances}
        renderItem={renderAssurance}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun produit disponible</Text>
          </View>
        }
      />

      {selectedProduct && (
        <View style={styles.modal}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Réserver un montant</Text>
            <Text style={styles.modalProductName}>{selectedProduct.titre}</Text>
            <Text style={styles.modalInfo}>
              Montant disponible:{' '}
              {montants[selectedProduct.id]?.montant_restant.toLocaleString('fr-FR') || '0'} €
            </Text>
            <Input
              label="Montant (€)"
              value={reservationAmount}
              onChangeText={setReservationAmount}
              keyboardType="numeric"
              placeholder="0"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => {
                  setSelectedProduct(null);
                  setReservationAmount('');
                }}
                style={styles.modalButton}
              />
              <Button
                title="Confirmer"
                onPress={handleReserve}
                style={styles.modalButton}
              />
            </View>
          </Card>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
  },
  assuranceSection: {
    marginBottom: theme.spacing.lg,
  },
  assuranceTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  productCard: {
    marginBottom: theme.spacing.md,
  },
  productTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  productDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  productInfo: {
    marginBottom: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  availableAmount: {
    color: theme.colors.success,
  },
  reserveButton: {
    marginTop: theme.spacing.sm,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  modalProductName: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  modalInfo: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});




