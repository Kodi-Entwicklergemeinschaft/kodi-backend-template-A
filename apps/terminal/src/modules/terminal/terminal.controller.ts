import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { CreateTerminalDto, UpdateTerminalDto } from './dto';
import { JwtAuthGuard } from '@kodi/jwt';

@Controller('terminal')
@UseGuards(JwtAuthGuard)
export class TerminalController {
  constructor(private readonly terminalService: TerminalService) {}

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.terminalService.findAll(+page, +limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.terminalService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTerminalDto) {
    return this.terminalService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTerminalDto) {
    return this.terminalService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.terminalService.delete(id);
  }
}
