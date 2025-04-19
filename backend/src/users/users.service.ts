import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOneOptions, Like, Repository } from 'typeorm';
import { HashingService } from 'src/lib/hashing.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async findAll() {
    return this.usersRepository.find({});
  }

  async findOne(query: FindOneOptions<User>) {
    const user = await this.usersRepository.findOne(query);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findMany(query: string) {
    const users = this.usersRepository.find({
      where: [{ username: Like(`%${query}%`) }, { email: Like(`%${query}%`) }],
    });
    if (!users) {
      throw new NotFoundException('Пользователи не найдены');
    }
    return users;
  }

  async update(id: number, updateDto: UpdateUserDto) {
    try {
      const { password } = updateDto;
      const user = await this.findById(id);
      if (password) {
        updateDto.password = await this.hashingService.hashValue(password, 10);
      }
      return await this.usersRepository.save({ ...user, ...updateDto });
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Пользователь с таким данными уже существует',
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.usersRepository.delete(id);
    return 'Пользователь удален';
  }

  async signup(newUser: CreateUserDto): Promise<User> {
    const checkUser = await this.usersRepository.findOne({
      where: [{ email: newUser.email }, { username: newUser.username }],
    });

    if (checkUser) {
      throw new BadRequestException(
        'Пользователь с таким данными уже существует',
      );
    }

    const hashedPassword = await this.hashingService.hashValue(
      newUser.password,
      10,
    );
    const user = this.usersRepository.create({
      ...newUser,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }
}
