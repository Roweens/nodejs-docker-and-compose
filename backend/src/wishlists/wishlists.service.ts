import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Wish } from 'src/wishes/entities/wish.entity';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistsRepository: Repository<Wishlist>,
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
  ) {}
  async findAll() {
    const wishlists = await this.wishlistsRepository.find({
      relations: ['owner', 'items'],
    });
    if (wishlists.length === 0) {
      throw new NotFoundException('Списки подарков не найдены');
    }
    return wishlists;
  }

  async findOne(id: number) {
    const wishlists = await this.wishlistsRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!wishlists) {
      throw new NotFoundException('Список подарков не найден');
    } else {
      return wishlists;
    }
  }

  async create(createWishlistDto: CreateWishlistDto, userId: number) {
    const { itemsIds } = createWishlistDto;
    const wishesArr = await this.wishesRepository.findBy(
      itemsIds as FindOptionsWhere<Wish>[],
    );
    const wishlist = await this.wishlistsRepository.save({
      ...createWishlistDto,
      user: { id: userId },
      items: wishesArr,
    });
    return this.wishlistsRepository.save(wishlist);
  }

  async update(
    id: number,
    updateWishlistDto: UpdateWishlistDto,
    userId: number,
  ) {
    const wishlist = await this.wishlistsRepository.findOne({
      where: { id },
      relations: ['items', 'owner'],
    });
    const wishes = await this.wishesRepository.find({
      where: { id: In(updateWishlistDto.itemsIds) },
    });

    if (!wishlist) {
      throw new NotFoundException('Список подарков не найден');
    }
    if (wishlist?.owner?.id !== userId) {
      throw new ForbiddenException(
        'У вас недостаточно прав для редактирования',
      );
    }

    return this.wishlistsRepository.save({
      ...wishlist,
      name: updateWishlistDto.name,
      image: updateWishlistDto.image,
      items: wishes,
    });
  }

  async remove(id: number, userId: number) {
    const wishlist = await this.wishlistsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!wishlist) {
      throw new NotFoundException('Список подарков не найден');
    }
    if (wishlist?.owner?.id !== userId) {
      throw new ForbiddenException(
        'У вас недостаточно прав для редактирования',
      );
    }
    await this.wishlistsRepository.delete(wishlist.id);
    return 'Список подарков удален';
  }
}
