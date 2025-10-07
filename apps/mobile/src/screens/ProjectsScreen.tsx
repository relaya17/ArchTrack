import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Searchbar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Project {
  id: string;
  name: string;
  location: string;
  progress: number;
  endDate: string;
  status: 'active' | 'completed' | 'on-hold';
}

export default function ProjectsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const projects: Project[] = [
    {
      id: '1',
      name: 'מגדל יוקרה - תל אביב',
      location: 'תל אביב, ישראל',
      progress: 75,
      endDate: '15/06/2024',
      status: 'active'
    },
    {
      id: '2',
      name: 'בית פרטי - רמת גן',
      location: 'רמת גן, ישראל',
      progress: 100,
      endDate: '01/03/2024',
      status: 'completed'
    },
    {
      id: '3',
      name: 'מרכז מסחרי - חיפה',
      location: 'חיפה, ישראל',
      progress: 45,
      endDate: '30/09/2024',
      status: 'active'
    },
    {
      id: '4',
      name: 'משרדים - ירושלים',
      location: 'ירושלים, ישראל',
      progress: 0,
      endDate: '15/12/2024',
      status: 'on-hold'
    }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#3B82F6';
      case 'on-hold': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'completed': return 'הושלם';
      case 'on-hold': return 'מושהה';
      default: return 'לא ידוע';
    }
  };

  const renderProject = ({ item }: { item: Project }) => (
    <Card style={styles.projectCard}>
      <Card.Content>
        <View style={styles.projectHeader}>
          <Title style={styles.projectName}>{item.name}</Title>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusChipText}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>
        <Paragraph style={styles.projectLocation}>
          <Ionicons name="location-outline" size={16} color="#6B7280" /> {item.location}
        </Paragraph>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
        <View style={styles.projectFooter}>
          <Text style={styles.endDate}>תאריך סיום: {item.endDate}</Text>
          <Button 
            mode="outlined" 
            compact
            onPress={() => console.log('View Project', item.id)}
          >
            צפה בפרויקט
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="חיפוש פרויקטים..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterContainer}>
          <Chip
            selected={selectedStatus === 'all'}
            onPress={() => setSelectedStatus('all')}
            style={styles.filterChip}
          >
            הכל
          </Chip>
          <Chip
            selected={selectedStatus === 'active'}
            onPress={() => setSelectedStatus('active')}
            style={styles.filterChip}
          >
            פעילים
          </Chip>
          <Chip
            selected={selectedStatus === 'completed'}
            onPress={() => setSelectedStatus('completed')}
            style={styles.filterChip}
          >
            הושלמו
          </Chip>
        </View>
      </View>

      <FlatList
        data={filteredProjects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => console.log('Add Project')}
        label="פרויקט חדש"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  projectCard: {
    marginBottom: 16,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
  },
  projectLocation: {
    color: '#6B7280',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
});

