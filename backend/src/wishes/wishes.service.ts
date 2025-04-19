import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { Repository } from 'typeorm';
import { Wish } from './entities/wish.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private wishesRepository: Repository<Wish>,
  ) {}

  async findLastWishes() {
    const lastWishes = await this.wishesRepository.find({
      take: 20,
      order: {
        createdAt: 'DESC',
      },
      relations: ['owner'],
    });
    return lastWishes;
  }

  async findTopWishes() {
    const topWishes = await this.wishesRepository.find({
      take: 20,
      order: {
        copied: 'DESC',
      },
      relations: ['owner'],
    });
    return topWishes;
  }

  async findAll() {
    const wishes = await this.wishesRepository.find({ relations: ['offers'] });
    if (wishes.length === 0) {
      throw new NotFoundException('Подарки не найдены');
    }
    return wishes;
  }

  async findOne(id: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id },
      relations: ['offers', 'owner'],
    });
    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    } else {
      return wish;
    }
  }

  async create(userId: number, createWishDto: CreateWishDto) {
    const newWish = await this.wishesRepository.create({
      ...createWishDto,
      owner: { id: userId },
    });

    return this.wishesRepository.save(newWish);
  }

  async update(id: number, updateWishDto: UpdateWishDto, userId: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }
    if (wish?.owner?.id !== userId) {
      throw new ForbiddenException(
        'У вас недостаточно прав для редактирования',
      );
    }
    if (wish.raised > 0) {
      throw new ForbiddenException('Подарок нельзя редактировать');
    }
    return this.wishesRepository.save({ ...wish, ...updateWishDto });
  }

  async remove(id: number, userId: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }
    if (wish?.owner?.id !== userId) {
      throw new ForbiddenException(
        'У вас недостаточно прав для редактирования',
      );
    }
    await this.wishesRepository.delete(wish.id);
    return 'Подарок удален';
  }

  async findWishesByUser(ownerId: number) {
    const userWishes = await this.wishesRepository.find({
      where: { owner: { id: ownerId } },
    });
    if (userWishes.length <= 0) {
      throw new NotFoundException(`У пользователя нет подарков`);
    }
    return userWishes;
  }

  async copyWish(id: number, userId: number) {
    const wishToCopy = await this.wishesRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!wishToCopy) {
      throw new NotFoundException(`Подарок не найден`);
    }
    const existingWish = await this.wishesRepository.findOneBy({
      name: wishToCopy.name,
      owner: { id: userId },
    });

    if (existingWish) {
      throw new ConflictException(`Подарок уже был копирован`);
    }
    if (wishToCopy?.owner?.id === userId) {
      throw new UnauthorizedException('Нельзя копировать свой подарок');
    }

    wishToCopy.copied += 1;
    await this.wishesRepository.save({ ...wishToCopy });
    const copiedWish = this.wishesRepository.create({
      ...wishToCopy,
      owner: { id: userId },
    });
    return this.wishesRepository.save(copiedWish);
  }
}
