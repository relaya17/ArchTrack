/**
 * Import/Export Service
 * Construction Master App - File Import/Export Service
 */

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Sheet, { ISheet, ICell } from '../models/Sheet'
import Project from '../models/Project'
import logger from '../config/logger'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
    }
}

interface ImportResult {
    success: boolean
    data?: any[][]
    error?: string
    warnings?: string[]
}

interface ExportOptions {
    format: 'xlsx' | 'csv' | 'pdf'
    includeFormulas?: boolean
    includeStyles?: boolean
    sheetName?: string
}

class ImportExportService {
    
    /**
     * Import data from Excel/CSV file
     */
    async importFromFile(filePath: string, fileType: 'xlsx' | 'csv'): Promise<ImportResult> {
        try {
            let workbook: XLSX.WorkBook
            
            if (fileType === 'xlsx') {
                workbook = XLSX.readFile(filePath)
            } else {
                // CSV
                const data = XLSX.readFile(filePath, { type: 'string' })
                workbook = XLSX.read(data, { type: 'string' })
            }

            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            
            if (!worksheet) {
                return {
                    success: false,
                    error: 'לא נמצא גיליון בקובץ'
                }
            }

            // Convert to JSON array
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '',
                raw: false
            }) as any[][]

            // Clean empty rows
            const cleanedData = jsonData.filter(row => 
                row.some(cell => cell !== '' && cell !== null && cell !== undefined)
            )

            return {
                success: true,
                data: cleanedData
            }

        } catch (error) {
            logger.error('Import error:', error)
            return {
                success: false,
                error: `שגיאה בייבוא קובץ: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`
            }
        }
    }

    /**
     * Convert sheet data to Excel format
     */
    async exportToExcel(sheet: ISheet, options: ExportOptions = { format: 'xlsx' }): Promise<Buffer> {
        try {
            // Create workbook
            const workbook = XLSX.utils.book_new()
            
            // Convert sheet cells to 2D array
            const data = this.convertCellsToArray(sheet, options)
            
            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(data)
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || sheet.name)
            
            // Generate buffer
            const buffer = XLSX.write(workbook, { 
                type: 'buffer', 
                bookType: 'xlsx',
                compression: true
            })
            
            return buffer

        } catch (error) {
            logger.error('Excel export error:', error)
            throw new Error(`שגיאה בייצוא Excel: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`)
        }
    }

    /**
     * Convert sheet data to CSV format
     */
    async exportToCSV(sheet: ISheet, options: ExportOptions = { format: 'csv' }): Promise<string> {
        try {
            // Convert sheet cells to 2D array
            const data = this.convertCellsToArray(sheet, options)
            
            // Convert to CSV
            const csv = data.map(row => 
                row.map(cell => {
                    // Escape commas and quotes
                    const cellStr = String(cell || '')
                    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                        return `"${cellStr.replace(/"/g, '""')}"`
                    }
                    return cellStr
                }).join(',')
            ).join('\n')
            
            return csv

        } catch (error) {
            logger.error('CSV export error:', error)
            throw new Error(`שגיאה בייצוא CSV: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`)
        }
    }

    /**
     * Convert sheet data to PDF format
     */
    async exportToPDF(sheet: ISheet, options: ExportOptions = { format: 'pdf' }): Promise<Buffer> {
        try {
            const doc = new jsPDF('l', 'mm', 'a4') // Landscape A4
            
            // Add title
            doc.setFontSize(16)
            doc.text(sheet.name, 14, 22)
            
            // Add project info
            const project = await Project.findById(sheet.projectId)
            if (project) {
                doc.setFontSize(10)
                doc.text(`פרויקט: ${project.name}`, 14, 30)
                doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, 14, 35)
            }
            
            // Convert sheet cells to 2D array
            const data = this.convertCellsToArray(sheet, options)
            
            // Limit data for PDF (first 20 rows)
            const limitedData = data.slice(0, 20)
            
            // Add table
            (doc as any).autoTable({
                startY: 45,
                head: [limitedData[0] || []], // First row as header
                body: limitedData.slice(1),
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: 45 }
            })
            
            // Add footer
            const pageCount = (doc as any).internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.text(`עמוד ${i} מתוך ${pageCount}`, 14, doc.internal.pageSize.height - 10)
            }
            
            return Buffer.from(doc.output('arraybuffer'))

        } catch (error) {
            logger.error('PDF export error:', error)
            throw new Error(`שגיאה בייצוא PDF: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`)
        }
    }

    /**
     * Convert sheet cells to 2D array
     */
    private convertCellsToArray(sheet: ISheet, options: ExportOptions): any[][] {
        const { rowCount, colCount } = sheet.metadata
        const data: any[][] = []
        
        // Initialize empty array
        for (let row = 0; row < rowCount; row++) {
            data[row] = []
            for (let col = 0; col < colCount; col++) {
                data[row][col] = ''
            }
        }
        
        // Fill with cell data
        sheet.cells.forEach(cell => {
            if (cell.row < rowCount && cell.col < colCount) {
                let value = cell.value
                
                // Handle formulas
                if (cell.formula && options.includeFormulas) {
                    value = cell.formula
                }
                
                // Handle different cell types
                switch (cell.type) {
                    case 'currency':
                        value = typeof value === 'number' ? `₪${value.toLocaleString()}` : value
                        break
                    case 'percentage':
                        value = typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value
                        break
                    case 'date':
                        if (value instanceof Date) {
                            value = value.toLocaleDateString('he-IL')
                        }
                        break
                }
                
                data[cell.row][cell.col] = value
            }
        })
        
        return data
    }

    /**
     * Import data to sheet
     */
    async importToSheet(sheetId: string, data: any[][], userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const sheet = await Sheet.findById(sheetId)
            if (!sheet) {
                return { success: false, message: 'גיליון לא נמצא' }
            }

            // Clear existing cells
            sheet.cells = []
            
            // Import new data
            data.forEach((row, rowIndex) => {
                row.forEach((cellValue, colIndex) => {
                    if (cellValue !== '' && cellValue !== null && cellValue !== undefined) {
                        const cell: ICell = {
                            row: rowIndex,
                            col: colIndex,
                            value: cellValue,
                            type: this.detectCellType(cellValue)
                        }
                        sheet.cells.push(cell)
                    }
                })
            })

            // Update metadata
            sheet.metadata.rowCount = Math.max(sheet.metadata.rowCount, data.length)
            sheet.metadata.colCount = Math.max(sheet.metadata.colCount, data[0]?.length || 0)
            sheet.metadata.lastModified = new Date()
            sheet.metadata.version += 1

            await sheet.save()

            logger.info(`Sheet ${sheetId} imported successfully by user ${userId}`)
            return { success: true, message: 'הגיליון יובא בהצלחה' }

        } catch (error) {
            logger.error('Import to sheet error:', error)
            return { success: false, message: 'שגיאה בייבוא הגיליון' }
        }
    }

    /**
     * Detect cell type based on value
     */
    private detectCellType(value: any): 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'formula' {
        if (typeof value === 'number') {
            return 'number'
        }
        
        if (typeof value === 'string') {
            // Check for currency
            if (value.includes('₪') || value.includes('$') || value.includes('€')) {
                return 'currency'
            }
            
            // Check for percentage
            if (value.includes('%')) {
                return 'percentage'
            }
            
            // Check for date
            if (this.isDateString(value)) {
                return 'date'
            }
            
            // Check for formula
            if (value.startsWith('=')) {
                return 'formula'
            }
        }
        
        return 'text'
    }

    /**
     * Check if string is a date
     */
    private isDateString(value: string): boolean {
        const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{4}-\d{1,2}-\d{1,2}$/
        return dateRegex.test(value)
    }
}

export default new ImportExportService()
