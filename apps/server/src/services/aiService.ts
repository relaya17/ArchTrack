/**
 * AI Service
 * Construction Master App - OpenAI Integration for Smart Features
 */

import OpenAI from 'openai';
import logger from '../config/logger';
import { businessMetrics } from '../config/metrics';
import advancedAIService from './advancedAIService';

class AIService {
    private openai: OpenAI;
    private isInitialized = false;

    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            this.isInitialized = true;
            logger.info('AI Service initialized successfully');
        } else {
            logger.warn('OpenAI API key not provided, AI features disabled');
        }
    }

    /**
     * Generate smart project suggestions
     */
    async generateProjectSuggestions(userInput: string, projectType: string): Promise<any> {
        if (!this.isInitialized) {
            throw new Error('AI Service not initialized');
        }

        try {
            const startTime = Date.now();

            const prompt = `
        As a construction expert AI assistant, analyze this project request and provide detailed suggestions:
        
        Project Type: ${projectType}
        User Input: ${userInput}
        
        Please provide:
        1. Recommended materials list
        2. Estimated timeline
        3. Key considerations and risks
        4. Budget estimation ranges
        5. Required permits and approvals
        6. Suggested project phases
        
        Format your response as a structured JSON object.
      `;

            const completion = await this.openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert construction project manager with 20+ years of experience. Provide detailed, professional advice for construction projects.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
                temperature: 0.7,
            });

            const duration = Date.now() - startTime;

            // Record metrics
            businessMetrics.apiResponseTime.observe(
                { endpoint: '/ai/project-suggestions', method: 'POST' },
                duration / 1000
            );

            businessMetrics.apiCallsTotal.inc({
                endpoint: '/ai/project-suggestions',
                method: 'POST',
            });

            logger.info('AI project suggestions generated successfully', {
                duration: `${duration}ms`,
                tokensUsed: completion.usage?.total_tokens,
            });

            return {
                success: true,
                suggestions: JSON.parse(completion.choices[0].message.content || '{}'),
                metadata: {
                    model: process.env.AI_MODEL || 'gpt-4',
                    tokensUsed: completion.usage?.total_tokens,
                    duration: `${duration}ms`,
                },
            };
        } catch (error) {
            logger.error('Error generating project suggestions', error);
            businessMetrics.errorsTotal.inc({
                type: 'ai_error',
                severity: 'medium',
            });
            throw error;
        }
    }

    /**
     * Generate smart BOQ (Bill of Quantities) suggestions
     */
    async generateBOQSuggestions(projectData: any): Promise<any> {
        if (!this.isInitialized) {
            throw new Error('AI Service not initialized');
        }

        try {
            const startTime = Date.now();

            const prompt = `
        Generate a comprehensive Bill of Quantities (BOQ) for this construction project:
        
        Project Details:
        ${JSON.stringify(projectData, null, 2)}
        
        Please provide:
        1. Detailed material quantities with units
        2. Labor requirements by trade
        3. Equipment and machinery needs
        4. Cost estimates per item
        5. Subtotal and total costs
        6. Contingency recommendations
        
        Format as a structured BOQ table in JSON format.
      `;

            const completion = await this.openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional quantity surveyor with expertise in construction cost estimation and BOQ preparation.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: parseInt(process.env.AI_MAX_TOKENS || '3000'),
                temperature: 0.5,
            });

            const duration = Date.now() - startTime;

            businessMetrics.apiResponseTime.observe(
                { endpoint: '/ai/boq-suggestions', method: 'POST' },
                duration / 1000
            );

            logger.info('AI BOQ suggestions generated successfully', {
                duration: `${duration}ms`,
                tokensUsed: completion.usage?.total_tokens,
            });

            return {
                success: true,
                boq: JSON.parse(completion.choices[0].message.content || '{}'),
                metadata: {
                    model: process.env.AI_MODEL || 'gpt-4',
                    tokensUsed: completion.usage?.total_tokens,
                    duration: `${duration}ms`,
                },
            };
        } catch (error) {
            logger.error('Error generating BOQ suggestions', error);
            businessMetrics.errorsTotal.inc({
                type: 'ai_error',
                severity: 'medium',
            });
            throw error;
        }
    }

    /**
     * Analyze project risks and provide mitigation strategies
     */
    async analyzeProjectRisks(projectData: any): Promise<any> {
        if (!this.isInitialized) {
            throw new Error('AI Service not initialized');
        }

        try {
            const startTime = Date.now();

            const prompt = `
        Analyze this construction project for potential risks and provide mitigation strategies:
        
        Project Data:
        ${JSON.stringify(projectData, null, 2)}
        
        Please identify:
        1. Technical risks
        2. Financial risks
        3. Schedule risks
        4. Environmental risks
        5. Safety risks
        6. Mitigation strategies for each risk
        7. Risk probability and impact assessment
        
        Format as a structured risk analysis report in JSON format.
      `;

            const completion = await this.openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a construction risk management expert with extensive experience in project risk assessment and mitigation.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2500'),
                temperature: 0.6,
            });

            const duration = Date.now() - startTime;

            businessMetrics.apiResponseTime.observe(
                { endpoint: '/ai/risk-analysis', method: 'POST' },
                duration / 1000
            );

            logger.info('AI risk analysis completed successfully', {
                duration: `${duration}ms`,
                tokensUsed: completion.usage?.total_tokens,
            });

            return {
                success: true,
                riskAnalysis: JSON.parse(completion.choices[0].message.content || '{}'),
                metadata: {
                    model: process.env.AI_MODEL || 'gpt-4',
                    tokensUsed: completion.usage?.total_tokens,
                    duration: `${duration}ms`,
                },
            };
        } catch (error) {
            logger.error('Error analyzing project risks', error);
            businessMetrics.errorsTotal.inc({
                type: 'ai_error',
                severity: 'medium',
            });
            throw error;
        }
    }

    /**
     * Generate smart scheduling recommendations
     */
    async generateSchedulingSuggestions(projectData: any): Promise<any> {
        if (!this.isInitialized) {
            throw new Error('AI Service not initialized');
        }

        try {
            const startTime = Date.now();

            const prompt = `
        Create an optimized project schedule for this construction project:
        
        Project Information:
        ${JSON.stringify(projectData, null, 2)}
        
        Please provide:
        1. Project phases with dependencies
        2. Critical path analysis
        3. Resource allocation timeline
        4. Milestone dates
        5. Buffer time recommendations
        6. Potential bottlenecks
        7. Parallel work opportunities
        
        Format as a structured project schedule in JSON format.
      `;

            const completion = await this.openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a construction project scheduler with expertise in CPM, PERT, and resource optimization.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2500'),
                temperature: 0.5,
            });

            const duration = Date.now() - startTime;

            businessMetrics.apiResponseTime.observe(
                { endpoint: '/ai/scheduling-suggestions', method: 'POST' },
                duration / 1000
            );

            logger.info('AI scheduling suggestions generated successfully', {
                duration: `${duration}ms`,
                tokensUsed: completion.usage?.total_tokens,
            });

            return {
                success: true,
                schedule: JSON.parse(completion.choices[0].message.content || '{}'),
                metadata: {
                    model: process.env.AI_MODEL || 'gpt-4',
                    tokensUsed: completion.usage?.total_tokens,
                    duration: `${duration}ms`,
                },
            };
        } catch (error) {
            logger.error('Error generating scheduling suggestions', error);
            businessMetrics.errorsTotal.inc({
                type: 'ai_error',
                severity: 'medium',
            });
            throw error;
        }
    }

    /**
     * Generate document templates
     */
    async generateDocumentTemplate(documentType: string, projectContext: any): Promise<any> {
        if (!this.isInitialized) {
            throw new Error('AI Service not initialized');
        }

        try {
            const startTime = Date.now();

            const prompt = `
        Generate a professional ${documentType} template for this construction project:
        
        Project Context:
        ${JSON.stringify(projectContext, null, 2)}
        
        Please provide a comprehensive, well-structured template that includes:
        1. All necessary sections and subsections
        2. Professional formatting
        3. Relevant industry standards
        4. Placeholder fields for customization
        5. Legal and compliance considerations
        
        Format as a structured document template in JSON format.
      `;

            const completion = await this.openai.chat.completions.create({
                model: process.env.AI_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a construction documentation expert with knowledge of industry standards and legal requirements.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: parseInt(process.env.AI_MAX_TOKENS || '3000'),
                temperature: 0.4,
            });

            const duration = Date.now() - startTime;

            businessMetrics.apiResponseTime.observe(
                { endpoint: '/ai/document-template', method: 'POST' },
                duration / 1000
            );

            logger.info('AI document template generated successfully', {
                documentType,
                duration: `${duration}ms`,
                tokensUsed: completion.usage?.total_tokens,
            });

            return {
                success: true,
                template: JSON.parse(completion.choices[0].message.content || '{}'),
                metadata: {
                    documentType,
                    model: process.env.AI_MODEL || 'gpt-4',
                    tokensUsed: completion.usage?.total_tokens,
                    duration: `${duration}ms`,
                },
            };
        } catch (error) {
            logger.error('Error generating document template', error);
            businessMetrics.errorsTotal.inc({
                type: 'ai_error',
                severity: 'medium',
            });
            throw error;
        }
    }

    /**
     * Generate construction schedule
     */
    async generateConstructionSchedule(projectData: any, scheduleType: string): Promise<any> {
        try {
            return await advancedAIService.generateConstructionSchedule(projectData, scheduleType);
        } catch (error) {
            logger.error('Error generating construction schedule:', error);
            throw error;
        }
    }

    /**
     * Analyze BIM data
     */
    async analyzeBIMData(bimData: any, analysisType: string): Promise<any> {
        try {
            return await advancedAIService.analyzeBIMData(bimData, analysisType);
        } catch (error) {
            logger.error('Error analyzing BIM data:', error);
            throw error;
        }
    }

    /**
     * Generate material specifications
     */
    async generateMaterialSpecifications(projectData: any, materialType: string): Promise<any> {
        try {
            return await advancedAIService.generateMaterialSpecifications(projectData, materialType);
        } catch (error) {
            logger.error('Error generating material specifications:', error);
            throw error;
        }
    }

    /**
     * Generate quality control checklist
     */
    async generateQualityChecklist(qualityData: any): Promise<any> {
        try {
            return await advancedAIService.generateQualityChecklist(qualityData);
        } catch (error) {
            logger.error('Error generating quality checklist:', error);
            throw error;
        }
    }

    /**
     * Generate sustainability report
     */
    async generateSustainabilityReport(sustainabilityData: any, reportType: string): Promise<any> {
        try {
            return await advancedAIService.generateSustainabilityReport(sustainabilityData, reportType);
        } catch (error) {
            logger.error('Error generating sustainability report:', error);
            throw error;
        }
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(complianceData: any, reportType: string): Promise<any> {
        try {
            return await advancedAIService.generateComplianceReport(complianceData, reportType);
        } catch (error) {
            logger.error('Error generating compliance report:', error);
            throw error;
        }
    }

    /**
     * Generate risk assessment
     */
    async generateRiskAssessment(riskData: any, riskTypes: string[], assessmentLevel: string): Promise<any> {
        try {
            return await advancedAIService.generateRiskAssessment(riskData, riskTypes, assessmentLevel);
        } catch (error) {
            logger.error('Error generating risk assessment:', error);
            throw error;
        }
    }

    /**
     * Generate project documentation
     */
    async generateProjectDocumentation(docData: any, docType: string): Promise<any> {
        try {
            return await advancedAIService.generateProjectDocumentation(docData, docType);
        } catch (error) {
            logger.error('Error generating project documentation:', error);
            throw error;
        }
    }

    /**
     * Get AI model status
     */
    async getModelStatus(): Promise<any> {
        try {
            return await advancedAIService.getModelStatus();
        } catch (error) {
            logger.error('Error getting model status:', error);
            throw error;
        }
    }

    /**
     * Get AI usage statistics
     */
    async getUsageStatistics(period: string): Promise<any> {
        try {
            return await advancedAIService.getUsageStatistics(period);
        } catch (error) {
            logger.error('Error getting usage statistics:', error);
            throw error;
        }
    }

    /**
     * Check if AI service is available
     */
    isAvailable(): boolean {
        return this.isInitialized;
    }
}

export default new AIService();