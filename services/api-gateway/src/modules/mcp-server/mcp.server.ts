import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DrugService } from '../drugs/services/drug.service';

@Injectable()
export class MCPServer implements OnModuleInit {
  private readonly logger = new Logger(MCPServer.name);
  private server: Server;
  private isRunning = false;

  constructor(private readonly drugService: DrugService) {
    this.server = new Server(
      {
        name: 'pharmaiq-drug-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  async onModuleInit() {
    await this.start();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.logger.log('MCP Server starting...');
    
    try {
      // Register tools
      await this.registerTools();
      
      // Set up handlers
      this.setupHandlers();
      
      this.isRunning = true;
      this.logger.log('MCP Server started successfully');
    } catch (error) {
      this.logger.error('Failed to start MCP Server:', error);
      // Don't throw - allow app to continue without MCP
    }
  }

  private async registerTools(): Promise<void> {
    // Register drug lookup tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_drugs',
            description: 'Search for drugs by name, generic name, or manufacturer',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search term for drug name, generic name, or manufacturer'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_drug_details',
            description: 'Get detailed information about a specific drug by slug',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'Drug slug identifier'
                }
              },
              required: ['slug']
            }
          },
          {
            name: 'find_drugs_by_condition',
            description: 'Find drugs that treat a specific medical condition',
            inputSchema: {
              type: 'object',
              properties: {
                condition: {
                  type: 'string',
                  description: 'Medical condition or indication'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10
                }
              },
              required: ['condition']
            }
          },
          {
            name: 'get_drug_interactions',
            description: 'Get information about drug interactions and contraindications',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'Drug slug identifier'
                }
              },
              required: ['slug']
            }
          },
          {
            name: 'compare_drugs',
            description: 'Compare multiple drugs side by side',
            inputSchema: {
              type: 'object',
              properties: {
                slugs: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of drug slugs to compare',
                  minItems: 2
                }
              },
              required: ['slugs']
            }
          },
          {
            name: 'get_related_drugs',
            description: 'Get drugs related to a specific drug (same manufacturer, similar indications)',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'Drug slug identifier'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 5
                }
              },
              required: ['slug']
            }
          }
        ] satisfies Tool[]
      };
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_drugs':
            return await this.handleSearchDrugs(args);
          
          case 'get_drug_details':
            return await this.handleGetDrugDetails(args);
          
          case 'find_drugs_by_condition':
            return await this.handleFindDrugsByCondition(args);
          
          case 'get_drug_interactions':
            return await this.handleGetDrugInteractions(args);
          
          case 'compare_drugs':
            return await this.handleCompareDrugs(args);
          
          case 'get_related_drugs':
            return await this.handleGetRelatedDrugs(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Error handling tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  private async handleSearchDrugs(args: any) {
    const { query, limit = 10 } = args;
    const results = await this.drugService.searchDrugs(query);
    const limitedResults = results.slice(0, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query,
            found: limitedResults.length,
            drugs: limitedResults.map(drug => ({
              name: drug.drugName,
              genericName: drug.label.genericName,
              manufacturer: drug.labeler,
              slug: drug.slug,
              indications: drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, '').substring(0, 200)
            }))
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetDrugDetails(args: any) {
    const { slug } = args;
    const drug = await this.drugService.findBySlug(slug);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            name: drug.drugName,
            genericName: drug.label.genericName,
            manufacturer: drug.labeler,
            slug: drug.slug,
            title: drug.label.title,
            indications: drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, ''),
            dosage: drug.label.dosageAndAdministration?.replace(/<[^>]*>/g, ''),
            warnings: drug.label.warningsAndPrecautions?.replace(/<[^>]*>/g, ''),
            adverseReactions: drug.label.adverseReactions?.replace(/<[^>]*>/g, ''),
            contraindications: drug.label.contraindications?.replace(/<[^>]*>/g, ''),
            clinicalPharmacology: drug.label.clinicalPharmacology?.replace(/<[^>]*>/g, '')
          }, null, 2)
        }
      ]
    };
  }

  private async handleFindDrugsByCondition(args: any) {
    const { condition, limit = 10 } = args;
    const results = await this.drugService.findByCondition(condition, { page: 1, limit });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            condition,
            found: results.data.length,
            total: results.pagination.total,
            drugs: results.data.map(drug => ({
              name: drug.drugName,
              genericName: drug.label.genericName,
              manufacturer: drug.labeler,
              slug: drug.slug,
              relevantIndications: drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, '').substring(0, 300)
            }))
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetDrugInteractions(args: any) {
    const { slug } = args;
    const drug = await this.drugService.findBySlug(slug);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            drugName: drug.drugName,
            slug: drug.slug,
            contraindications: drug.label.contraindications?.replace(/<[^>]*>/g, '') || 'No contraindications data available',
            warnings: drug.label.warningsAndPrecautions?.replace(/<[^>]*>/g, '') || 'No warnings data available',
            adverseReactions: drug.label.adverseReactions?.replace(/<[^>]*>/g, '') || 'No adverse reactions data available'
          }, null, 2)
        }
      ]
    };
  }

  private async handleCompareDrugs(args: any) {
    const { slugs } = args;
    const drugs = await this.drugService.compareDrugs(slugs);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            comparedDrugs: drugs.length,
            comparison: drugs.map(drug => ({
              name: drug.drugName,
              genericName: drug.label.genericName,
              manufacturer: drug.labeler,
              slug: drug.slug,
              indications: drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, '').substring(0, 200),
              dosageForms: drug.label.dosageFormsAndStrengths?.replace(/<[^>]*>/g, '').substring(0, 200),
              keyWarnings: drug.label.warningsAndPrecautions?.replace(/<[^>]*>/g, '').substring(0, 200)
            }))
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetRelatedDrugs(args: any) {
    const { slug, limit = 5 } = args;
    const relatedDrugs = await this.drugService.getRelatedDrugs(slug);
    const limitedResults = relatedDrugs.slice(0, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            originalDrug: slug,
            found: limitedResults.length,
            relatedDrugs: limitedResults.map(drug => ({
              name: drug.drugName,
              genericName: drug.label.genericName,
              manufacturer: drug.labeler,
              slug: drug.slug,
              relationship: 'Same manufacturer',
              indications: drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, '').substring(0, 200)
            }))
          }, null, 2)
        }
      ]
    };
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.log('MCP Server stopping...');
    
    try {
      await this.server.close();
      this.isRunning = false;
      this.logger.log('MCP Server stopped');
    } catch (error) {
      this.logger.error('Error stopping MCP Server:', error);
    }
  }

  isHealthy(): boolean {
    return this.isRunning;
  }

  getStatus() {
    return {
      running: this.isRunning,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tools: [
        'search_drugs',
        'get_drug_details', 
        'find_drugs_by_condition',
        'get_drug_interactions',
        'compare_drugs',
        'get_related_drugs'
      ]
    };
  }

  getAvailableTools() {
    return [
      {
        name: 'search_drugs',
        description: 'Search for drugs by name, generic name, or manufacturer'
      },
      {
        name: 'get_drug_details',
        description: 'Get detailed information about a specific drug'
      },
      {
        name: 'find_drugs_by_condition',
        description: 'Find drugs that treat a specific medical condition'
      },
      {
        name: 'get_drug_interactions',
        description: 'Get drug interactions and contraindications'
      },
      {
        name: 'compare_drugs',
        description: 'Compare multiple drugs side by side'
      },
      {
        name: 'get_related_drugs',
        description: 'Get drugs related to a specific drug'
      }
    ];
  }
}