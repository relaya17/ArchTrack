import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, DataTable, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TableData {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export default function TableScreen() {
  const [tableData, setTableData] = useState<TableData[]>([
    {
      id: '1',
      item: 'בטון',
      quantity: 50,
      unit: 'מטר מעוקב',
      price: 350,
      total: 17500
    },
    {
      id: '2',
      item: 'פלדה',
      quantity: 2,
      unit: 'טון',
      price: 4500,
      total: 9000
    },
    {
      id: '3',
      item: 'לבנים',
      quantity: 1000,
      unit: 'יחידה',
      price: 2.5,
      total: 2500
    }
  ]);

  const addRow = () => {
    const newRow: TableData = {
      id: (tableData.length + 1).toString(),
      item: 'פריט חדש',
      quantity: 1,
      unit: 'יחידה',
      price: 0,
      total: 0
    };
    setTableData([...tableData, newRow]);
  };

  const deleteRow = (id: string) => {
    setTableData(tableData.filter(item => item.id !== id));
  };

  const totalAmount = tableData.reduce((sum, item) => sum + item.total, 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>טבלת BOQ</Title>
            <Paragraph style={styles.headerSubtitle}>
              Bill of Quantities - רשימת כמויות
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Table */}
        <Card style={styles.tableCard}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={styles.columnHeader}>פריט</DataTable.Title>
              <DataTable.Title numeric style={styles.columnHeader}>כמות</DataTable.Title>
              <DataTable.Title style={styles.columnHeader}>יחידה</DataTable.Title>
              <DataTable.Title numeric style={styles.columnHeader}>מחיר</DataTable.Title>
              <DataTable.Title numeric style={styles.columnHeader}>סה"כ</DataTable.Title>
              <DataTable.Title style={styles.columnHeader}>פעולות</DataTable.Title>
            </DataTable.Header>

            {tableData.map((row) => (
              <DataTable.Row key={row.id}>
                <DataTable.Cell style={styles.cell}>{row.item}</DataTable.Cell>
                <DataTable.Cell numeric style={styles.cell}>{row.quantity}</DataTable.Cell>
                <DataTable.Cell style={styles.cell}>{row.unit}</DataTable.Cell>
                <DataTable.Cell numeric style={styles.cell}>₪{row.price}</DataTable.Cell>
                <DataTable.Cell numeric style={styles.cell}>₪{row.total.toLocaleString()}</DataTable.Cell>
                <DataTable.Cell style={styles.cell}>
                  <Button
                    mode="text"
                    compact
                    onPress={() => deleteRow(row.id)}
                    textColor="#EF4444"
                  >
                    <Ionicons name="trash-outline" size={16} />
                  </Button>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card>

        {/* Total */}
        <Card style={styles.totalCard}>
          <Card.Content>
            <View style={styles.totalContainer}>
              <Title style={styles.totalLabel}>סה"כ:</Title>
              <Title style={styles.totalAmount}>₪{totalAmount.toLocaleString()}</Title>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={() => console.log('Export')}
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            contentStyle={styles.actionButtonContent}
          >
            <Ionicons name="download" size={20} color="white" />
            <Paragraph style={styles.actionText}>ייצא ל-Excel</Paragraph>
          </Button>
          <Button
            mode="contained"
            onPress={() => console.log('Import')}
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            contentStyle={styles.actionButtonContent}
          >
            <Ionicons name="upload" size={20} color="white" />
            <Paragraph style={styles.actionText}>ייבא מ-Excel</Paragraph>
          </Button>
        </View>

        {/* Quick Add */}
        <Card style={styles.quickAddCard}>
          <Card.Content>
            <Title style={styles.quickAddTitle}>הוספה מהירה</Title>
            <View style={styles.quickAddGrid}>
              <Button
                mode="outlined"
                onPress={() => console.log('Add Concrete')}
                style={styles.quickAddButton}
              >
                בטון
              </Button>
              <Button
                mode="outlined"
                onPress={() => console.log('Add Steel')}
                style={styles.quickAddButton}
              >
                פלדה
              </Button>
              <Button
                mode="outlined"
                onPress={() => console.log('Add Bricks')}
                style={styles.quickAddButton}
              >
                לבנים
              </Button>
              <Button
                mode="outlined"
                onPress={() => console.log('Add Labor')}
                style={styles.quickAddButton}
              >
                עבודה
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={addRow}
        label="שורה חדשה"
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
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 4,
  },
  tableCard: {
    margin: 16,
    elevation: 2,
  },
  columnHeader: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cell: {
    paddingVertical: 8,
  },
  totalCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#3B82F6',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalAmount: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsContainer: {
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
  actionText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  quickAddCard: {
    margin: 16,
    elevation: 2,
  },
  quickAddTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAddButton: {
    flex: 1,
    minWidth: (width - 80) / 2,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
});

