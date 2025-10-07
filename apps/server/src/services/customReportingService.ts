/**
 * Custom Reporting Service
 * Construction Master App - Advanced Report Generation
 */

import Project from '../models/Project'
import Sheet from '../models/Sheet'
import File from '../models/File'
import User from '../models/User'
import ChatMessage from '../models/ChatMessage'
import logger from '../config/logger'
import * as XLSX from 'xlsx'
import * as PDFDocument from 'pdfkit'

interface ReportTemplate {
    id: string
    name: string
    description: string
    category: 'project' | 'user' | 'financial' | 'performance' | 'compliance'
    sections: ReportSection[]
    filters: ReportFilter[]
    schedule?: {
        enabled: boolean
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
        time: string
        recipients: string[]
    }
    createdAt: Date
    updatedAt: Date
    createdBy: string
}

interface ReportSection {
    id: string
    name: string
    type: 'table' | 'chart' | 'summary' | 'kpi' | 'text'
    dataSource: string
    query: any
    format: {
        columns?: string[]
        chartType?: 'bar' | 'line' | 'pie' | 'scatter'
        aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
    }
    position: {
        row: number
        col: number
        width: number
        height: number
    }
}

interface ReportFilter {
    id: string
    name: string
    type: 'date' | 'select' | 'multiselect' | 'number' | 'text'
    field: string
    options?: string[]
    defaultValue?: any
    required: boolean
}

interface ReportData {
    template: ReportTemplate
    data: any
    generatedAt: Date
    generatedBy: string
    parameters: Record<string, any>
}

interface ReportGenerationOptions {
    format: 'pdf' | 'excel' | 'csv' | 'json'
    includeCharts: boolean
    includeImages: boolean
    language: 'he' | 'en'
    timezone: string
    customStyling?: {
        colors: string[]
        fonts: string[]
        logo?: string
    }
}

class CustomReportingService {
    private templates: Map<string, ReportTemplate> = new Map()
    private reports: Map<string, ReportData> = new Map()

    constructor() {
        this.initializeDefaultTemplates()
    }

    /**
     * Create a new report template
     */
    public async createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
        try {
            const newTemplate: ReportTemplate = {
                ...template,
                id: this.generateId(),
                createdAt: new Date(),
                updatedAt: new Date()
            }

            this.templates.set(newTemplate.id, newTemplate)
            
            logger.info(`Report template created: ${newTemplate.name}`)
            return newTemplate

        } catch (error) {
            logger.error('Error creating report template:', error)
            throw error
        }
    }

    /**
     * Update an existing report template
     */
    public async updateTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
        try {
            const template = this.templates.get(templateId)
            if (!template) {
                throw new Error('Template not found')
            }

            const updatedTemplate: ReportTemplate = {
                ...template,
                ...updates,
                updatedAt: new Date()
            }

            this.templates.set(templateId, updatedTemplate)
            
            logger.info(`Report template updated: ${updatedTemplate.name}`)
            return updatedTemplate

        } catch (error) {
            logger.error('Error updating report template:', error)
            throw error
        }
    }

    /**
     * Delete a report template
     */
    public async deleteTemplate(templateId: string): Promise<void> {
        try {
            if (!this.templates.has(templateId)) {
                throw new Error('Template not found')
            }

            this.templates.delete(templateId)
            logger.info(`Report template deleted: ${templateId}`)

        } catch (error) {
            logger.error('Error deleting report template:', error)
            throw error
        }
    }

    /**
     * Get all report templates
     */
    public async getTemplates(category?: string): Promise<ReportTemplate[]> {
        try {
            const templates = Array.from(this.templates.values())
            
            if (category) {
                return templates.filter(template => template.category === category)
            }
            
            return templates

        } catch (error) {
            logger.error('Error getting report templates:', error)
            throw error
        }
    }

    /**
     * Get a specific report template
     */
    public async getTemplate(templateId: string): Promise<ReportTemplate | null> {
        try {
            return this.templates.get(templateId) || null
        } catch (error) {
            logger.error('Error getting report template:', error)
            throw error
        }
    }

    /**
     * Generate a report from a template
     */
    public async generateReport(
        templateId: string, 
        parameters: Record<string, any> = {},
        options: ReportGenerationOptions = {
            format: 'pdf',
            includeCharts: true,
            includeImages: true,
            language: 'he',
            timezone: 'Asia/Jerusalem'
        }
    ): Promise<Buffer> {
        try {
            const template = this.templates.get(templateId)
            if (!template) {
                throw new Error('Template not found')
            }

            // Generate report data
            const reportData = await this.generateReportData(template, parameters)
            
            // Generate report based on format
            let buffer: Buffer
            switch (options.format) {
                case 'pdf':
                    buffer = await this.generatePDFReport(reportData, options)
                    break
                case 'excel':
                    buffer = await this.generateExcelReport(reportData, options)
                    break
                case 'csv':
                    buffer = await this.generateCSVReport(reportData, options)
                    break
                case 'json':
                    buffer = Buffer.from(JSON.stringify(reportData, null, 2))
                    break
                default:
                    throw new Error('Unsupported report format')
            }

            // Store report data
            this.reports.set(this.generateId(), {
                template,
                data: reportData,
                generatedAt: new Date(),
                generatedBy: parameters.userId || 'system',
                parameters
            })

            logger.info(`Report generated: ${template.name} (${options.format})`)
            return buffer

        } catch (error) {
            logger.error('Error generating report:', error)
            throw error
        }
    }

    /**
     * Generate report data from template
     */
    private async generateReportData(template: ReportTemplate, parameters: Record<string, any>): Promise<any> {
        const reportData: any = {
            template: {
                id: template.id,
                name: template.name,
                description: template.description
            },
            generatedAt: new Date(),
            parameters,
            sections: []
        }

        // Process each section
        for (const section of template.sections) {
            try {
                const sectionData = await this.processSection(section, parameters)
                reportData.sections.push({
                    id: section.id,
                    name: section.name,
                    type: section.type,
                    data: sectionData
                })
            } catch (error) {
                logger.error(`Error processing section ${section.id}:`, error)
                reportData.sections.push({
                    id: section.id,
                    name: section.name,
                    type: section.type,
                    data: null,
                    error: error.message
                })
            }
        }

        return reportData
    }

    /**
     * Process a report section
     */
    private async processSection(section: ReportSection, parameters: Record<string, any>): Promise<any> {
        switch (section.dataSource) {
            case 'projects':
                return await this.getProjectsData(section, parameters)
            case 'users':
                return await this.getUsersData(section, parameters)
            case 'sheets':
                return await this.getSheetsData(section, parameters)
            case 'files':
                return await this.getFilesData(section, parameters)
            case 'messages':
                return await this.getMessagesData(section, parameters)
            case 'analytics':
                return await this.getAnalyticsData(section, parameters)
            default:
                throw new Error(`Unknown data source: ${section.dataSource}`)
        }
    }

    /**
     * Get projects data for report
     */
    private async getProjectsData(section: ReportSection, parameters: Record<string, any>): Promise<any> {
        try {
            const query = this.buildQuery(section.query, parameters)
            const projects = await Project.find(query).populate('ownerId', 'name email')
            
            return this.formatData(projects, section.format)
        } catch (error) {
            logger.error('Error getting projects data:', error)
            throw error
        }
    }

    /**
     * Get users data for report
     */
    private async getUsersData(section: ReportSection, parameters: Record<string, any>): Promise<any> {
        try {
            const query = this.buildQuery(section.query, parameters)
            const users = await User.find(query)
            
            return this.formatData(users, section.format)
        } catch (error) {
            logger.error('Error getting users data:', error)
            throw error
        }
    }

    /**
     * Get sheets data for report
     */
    private async getSheetsData(section: ReportSection, parameters: Record<string, any>): Promise<any> {
        try {
            const query = this.buildQuery(section.query, parameters)
            const sheets = await Sheet.find(query).populate('projectId', 'name')
            
            return this.formatData(sheets, section.format)
        } catch (error) {
            logger.error('Error getting sheets data:', error)
            throw error
        }
    }

    /**
     * Get files data for report
     */
    private async getFilesData(section: ReportSection, parameters: Record<string, any>): Promise<any> {
        try {
            const query = this.buildQuery(section.query, parameters)
            const files = await File.find(query).populate('projectId', 'name')
            
            return this.formatData(files, section.format)
        } catch (error) {
            logger.error('Error getting files data:', error)
            throw error
        }
    }

    /**
     * Get messages data for report
     */
    private async getMessagesData(section: ReportSection, parameters: Record<string, any>): Promise<any> {
        try {
            const query = this.buildQuery(section.query, parameters)
            const messages = await ChatMessage.find(query)
                .populate('userId', 'name')
                .populate('projectId', 'name')
            
            return this.formatData(messages, section.format)
        } catch (error) {
            logger.error('Error getting messages data:', error)
            throw error
        }
    }

    /**
     * Get analytics data for report
     */
    private async getAnalyticsData(section: ReportSection, parameters: Record<string, any>): Promise<any> {
        try {
            // This would integrate with the analytics service
            // For now, return mock data
            return {
                totalProjects: await Project.countDocuments(),
                totalUsers: await User.countDocuments(),
                totalSheets: await Sheet.countDocuments(),
                totalFiles: await File.countDocuments(),
                totalMessages: await ChatMessage.countDocuments()
            }
        } catch (error) {
            logger.error('Error getting analytics data:', error)
            throw error
        }
    }

    /**
     * Build query from section query and parameters
     */
    private buildQuery(sectionQuery: any, parameters: Record<string, any>): any {
        let query = { ...sectionQuery }

        // Apply parameter filters
        for (const [key, value] of Object.entries(parameters)) {
            if (value !== undefined && value !== null && value !== '') {
                if (key.includes('Date')) {
                    // Handle date parameters
                    if (key.includes('From')) {
                        query[key.replace('From', '')] = { ...query[key.replace('From', '')], $gte: new Date(value) }
                    } else if (key.includes('To')) {
                        query[key.replace('To', '')] = { ...query[key.replace('To', '')], $lte: new Date(value) }
                    }
                } else {
                    query[key] = value
                }
            }
        }

        return query
    }

    /**
     * Format data according to section format
     */
    private formatData(data: any[], format: any): any {
        if (!format.columns) {
            return data
        }

        // Filter columns
        return data.map(item => {
            const formatted: any = {}
            for (const column of format.columns) {
                formatted[column] = this.getNestedValue(item, column)
            }
            return formatted
        })
    }

    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    /**
     * Generate PDF report
     */
    private async generatePDFReport(reportData: any, options: ReportGenerationOptions): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument()
                const buffers: Buffer[] = []

                doc.on('data', (chunk) => buffers.push(chunk))
                doc.on('end', () => resolve(Buffer.concat(buffers)))

                // Add title
                doc.fontSize(20).text(reportData.template.name, 50, 50)
                doc.fontSize(12).text(`Generated: ${reportData.generatedAt.toLocaleDateString()}`, 50, 80)

                let yPosition = 120

                // Add sections
                for (const section of reportData.sections) {
                    doc.fontSize(16).text(section.name, 50, yPosition)
                    yPosition += 30

                    if (section.data && Array.isArray(section.data)) {
                        // Add table data
                        for (const item of section.data.slice(0, 10)) { // Limit to 10 items
                            doc.fontSize(10).text(JSON.stringify(item, null, 2), 50, yPosition)
                            yPosition += 20
                        }
                    }

                    yPosition += 20
                }

                doc.end()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Generate Excel report
     */
    private async generateExcelReport(reportData: any, options: ReportGenerationOptions): Promise<Buffer> {
        try {
            const workbook = XLSX.utils.book_new()

            // Add summary sheet
            const summaryData = [
                ['Report Name', reportData.template.name],
                ['Generated At', reportData.generatedAt.toLocaleString()],
                ['Parameters', JSON.stringify(reportData.parameters)]
            ]
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

            // Add data sheets
            for (const section of reportData.sections) {
                if (section.data && Array.isArray(section.data)) {
                    const sheet = XLSX.utils.json_to_sheet(section.data)
                    XLSX.utils.book_append_sheet(workbook, sheet, section.name)
                }
            }

            return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
        } catch (error) {
            logger.error('Error generating Excel report:', error)
            throw error
        }
    }

    /**
     * Generate CSV report
     */
    private async generateCSVReport(reportData: any, options: ReportGenerationOptions): Promise<Buffer> {
        try {
            let csvData = ''

            // Add header
            csvData += 'Report Name,Generated At,Parameters\n'
            csvData += `${reportData.template.name},${reportData.generatedAt.toISOString()},${JSON.stringify(reportData.parameters)}\n\n`

            // Add sections
            for (const section of reportData.sections) {
                csvData += `Section: ${section.name}\n`
                
                if (section.data && Array.isArray(section.data)) {
                    if (section.data.length > 0) {
                        // Add headers
                        const headers = Object.keys(section.data[0])
                        csvData += headers.join(',') + '\n'
                        
                        // Add data
                        for (const item of section.data) {
                            const values = headers.map(header => 
                                JSON.stringify(item[header] || '')
                            )
                            csvData += values.join(',') + '\n'
                        }
                    }
                }
                
                csvData += '\n'
            }

            return Buffer.from(csvData, 'utf8')
        } catch (error) {
            logger.error('Error generating CSV report:', error)
            throw error
        }
    }

    /**
     * Initialize default report templates
     */
    private initializeDefaultTemplates(): void {
        // Project Summary Report
        const projectSummaryTemplate: ReportTemplate = {
            id: 'project-summary',
            name: 'Project Summary Report',
            description: 'Comprehensive project overview with key metrics',
            category: 'project',
            sections: [
                {
                    id: 'project-info',
                    name: 'Project Information',
                    type: 'table',
                    dataSource: 'projects',
                    query: {},
                    format: {
                        columns: ['name', 'status', 'budget', 'startDate', 'endDate', 'ownerId.name']
                    },
                    position: { row: 0, col: 0, width: 12, height: 6 }
                },
                {
                    id: 'project-stats',
                    name: 'Project Statistics',
                    type: 'kpi',
                    dataSource: 'analytics',
                    query: {},
                    format: {},
                    position: { row: 0, col: 12, width: 12, height: 6 }
                }
            ],
            filters: [
                {
                    id: 'status',
                    name: 'Project Status',
                    type: 'select',
                    field: 'status',
                    options: ['active', 'completed', 'cancelled', 'planning'],
                    required: false
                },
                {
                    id: 'dateRange',
                    name: 'Date Range',
                    type: 'date',
                    field: 'createdAt',
                    required: false
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system'
        }

        this.templates.set(projectSummaryTemplate.id, projectSummaryTemplate)

        // User Activity Report
        const userActivityTemplate: ReportTemplate = {
            id: 'user-activity',
            name: 'User Activity Report',
            description: 'User engagement and activity analysis',
            category: 'user',
            sections: [
                {
                    id: 'user-list',
                    name: 'User List',
                    type: 'table',
                    dataSource: 'users',
                    query: {},
                    format: {
                        columns: ['name', 'email', 'role', 'isActive', 'lastLogin']
                    },
                    position: { row: 0, col: 0, width: 12, height: 8 }
                },
                {
                    id: 'activity-stats',
                    name: 'Activity Statistics',
                    type: 'kpi',
                    dataSource: 'analytics',
                    query: {},
                    format: {},
                    position: { row: 8, col: 0, width: 12, height: 4 }
                }
            ],
            filters: [
                {
                    id: 'role',
                    name: 'User Role',
                    type: 'select',
                    field: 'role',
                    options: ['admin', 'manager', 'user'],
                    required: false
                },
                {
                    id: 'active',
                    name: 'Active Users Only',
                    type: 'select',
                    field: 'isActive',
                    options: ['true', 'false'],
                    required: false
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system'
        }

        this.templates.set(userActivityTemplate.id, userActivityTemplate)
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    }
}

export default new CustomReportingService()
