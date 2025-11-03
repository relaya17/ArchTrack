import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Animated } from 'react-native';
import { Card, Title, Button, FAB, IconButton, SegmentedButtons } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Point {
  x: number;
  y: number;
}

interface Shape {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'freehand';
  startPoint: Point;
  endPoint: Point;
  color: string;
  strokeWidth: number;
  points?: Point[];
}

export default function DrawingScreen() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawingTool, setDrawingTool] = useState('freehand');
  const [showGrid, setShowGrid] = useState(true);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsDrawing(true);
      const startPoint = {
        x: evt.nativeEvent.locationX,
        y: evt.nativeEvent.locationY,
      };
      
      const newShape: Shape = {
        id: Date.now().toString(),
        type: drawingTool as any,
        startPoint,
        endPoint: startPoint,
        color: strokeColor,
        strokeWidth,
        points: drawingTool === 'freehand' ? [startPoint] : undefined
      };
      
      setCurrentShape(newShape);
    },
    onPanResponderMove: (evt) => {
      if (isDrawing && currentShape) {
        const currentPoint = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
        
        if (drawingTool === 'freehand') {
          setCurrentShape(prev => prev ? {
            ...prev,
            points: [...(prev.points || []), currentPoint]
          } : null);
        } else {
          setCurrentShape(prev => prev ? {
            ...prev,
            endPoint: currentPoint
          } : null);
        }
      }
    },
    onPanResponderRelease: () => {
      if (isDrawing && currentShape) {
        setShapes(prev => [...prev, currentShape]);
        setCurrentShape(null);
        setIsDrawing(false);
      }
    },
  });

  const clearCanvas = () => {
    setShapes([]);
    setCurrentShape(null);
  };

  const undoLastShape = () => {
    setShapes(prev => prev.slice(0, -1));
  };

  const changeColor = (color: string) => {
    setStrokeColor(color);
  };

  const changeStrokeWidth = (width: number) => {
    setStrokeWidth(width);
  };

  const renderShape = (shape: Shape) => {
    switch (shape.type) {
      case 'line':
        return (
          <View
            key={shape.id}
            style={[
              styles.line,
              {
                left: Math.min(shape.startPoint.x, shape.endPoint.x),
                top: Math.min(shape.startPoint.y, shape.endPoint.y),
                width: Math.abs(shape.endPoint.x - shape.startPoint.x),
                height: Math.abs(shape.endPoint.y - shape.startPoint.y),
                borderColor: shape.color,
                borderWidth: shape.strokeWidth,
                transform: [
                  { rotate: `${Math.atan2(shape.endPoint.y - shape.startPoint.y, shape.endPoint.x - shape.startPoint.x)}rad` }
                ]
              }
            ]}
          />
        );
      
      case 'rectangle':
        return (
          <View
            key={shape.id}
            style={[
              styles.rectangle,
              {
                left: Math.min(shape.startPoint.x, shape.endPoint.x),
                top: Math.min(shape.startPoint.y, shape.endPoint.y),
                width: Math.abs(shape.endPoint.x - shape.startPoint.x),
                height: Math.abs(shape.endPoint.y - shape.startPoint.y),
                borderColor: shape.color,
                borderWidth: shape.strokeWidth,
              }
            ]}
          />
        );
      
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(shape.endPoint.x - shape.startPoint.x, 2) + 
          Math.pow(shape.endPoint.y - shape.startPoint.y, 2)
        );
        return (
          <View
            key={shape.id}
            style={[
              styles.circle,
              {
                left: shape.startPoint.x - radius,
                top: shape.startPoint.y - radius,
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                borderColor: shape.color,
                borderWidth: shape.strokeWidth,
              }
            ]}
          />
        );
      
      case 'freehand':
        if (!shape.points || shape.points.length < 2) return null;
        return (
          <View key={shape.id} style={styles.freehandContainer}>
            {shape.points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = shape.points![index - 1];
              return (
                <View
                  key={`${shape.id}-${index}`}
                  style={[
                    styles.freehandLine,
                    {
                      left: Math.min(point.x, prevPoint.x),
                      top: Math.min(point.y, prevPoint.y),
                      width: Math.abs(point.x - prevPoint.x),
                      height: Math.abs(point.y - prevPoint.y),
                      backgroundColor: shape.color,
                      transform: [
                        { rotate: `${Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x)}rad` }
                      ]
                    }
                  ]}
                />
              );
            })}
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderGrid = () => {
    if (!showGrid) return null;
    
    const gridSize = 20;
    const gridLines = [];
    
    for (let i = 0; i < width; i += gridSize) {
      gridLines.push(
        <View
          key={`v-${i}`}
          style={[
            styles.gridLine,
            {
              left: i,
              width: 1,
              height: '100%',
            }
          ]}
        />
      );
    }
    
    for (let i = 0; i < height; i += gridSize) {
      gridLines.push(
        <View
          key={`h-${i}`}
          style={[
            styles.gridLine,
            {
              top: i,
              height: 1,
              width: '100%',
            }
          ]}
        />
      );
    }
    
    return <View style={styles.gridContainer}>{gridLines}</View>;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Title style={styles.headerTitle}>לוח ציור</Title>
          <View style={styles.headerActions}>
            <IconButton
              icon="undo"
              size={24}
              onPress={undoLastShape}
              iconColor="#3B82F6"
            />
            <IconButton
              icon="delete"
              size={24}
              onPress={clearCanvas}
              iconColor="#EF4444"
            />
            <IconButton
              icon={showGrid ? "grid" : "grid-off"}
              size={24}
              onPress={() => setShowGrid(!showGrid)}
              iconColor="#10B981"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Drawing Tools */}
      <Card style={styles.toolsCard}>
        <Card.Content>
          <Title style={styles.toolsTitle}>כלי ציור</Title>
          <SegmentedButtons
            value={drawingTool}
            onValueChange={setDrawingTool}
            buttons={[
              { value: 'freehand', label: 'יד חופשית', icon: 'pencil' },
              { value: 'line', label: 'קו', icon: 'minus' },
              { value: 'rectangle', label: 'מלבן', icon: 'square-outline' },
              { value: 'circle', label: 'עיגול', icon: 'radio-button-unchecked' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Color Palette */}
      <Card style={styles.paletteCard}>
        <Card.Content>
          <Title style={styles.paletteTitle}>צבעים</Title>
          <View style={styles.colorPalette}>
            {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'].map((color) => (
              <Button
                key={color}
                mode={strokeColor === color ? 'contained' : 'outlined'}
                onPress={() => changeColor(color)}
                style={[styles.colorButton, { backgroundColor: strokeColor === color ? color : 'transparent' }]}
                contentStyle={styles.colorButtonContent}
              >
                <View style={[styles.colorDot, { backgroundColor: color }]} />
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Stroke Width */}
      <Card style={styles.strokeCard}>
        <Card.Content>
          <View style={styles.strokeWidthContainer}>
            <Title style={styles.strokeTitle}>עובי הקו:</Title>
            <View style={styles.strokeButtons}>
              {[1, 3, 5, 8].map((width) => (
                <Button
                  key={width}
                  mode={strokeWidth === width ? 'contained' : 'outlined'}
                  onPress={() => changeStrokeWidth(width)}
                  style={styles.strokeButton}
                >
                  {width}px
                </Button>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Drawing Canvas */}
      <Card style={styles.canvasCard}>
        <View style={styles.canvas} {...panResponder.panHandlers}>
          {renderGrid()}
          {shapes.map(shape => renderShape(shape))}
          {currentShape && renderShape(currentShape)}
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => console.log('Save Drawing')}
          style={[styles.actionButton, { backgroundColor: '#10B981' }]}
          contentStyle={styles.actionButtonContent}
        >
          <Ionicons name="save" size={20} color="white" />
          <Title style={styles.actionButtonText}>שמור</Title>
        </Button>
        <Button
          mode="contained"
          onPress={() => console.log('Share Drawing')}
          style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
          contentStyle={styles.actionButtonContent}
        >
          <Ionicons name="share" size={20} color="white" />
          <Title style={styles.actionButtonText}>שתף</Title>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
  },
  toolsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  toolsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  paletteCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  paletteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  colorPalette: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  colorButton: {
    margin: 2,
    borderRadius: 20,
  },
  colorButtonContent: {
    width: 35,
    height: 35,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  strokeCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  strokeWidthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strokeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  strokeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  strokeButton: {
    minWidth: 50,
  },
  canvasCard: {
    flex: 1,
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  canvas: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#E5E7EB',
    opacity: 0.3,
  },
  line: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  rectangle: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  freehandContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  freehandLine: {
    position: 'absolute',
    height: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
