import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { bordereauxAPI, Bordereau } from '../api/bordereaux';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { theme } from '../utils/theme';

export const AccountingScreen: React.FC = () => {
  const [bordereaux, setBordereaux] = useState<Bordereau[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBordereaux();
  }, []);

  const loadBordereaux = async () => {
    try {
      setLoading(true);
      const data = await bordereauxAPI.getAll();
      setBordereaux(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les bordereaux');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBordereaux();
    setRefreshing(false);
  };

  const handleDownload = async (bordereau: Bordereau) => {
    try {
      const url = await bordereauxAPI.download(bordereau.id);
      // TODO: Implement file download using react-native-fs
      Alert.alert('Téléchargement', `URL: ${url}\nFonctionnalité à implémenter`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le bordereau');
    }
  };

  const getPeriodLabel = (bordereau: Bordereau) => {
    if (bordereau.period_month && bordereau.period_year) {
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
      ];
      return `${monthNames[bordereau.period_month - 1]} ${bordereau.period_year}`;
    }
    return 'Période non spécifiée';
  };

  const renderBordereau = ({ item }: { item: Bordereau }) => (
    <Card style={styles.bordereauCard}>
      <Text style={styles.bordereauTitle}>{item.titre}</Text>
      <Text style={styles.bordereauPeriod}>{getPeriodLabel(item)}</Text>
      <Text style={styles.bordereauDate}>
        Ajouté le {new Date(item.created_at).toLocaleDateString('fr-FR')}
      </Text>
      <Button
        title="Télécharger"
        variant="outline"
        onPress={() => handleDownload(item)}
        style={styles.downloadButton}
      />
    </Card>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bordereaux}
        renderItem={renderBordereau}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun bordereau disponible</Text>
          </View>
        }
      />
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
  bordereauCard: {
    marginBottom: theme.spacing.md,
  },
  bordereauTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bordereauPeriod: {
    ...theme.typography.body,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  bordereauDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  downloadButton: {
    marginTop: theme.spacing.sm,
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




