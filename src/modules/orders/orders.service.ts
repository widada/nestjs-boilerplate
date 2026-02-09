import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/order.dto';
import { ProductsService } from '../products/products.service';
import { StripeService } from '../payments/stripe.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private productsService: ProductsService,
    private stripeService: StripeService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    const orderItems: Partial<OrderItem>[] = [];
    let totalAmountUsd = 0;

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);

      if (!product.isActive) {
        throw new BadRequestException(
          `Product "${product.name}" is not available`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        );
      }

      const subtotalUsd = Number(
        (Number(product.priceUsd) * item.quantity).toFixed(2),
      );

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceUsd: Number(product.priceUsd),
        subtotalUsd,
      });

      totalAmountUsd += subtotalUsd;
    }

    totalAmountUsd = Number(totalAmountUsd.toFixed(2));

    const paymentIntent = await this.stripeService.createPaymentIntent(
      totalAmountUsd,
      {
        userId: user.id,
      },
    );

    const order = this.orderRepository.create({
      userId: user.id,
      totalAmountUsd,
      status: OrderStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret ?? undefined,
    });

    const savedOrder = await this.orderRepository.save(order);

    const items = orderItems.map((item) =>
      this.orderItemRepository.create({
        ...item,
        orderId: savedOrder.id,
      }),
    );
    await this.orderItemRepository.save(items);

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);
      await this.productsService.update(item.productId, {
        stock: product.stock - item.quantity,
      });
    }

    return this.findOne(savedOrder.id, user);
  }

  async findAll(user: User) {
    return this.orderRepository.find({
      where: { userId: user.id },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.userId !== user.id) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  async cancelOrder(id: string, user: User) {
    const order = await this.findOne(id, user);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel order with status "${order.status}"`,
      );
    }

    // Cancel the Stripe PaymentIntent
    if (order.stripePaymentIntentId) {
      await this.stripeService.cancelPaymentIntent(
        order.stripePaymentIntentId,
      );
    }

    // Restore stock
    for (const item of order.items) {
      const product = await this.productsService.findOne(item.productId);
      await this.productsService.update(item.productId, {
        stock: product.stock + item.quantity,
      });
    }

    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  /**
   * Called by webhook when Stripe confirms payment succeeded.
   */
  async markOrderPaid(stripePaymentIntentId: string) {
    const order = await this.orderRepository.findOne({
      where: { stripePaymentIntentId },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with PaymentIntent ${stripePaymentIntentId} not found`,
      );
    }

    order.status = OrderStatus.PAID;
    return this.orderRepository.save(order);
  }

  /**
   * Called by webhook when Stripe payment fails.
   */
  async markOrderFailed(stripePaymentIntentId: string) {
    const order = await this.orderRepository.findOne({
      where: { stripePaymentIntentId },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with PaymentIntent ${stripePaymentIntentId} not found`,
      );
    }

    order.status = OrderStatus.FAILED;
    return this.orderRepository.save(order);
  }
}
