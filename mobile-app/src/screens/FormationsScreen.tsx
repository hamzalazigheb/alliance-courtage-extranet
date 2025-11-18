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
import { formationsAPI, Formation } from '../api/formations';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { theme } from '../utils/theme';

export const FormationsScreen: React.FC = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    loadFormations();
  }, [selectedYear]);

  const loadFormations = async () => {
    try {
      setLoading(true);
      const data = await formationsAPI.getAll(selectedYear || undefined);
      setFormations(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les formations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFormations();
    setRefreshing(false);
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'approved':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.warning;
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Rejetée';
      default:
        return 'En attente';
    }
  };

  const renderFormation = ({ item }: { item: Formation }) => (
    <Card style={styles.formationCard}>
      <View style={styles.formationHeader}>
        <Text style={styles.formationTitle}>{item.nom_document}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.statut) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.statut)}</Text>
        </View>
      </View>
      <Text style={styles.formationInfo}>
        Date: {new Date(item.date_formation).toLocaleDateString('fr-FR')}
      </Text>
      <Text style={styles.formationInfo}>Heures: {item.heures}</Text>
      <Text style={styles.formationInfo}>
        Organisme: {item.delivre_par}
      </Text>
      <Text style={styles.formationInfo}>
        Catégories: {item.categories.join(', ')}
      </Text>
      {item.fileUrl && (
        <Button
          title="Télécharger"
          variant="outline"
          onPress={() => {
            // TODO: Implement file download
            Alert.alert('Téléchargement', 'Fonctionnalité à implémenter');
          }}
          style={styles.downloadButton}
        />
      )}
    </Card>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedYear === null && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedYear(null)}
        >
          <Text
            style={[
              styles.filterText,
              selectedYear === null && styles.filterTextActive,
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>
        {[2024, 2023, 2022].map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.filterButton,
              selectedYear === year && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Text
              style={[
                styles.filterText,
                selectedYear === year && styles.filterTextActive,
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={formations}
        renderItem={renderFormation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune formation trouvée</Text>
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
  filterContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    padding: theme.spacing.md,
  },
  formationCard: {
    marginBottom: theme.spacing.md,
  },
  formationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  formationTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formationInfo: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
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




