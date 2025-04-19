import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { AuthDecorator } from 'src/lib/auth-decorator';
import { User } from 'src/users/entities/user.entity';
import { JwtGuard } from 'src/auth/guards/jwt-guard';

@UseGuards(JwtGuard)
@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Post(':id/copy')
  async copy(@Param('id') id: number, @AuthDecorator() user: User) {
    return this.wishesService.copyWish(+id, user.id);
  }

  @Post()
  async create(
    @AuthDecorator() user: User,
    @Body() createWishDto: CreateWishDto,
  ) {
    return this.wishesService.create(user.id, createWishDto);
  }

  @Get()
  async findAll() {
    return this.wishesService.findAll();
  }

  @Get('top')
  async findTopWishes() {
    return this.wishesService.findTopWishes();
  }

  @Get('last')
  async findLastWishes() {
    return this.wishesService.findLastWishes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateWishDto: UpdateWishDto,
    @AuthDecorator() user: User,
  ) {
    return this.wishesService.update(id, updateWishDto, user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @AuthDecorator() user: User) {
    return this.wishesService.remove(id, user.id);
  }
}
