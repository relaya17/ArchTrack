/**
 * Project Detail Screen
 * Construction Master App - Mobile Project Details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ProgressBar,
  List,
  IconButton,
  FAB,
  Badge,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

const { width } = Dimensions.get('window');

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string;
  ownerId: string;
  assignedUsers: string[];
  sheets: any[];
  files: any[];
  lastUpdated: string;
}

const ProjectDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { isOfflineMode, syncData } = useOffline();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const projectId = route.params?.projectId;

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.data);
      } else {
        Alert.alert('שגיאה', 'שגיאה בטעינת הפרויקט');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('שגיאה', 'שגיאה בטעינת הפרויקט');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProject();
    setRefreshing(false);
  };

  const handleEditProject = () => {
    navigation.navigate('EditProject', { projectId });
  };

  const handleViewSheets = () => {
    navigation.navigate('ProjectSheets', { projectId });
  };

  const handleViewFiles = () => {
    navigation.navigate('ProjectFiles', { projectId });
  };

  const handleViewAnalytics = () => {
    navigation.navigate('ProjectAnalytics', { projectId });
  };

  const handleShareProject = () => {
    // Implement share functionality
    Alert.alert('שיתוף', 'פונקציונליות שיתוף תתווסף בקרוב');
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'מחיקת פרויקט',
      'האם אתה בטוח שברצונך למחוק את הפרויקט?',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: confirmDeleteProject },
      ]
    );
  };

  const confirmDeleteProject = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'הפרויקט נמחק בהצלחה');
        navigation.goBack();
      } else {
        Alert.alert('שגיאה', 'שגיאה במחיקת הפרויקט');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      Alert.alert('שגיאה', 'שגיאה במחיקת הפרויקט');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'on_hold': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'completed': return 'הושלם';
      case 'on_hold': return 'מושהה';
      case 'cancelled': return 'בוטל';
      default: return 'לא ידוע';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Title>פרויקט לא נמצא</Title>
        <Button onPress={() => navigation.goBack()}>חזור</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Project Header */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Title style={styles.title}>{project.name}</Title>
                <Chip
                  style={[styles.statusChip, { backgroundColor: getStatusColor(project.status) }]}
                  textStyle={styles.statusText}
                >
                  {getStatusText(project.status)}
                </Chip>
              </View>
              <IconButton
                icon="share"
                onPress={handleShareProject}
                style={styles.headerButton}
              />
            </View>
            <Paragraph style={styles.description}>{project.description}</Paragraph>
          </Card.Content>
        </Card>

        {/* Progress Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>התקדמות פרויקט</Title>
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={project.progress / 100}
                color="#3B82F6"
                style={styles.progressBar}
              />
              <Paragraph style={styles.progressText}>
                {project.progress}% הושלם
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Budget Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>תקציב</Title>
            <View style={styles.budgetContainer}>
              <View style={styles.budgetItem}>
                <Paragraph>תקציב כולל</Paragraph>
                <Title>₪{project.budget.toLocaleString()}</Title>
              </View>
              <View style={styles.budgetItem}>
                <Paragraph>הוצא עד כה</Paragraph>
                <Title>₪{project.spent.toLocaleString()}</Title>
              </View>
              <View style={styles.budgetItem}>
                <Paragraph>יתרה</Paragraph>
                <Title style={styles.remainingBudget}>
                  ₪{(project.budget - project.spent).toLocaleString()}
                </Title>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Timeline Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>לוח זמנים</Title>
            <List.Item
              title="תאריך התחלה"
              description={new Date(project.startDate).toLocaleDateString('he-IL')}
              left={props => <List.Icon {...props} icon="calendar-start" />}
            />
            <List.Item
              title="תאריך סיום"
              description={new Date(project.endDate).toLocaleDateString('he-IL')}
              left={props => <List.Icon {...props} icon="calendar-end" />}
            />
          </Card.Content>
        </Card>

        {/* Team Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>צוות</Title>
            <List.Item
              title="מספר משתמשים"
              description={project.assignedUsers.length.toString()}
              left={props => <List.Icon {...props} icon="account-group" />}
            />
          </Card.Content>
        </Card>

        {/* Content Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>תוכן</Title>
            <View style={styles.contentContainer}>
              <Button
                mode="outlined"
                onPress={handleViewSheets}
                style={styles.contentButton}
                icon="table"
              >
                גיליונות ({project.sheets.length})
              </Button>
              <Button
                mode="outlined"
                onPress={handleViewFiles}
                style={styles.contentButton}
                icon="file"
              >
                קבצים ({project.files.length})
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Actions Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>פעולות</Title>
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                onPress={handleEditProject}
                style={styles.actionButton}
                icon="pencil"
              >
                ערוך
              </Button>
              <Button
                mode="outlined"
                onPress={handleViewAnalytics}
                style={styles.actionButton}
                icon="chart-line"
              >
                אנליטיקס
              </Button>
              <Button
                mode="outlined"
                onPress={handleDeleteProject}
                style={[styles.actionButton, styles.deleteButton]}
                icon="delete"
                buttonColor="#F44336"
              >
                מחק
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Offline Mode Indicator */}
      {isOfflineMode && (
        <View style={styles.offlineIndicator}>
          <Badge>מצב לא מקוון</Badge>
        </View>
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSheet', { projectId })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerButton: {
    margin: 0,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  budgetItem: {
    alignItems: 'center',
    flex: 1,
  },
  remainingBudget: {
    color: project && project.budget - project.spent >= 0 ? '#4CAF50' : '#F44336',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  contentButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});

export default ProjectDetailScreen;
