import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async findAll(@CurrentUser('userId') userId: string) {
    return this.categoriesService.findAll(userId);
  }

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.categoriesService.remove(userId, id);
  }
}
