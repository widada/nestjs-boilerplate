import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateOrdersTable1704067600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'totalAmountUsd',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
            default: "'pending'",
          },
          {
            name: 'stripePaymentIntentId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripeClientSecret',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'orderId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'productId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'unitPriceUsd',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'subtotalUsd',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const orderItemsTable = await queryRunner.getTable('order_items');
    if (orderItemsTable) {
      const orderForeignKey = orderItemsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('orderId') !== -1,
      );
      const productForeignKey = orderItemsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('productId') !== -1,
      );
      if (orderForeignKey) {
        await queryRunner.dropForeignKey('order_items', orderForeignKey);
      }
      if (productForeignKey) {
        await queryRunner.dropForeignKey('order_items', productForeignKey);
      }
    }
    await queryRunner.dropTable('order_items');

    const ordersTable = await queryRunner.getTable('orders');
    if (ordersTable) {
      const userForeignKey = ordersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      if (userForeignKey) {
        await queryRunner.dropForeignKey('orders', userForeignKey);
      }
    }
    await queryRunner.dropTable('orders');
  }
}
