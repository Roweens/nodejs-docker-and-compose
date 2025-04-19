import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { Wish } from 'src/wishes/entities/wish.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
  ) {}

  async findAll() {
    const offers = await this.offersRepository.find({
      relations: ['user'],
    });
    if (offers.length === 0) {
      throw new NotFoundException('Предложения не найдены');
    }
    return offers;
  }

  async findOne(id: number) {
    const offer = await this.offersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!offer) {
      throw new NotFoundException('Предложение не найдено');
    }
    return offer;
  }

  async create(createOfferDto: CreateOfferDto, userId: number) {
    const { amount, wishId } = createOfferDto;

    const wish = await this.wishesRepository.findOne({
      where: { id: wishId },
      relations: ['owner', 'offers'],
    });

    if (!wish) {
      throw new NotFoundException(`Подарок не найден`);
    }

    if (wish.owner.id === userId) {
      throw new ForbiddenException('Вы не можете скинуться на свой подарок');
    }

    const offer = await this.offersRepository.create({
      ...createOfferDto,
      item: wish,
      user: { id: userId },
    });

    if (offer.amount + wish.raised > wish.price) {
      throw new ForbiddenException(
        'Сумма оффера не должна превышать цену подарка',
      );
    }

    wish.raised += amount;
    await this.wishesRepository.save(wish);
    return this.offersRepository.save(offer);
  }

  async update(id: number, updateData: Partial<Offer>) {
    return await this.offersRepository.update(id, updateData);
  }

  async remove(id: number) {
    await this.offersRepository.delete(id);
    return 'Предложение удалено';
  }
}
