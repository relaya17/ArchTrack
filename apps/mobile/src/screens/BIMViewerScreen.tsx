/**
 * BIM Viewer Screen
 * Construction Master App - Mobile BIM Viewer
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  IconButton,
  ProgressBar,
  List,
  Chip,
  FAB,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

const { width, height } = Dimensions.get('window');

interface BIMFile {
  id: string;
  name: string;
  type: 'revit' | 'autocad' | 'ifc' | 'sketchup' | 'archicad';
  size: number;
  projectId: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata: {
    version: string;
    author: string;
    units: string;
    boundingBox: {
      minX: number;
      minY: number;
      minZ: number;
      maxX: number;
      maxY: number;
      maxZ: number;
    };
    elements: any[];
    materials: any[];
    layers: any[];
  };
}

type BIMViewerScreenProps = {
  navigation: { goBack: () => void };
  route: { params?: { fileId?: string } };
};

const BIMViewerScreen: React.FC<BIMViewerScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { isOfflineMode } = useOffline();
  
  const [bimFile, setBimFile] = useState<BIMFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{ name?: string; type?: string; category?: string } | null>(null);
  const [viewerConfig, setViewerConfig] = useState({
    backgroundColor: '#f0f0f0',
    gridVisible: true,
    axesVisible: true,
    shadows: true,
    lighting: 'directional',
  });

  const fileId = route.params?.fileId;

  useEffect(() => {
    loadBIMFile();
  }, [fileId]);

  const loadBIMFile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/bim/file/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBimFile(data.data);
        setViewerReady(true);
      } else {
        Alert.alert('שגיאה', 'שגיאה בטעינת קובץ BIM');
      }
    } catch (error) {
      console.error('Error loading BIM file:', error);
      Alert.alert('שגיאה', 'שגיאה בטעינת קובץ BIM');
    } finally {
      setLoading(false);
    }
  };

  const handleElementSelect = (element: { name?: string; type?: string; category?: string }) => {
    setSelectedElement(element);
  };

  const handleViewerConfigChange = (config: Partial<typeof viewerConfig>) => {
    setViewerConfig({ ...viewerConfig, ...config });
  };

  const handleExport = async (format: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/bim/export/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'הקובץ יוצא בהצלחה');
      } else {
        Alert.alert('שגיאה', 'שגיאה בייצוא הקובץ');
      }
    } catch (error) {
      console.error('Error exporting file:', error);
      Alert.alert('שגיאה', 'שגיאה בייצוא הקובץ');
    }
  };

  const handleShare = () => {
    Alert.alert('שיתוף', 'פונקציונליות שיתוף תתווסף בקרוב');
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'revit': return 'cube';
      case 'autocad': return 'vector-square';
      case 'ifc': return 'file-outline';
      case 'sketchup': return 'cube-outline';
      case 'archicad': return 'home';
      default: return 'file';
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'revit': return '#FF6B6B';
      case 'autocad': return '#4ECDC4';
      case 'ifc': return '#45B7D1';
      case 'sketchup': return '#96CEB4';
      case 'archicad': return '#FFEAA7';
      default: return '#DDA0DD';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ProgressBar indeterminate color="#3B82F6" />
        <Title style={styles.loadingText}>טוען קובץ BIM...</Title>
      </View>
    );
  }

  if (!bimFile) {
    return (
      <View style={styles.errorContainer}>
        <Title>קובץ BIM לא נמצא</Title>
        <Button onPress={() => navigation.goBack()}>חזור</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        />
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>{bimFile.name}</Title>
          <Chip
            style={[styles.typeChip, { backgroundColor: getFileTypeColor(bimFile.type) }]}
            textStyle={styles.typeText}
          >
            {bimFile.type.toUpperCase()}
          </Chip>
        </View>
        <IconButton
          icon="share"
          onPress={handleShare}
          style={styles.headerButton}
        />
      </View>

      {/* Viewer Container */}
      <View style={styles.viewerContainer}>
        {viewerReady ? (
          <View style={styles.viewer}>
            {/* This would be replaced with actual 3D viewer component */}
            <View style={styles.placeholderViewer}>
              <Text style={styles.placeholderText}>3D Viewer</Text>
              <Text style={styles.placeholderSubtext}>
                {bimFile.metadata.elements.length} elements
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.loadingViewer}>
            <ProgressBar indeterminate color="#3B82F6" />
            <Text style={styles.loadingText}>טוען צופה...</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Card style={styles.controlCard}>
          <Card.Content>
            <Title>בקרות צופה</Title>
            <View style={styles.controlRow}>
              <Button
                mode={viewerConfig.gridVisible ? 'contained' : 'outlined'}
                onPress={() => handleViewerConfigChange({ gridVisible: !viewerConfig.gridVisible })}
                icon="grid"
                style={styles.controlButton}
              >
                רשת
              </Button>
              <Button
                mode={viewerConfig.axesVisible ? 'contained' : 'outlined'}
                onPress={() => handleViewerConfigChange({ axesVisible: !viewerConfig.axesVisible })}
                icon="axis-arrow"
                style={styles.controlButton}
              >
                צירים
              </Button>
              <Button
                mode={viewerConfig.shadows ? 'contained' : 'outlined'}
                onPress={() => handleViewerConfigChange({ shadows: !viewerConfig.shadows })}
                icon="weather-sunny"
                style={styles.controlButton}
              >
                צללים
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* File Info */}
      <View style={styles.infoContainer}>
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title>פרטי קובץ</Title>
            <List.Item
              title="גודל"
              description={`${(bimFile.size / 1024 / 1024).toFixed(2)} MB`}
              left={props => <List.Icon {...props} icon="file" />}
            />
            <List.Item
              title="גרסה"
              description={bimFile.metadata.version}
              left={props => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="מחבר"
              description={bimFile.metadata.author}
              left={props => <List.Icon {...props} icon="account" />}
            />
            <List.Item
              title="יחידות"
              description={bimFile.metadata.units}
              left={props => <List.Icon {...props} icon="ruler" />}
            />
            <List.Item
              title="אלמנטים"
              description={bimFile.metadata.elements.length.toString()}
              left={props => <List.Icon {...props} icon="cube" />}
            />
            <List.Item
              title="חומרים"
              description={bimFile.metadata.materials.length.toString()}
              left={props => <List.Icon {...props} icon="palette" />}
            />
            <List.Item
              title="שכבות"
              description={bimFile.metadata.layers.length.toString()}
              left={props => <List.Icon {...props} icon="layers" />}
            />
          </Card.Content>
        </Card>
      </View>

      {/* Selected Element Info */}
      {selectedElement && (
        <View style={styles.elementInfo}>
          <Card style={styles.elementCard}>
            <Card.Content>
              <Title>אלמנט נבחר</Title>
              <List.Item
                title="שם"
                description={selectedElement.name}
                left={props => <List.Icon {...props} icon="tag" />}
              />
              <List.Item
                title="סוג"
                description={selectedElement.type}
                left={props => <List.Icon {...props} icon="shape" />}
              />
              <List.Item
                title="קטגוריה"
                description={selectedElement.category}
                left={props => <List.Icon {...props} icon="folder" />}
              />
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Offline Mode Indicator */}
      {isOfflineMode && (
        <View style={styles.offlineIndicator}>
          <Chip>מצב לא מקוון</Chip>
        </View>
      )}

      {/* FABs */}
      <FAB
        icon="download"
        style={styles.fab}
        onPress={() => handleExport('gltf')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    margin: 0,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  typeChip: {
    marginTop: 4,
  },
  typeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewer: {
    flex: 1,
  },
  placeholderViewer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholderSubtext: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
  },
  loadingViewer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  controls: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
  },
  controlCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.4,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  elementInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  elementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default BIMViewerScreen;
