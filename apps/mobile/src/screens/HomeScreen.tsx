import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const quickActions = [
    {
      title: 'פרויקט חדש',
      icon: 'add-circle',
      color: '#3B82F6',
      onPress: () => console.log('New Project')
    },
    {
      title: 'צילום תמונה',
      icon: 'camera',
      color: '#10B981',
      onPress: () => console.log('Take Photo')
    },
    {
      title: 'סריקת QR',
      icon: 'qr-code',
      color: '#F59E0B',
      onPress: () => console.log('Scan QR')
    },
    {
      title: 'מיקום נוכחי',
      icon: 'location',
      color: '#EF4444',
      onPress: () => console.log('Current Location')
    }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title style={styles.welcomeTitle}>ברוכים הבאים ל-ProBuilder</Title>
          <Paragraph style={styles.welcomeText}>
            מערכת ניהול פרויקטי בנייה מתקדמת
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>פעולות מהירות</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <Surface key={index} style={styles.actionCard}>
              <Button
                mode="contained"
                onPress={action.onPress}
                style={[styles.actionButton, { backgroundColor: action.color }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={styles.actionButtonLabel}
              >
                <View style={styles.actionContent}>
                  <Ionicons name={action.icon as any} size={24} color="white" />
                  <Text style={styles.actionText}>{action.title}</Text>
                </View>
              </Button>
            </Surface>
          ))}
        </View>
      </View>

      {/* Recent Projects */}
      <View style={styles.recentProjectsContainer}>
        <Text style={styles.sectionTitle}>פרויקטים אחרונים</Text>
        <Card style={styles.projectCard}>
          <Card.Content>
            <Title>מגדל יוקרה - תל אביב</Title>
            <Paragraph>פרויקט בנייה של 20 קומות</Paragraph>
            <View style={styles.projectStats}>
              <Text style={styles.statText}>התקדמות: 75%</Text>
              <Text style={styles.statText}>תאריך סיום: 15/06/2024</Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>סטטיסטיקות</Text>
        <View style={styles.statsGrid}>
          <Surface style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>פרויקטים פעילים</Text>
          </Surface>
          <Surface style={styles.statCard}>
            <Text style={styles.statNumber}>₪2.5M</Text>
            <Text style={styles.statLabel}>ערך כולל</Text>
          </Surface>
          <Surface style={styles.statCard}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>שביעות רצון</Text>
          </Surface>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  welcomeCard: {
    margin: 16,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
  },
  welcomeText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
  },
  quickActionsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 48) / 2,
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  actionButton: {
    borderRadius: 8,
  },
  actionButtonContent: {
    height: 80,
  },
  actionButtonLabel: {
    fontSize: 12,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  recentProjectsContainer: {
    margin: 16,
  },
  projectCard: {
    elevation: 2,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsContainer: {
    margin: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    margin: 4,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

