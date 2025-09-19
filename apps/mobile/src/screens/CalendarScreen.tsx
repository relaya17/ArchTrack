import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Reminder {
  id: string;
  title: string;
  time: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const reminders: Reminder[] = [
    {
      id: '1',
      title: 'פגישה עם הלקוח - מגדל יוקרה',
      time: '10:00',
      date: '2024-01-15',
      priority: 'high',
      completed: false
    },
    {
      id: '2',
      title: 'בדיקת חומרים - בית פרטי',
      time: '14:30',
      date: '2024-01-15',
      priority: 'medium',
      completed: false
    },
    {
      id: '3',
      title: 'דוח שבועי - פרויקטים',
      time: '16:00',
      date: '2024-01-16',
      priority: 'low',
      completed: true
    }
  ];

  const todayReminders = reminders.filter(reminder => reminder.date === selectedDate);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'גבוהה';
      case 'medium': return 'בינונית';
      case 'low': return 'נמוכה';
      default: return 'לא ידוע';
    }
  };

  const toggleReminder = (id: string) => {
    console.log('Toggle reminder', id);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Calendar Header */}
        <Card style={styles.calendarCard}>
          <Card.Content>
            <Title style={styles.calendarTitle}>לוח שנה</Title>
            <Paragraph style={styles.selectedDate}>
              {new Date(selectedDate).toLocaleDateString('he-IL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Paragraph>
            <Button 
              mode="outlined" 
              onPress={() => console.log('Change Date')}
              style={styles.dateButton}
            >
              שנה תאריך
            </Button>
          </Card.Content>
        </Card>

        {/* Today's Reminders */}
        <View style={styles.remindersContainer}>
          <Title style={styles.sectionTitle}>תזכורות להיום</Title>
          {todayReminders.length > 0 ? (
            todayReminders.map((reminder) => (
              <Card key={reminder.id} style={styles.reminderCard}>
                <Card.Content>
                  <View style={styles.reminderHeader}>
                    <View style={styles.reminderInfo}>
                      <Title style={[
                        styles.reminderTitle,
                        reminder.completed && styles.completedText
                      ]}>
                        {reminder.title}
                      </Title>
                      <Paragraph style={styles.reminderTime}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        {' '}{reminder.time}
                      </Paragraph>
                    </View>
                    <View style={styles.reminderActions}>
                      <Chip 
                        style={[styles.priorityChip, { backgroundColor: getPriorityColor(reminder.priority) }]}
                        textStyle={styles.priorityChipText}
                      >
                        {getPriorityText(reminder.priority)}
                      </Chip>
                      <Button
                        mode="text"
                        onPress={() => toggleReminder(reminder.id)}
                        style={styles.toggleButton}
                      >
                        <Ionicons 
                          name={reminder.completed ? "checkmark-circle" : "ellipse-outline"} 
                          size={24} 
                          color={reminder.completed ? "#10B981" : "#6B7280"} 
                        />
                      </Button>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyContent}>
                  <Ionicons name="calendar-outline" size={48} color="#6B7280" />
                  <Title style={styles.emptyTitle}>אין תזכורות להיום</Title>
                  <Paragraph style={styles.emptyText}>
                    תוכל להוסיף תזכורות חדשות באמצעות הכפתור למטה
                  </Paragraph>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Title style={styles.sectionTitle}>פעולות מהירות</Title>
          <View style={styles.actionsGrid}>
            <Button
              mode="contained"
              onPress={() => console.log('Add Reminder')}
              style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
              contentStyle={styles.actionButtonContent}
            >
              <Ionicons name="add" size={20} color="white" />
              <Paragraph style={styles.actionText}>הוסף תזכורת</Paragraph>
            </Button>
            <Button
              mode="contained"
              onPress={() => console.log('View All')}
              style={[styles.actionButton, { backgroundColor: '#10B981' }]}
              contentStyle={styles.actionButtonContent}
            >
              <Ionicons name="list" size={20} color="white" />
              <Paragraph style={styles.actionText}>כל התזכורות</Paragraph>
            </Button>
          </View>
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => console.log('Add Reminder')}
        label="תזכורת חדשה"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  calendarCard: {
    margin: 16,
    elevation: 4,
  },
  calendarTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectedDate: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    marginVertical: 8,
  },
  dateButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  remindersContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  reminderCard: {
    marginBottom: 12,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  reminderTime: {
    color: '#6B7280',
    fontSize: 14,
  },
  reminderActions: {
    alignItems: 'flex-end',
  },
  priorityChip: {
    height: 24,
    marginBottom: 8,
  },
  priorityChipText: {
    color: 'white',
    fontSize: 10,
  },
  toggleButton: {
    minWidth: 40,
  },
  emptyCard: {
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 8,
  },
  quickActionsContainer: {
    margin: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
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
  actionText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
});

