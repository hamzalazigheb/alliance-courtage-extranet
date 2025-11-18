import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from '../components/Card';
import { simulatorsAPI } from '../api/simulators';
import { theme } from '../utils/theme';

export const SimulatorsScreen: React.FC = () => {
  const [activeSimulator, setActiveSimulator] = useState<string | null>(null);

  const handleOpenSimulator = async (simulatorType: string) => {
    try {
      await simulatorsAPI.logUsage(simulatorType, null, 'Accès au simulateur');
      setActiveSimulator(simulatorType);
    } catch (error) {
      console.error('Error logging simulator access:', error);
      setActiveSimulator(simulatorType);
    }
  };

  const simulators = [
    {
      id: 'ir',
      title: 'Simulation IR',
      description: 'Calcul de l\'impôt sur le revenu',
      icon: '📊',
    },
    {
      id: 'ifi',
      title: 'Simulation IFI',
      description: 'Impôt sur la fortune immobilière',
      icon: '🏠',
    },
    {
      id: 'succession',
      title: 'Simulation Succession',
      description: 'Calcul des droits de succession',
      icon: '👨‍👩‍👧‍👦',
    },
    {
      id: 'placement',
      title: 'Simulation Placement',
      description: 'Calcul de rendement de placement',
      icon: '💰',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Simulateurs</Text>
        <Text style={styles.subtitle}>
          Utilisez nos simulateurs pour calculer vos impôts et placements
        </Text>

        {simulators.map((simulator) => (
          <Card
            key={simulator.id}
            style={styles.simulatorCard}
            onPress={() => handleOpenSimulator(simulator.id)}
          >
            <View style={styles.simulatorContent}>
              <Text style={styles.simulatorIcon}>{simulator.icon}</Text>
              <View style={styles.simulatorInfo}>
                <Text style={styles.simulatorTitle}>{simulator.title}</Text>
                <Text style={styles.simulatorDescription}>
                  {simulator.description}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </Card>
        ))}

        {activeSimulator && (
          <View style={styles.modal}>
            <Card style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {simulators.find((s) => s.id === activeSimulator)?.title}
              </Text>
              <Text style={styles.modalText}>
                Fonctionnalité de simulation à implémenter
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setActiveSimulator(null)}
              >
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  simulatorCard: {
    marginBottom: theme.spacing.md,
  },
  simulatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simulatorIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  simulatorInfo: {
    flex: 1,
  },
  simulatorTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  simulatorDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.primary,
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
    marginBottom: theme.spacing.md,
  },
  modalText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});




