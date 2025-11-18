import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { authAPI } from '../api/auth';
import { theme } from '../utils/theme';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Succès', 'Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de modifier le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <Text style={styles.profileTitle}>Informations personnelles</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>Nom:</Text>
            <Text style={styles.profileValue}>
              {user?.nom} {user?.prenom}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>Email:</Text>
            <Text style={styles.profileValue}>{user?.email}</Text>
          </View>
          {user?.denomination_sociale && (
            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Dénomination sociale:</Text>
              <Text style={styles.profileValue}>{user.denomination_sociale}</Text>
            </View>
          )}
          {user?.telephone && (
            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Téléphone:</Text>
              <Text style={styles.profileValue}>{user.telephone}</Text>
            </View>
          )}
          {user?.code_postal && (
            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Code postal:</Text>
              <Text style={styles.profileValue}>{user.code_postal}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.passwordCard}>
          <Text style={styles.sectionTitle}>Modifier le mot de passe</Text>
          <Input
            label="Mot de passe actuel"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Input
            label="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button
            title="Modifier le mot de passe"
            onPress={handleChangePassword}
            loading={loading}
            style={styles.passwordButton}
          />
        </Card>

        <Button
          title="Déconnexion"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
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
  profileCard: {
    marginBottom: theme.spacing.md,
  },
  profileTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  profileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  profileLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  profileValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  passwordCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  passwordButton: {
    marginTop: theme.spacing.sm,
  },
  logoutButton: {
    marginTop: theme.spacing.md,
  },
});




