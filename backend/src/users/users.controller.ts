import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindOneOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { AuthDecorator } from 'src/lib/auth-decorator';
import { WishesService } from 'src/wishes/wishes.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly wishesService: WishesService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('/me')
  async getMe(@AuthDecorator() user: User) {
    const { id } = user;
    const currentUser = await this.usersService.findOne({
      where: { id: id },
    });
    return currentUser;
  }

  @Post('find')
  async findMany(@Body() query: { query: string }) {
    return this.usersService.findMany(query.query);
  }

  @Get()
  findOne(@Body() query: FindOneOptions<User>) {
    return this.usersService.findOne(query);
  }

  @Get(':username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findOne({ where: { username } });
  }

  @Patch('/me')
  updateMe(@AuthDecorator() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('/me/wishes')
  async getMyWishes(@AuthDecorator() user: User) {
    const { id } = user;
    return this.wishesService.findWishesByUser(id);
  }

  @Get(':username/wishes')
  async getWishesByUsername(@Param('username') username: string) {
    const user = await this.usersService.findOne({ where: { username } });
    return this.wishesService.findWishesByUser(user.id);
  }
}
