import { Module } from '@nestjs/common';
import { MCPServer } from './mcp.server';
import { MCPController } from './controllers/mcp.controller';
import { DrugsModule } from '../drugs/drug.module';

@Module({
  imports: [DrugsModule],
  controllers: [MCPController],
  providers: [MCPServer],
  exports: [MCPServer],
})
export class MCPServerModule {}