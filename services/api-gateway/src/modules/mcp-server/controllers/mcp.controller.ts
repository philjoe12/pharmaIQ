import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MCPServer } from '../mcp.server';

@ApiTags('MCP Server')
@Controller('mcp')
export class MCPController {
  constructor(private readonly mcpServer: MCPServer) {}

  @Get('status')
  @ApiOperation({ 
    summary: 'Get MCP server status',
    description: 'Check the status and health of the Model Context Protocol server'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'MCP server status retrieved successfully'
  })
  getStatus() {
    return this.mcpServer.getStatus();
  }

  @Get('tools')
  @ApiOperation({ 
    summary: 'List available MCP tools',
    description: 'Get a list of all available drug information tools exposed via MCP'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Available MCP tools listed successfully'
  })
  getAvailableTools() {
    return {
      server: 'pharmaiq-drug-server',
      version: '1.0.0',
      tools: this.mcpServer.getAvailableTools(),
      description: 'Model Context Protocol server providing drug information tools for AI systems'
    };
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'MCP server health check',
    description: 'Simple health check for the MCP server'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'MCP server is healthy'
  })
  getHealth() {
    return {
      healthy: this.mcpServer.isHealthy(),
      timestamp: new Date().toISOString(),
      server: 'pharmaiq-drug-server'
    };
  }
}