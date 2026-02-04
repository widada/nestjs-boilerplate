import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateChatTables1704067400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chat_rooms table
    await queryRunner.createTable(
      new Table({
        name: 'chat_rooms',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isPrivate',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '36',
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

    // Create foreign key for createdBy
    await queryRunner.createForeignKey(
      'chat_rooms',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create chat_messages table
    await queryRunner.createTable(
      new Table({
        name: 'chat_messages',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'roomId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for chat_messages
    await queryRunner.createForeignKey(
      'chat_messages',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'chat_messages',
      new TableForeignKey({
        columnNames: ['roomId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chat_rooms',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop chat_messages table with foreign keys
    const messagesTable = await queryRunner.getTable('chat_messages');
    if (messagesTable) {
      const userForeignKey = messagesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      const roomForeignKey = messagesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('roomId') !== -1,
      );
      if (userForeignKey) {
        await queryRunner.dropForeignKey('chat_messages', userForeignKey);
      }
      if (roomForeignKey) {
        await queryRunner.dropForeignKey('chat_messages', roomForeignKey);
      }
    }
    await queryRunner.dropTable('chat_messages');

    // Drop chat_rooms table with foreign keys
    const roomsTable = await queryRunner.getTable('chat_rooms');
    if (roomsTable) {
      const creatorForeignKey = roomsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('createdBy') !== -1,
      );
      if (creatorForeignKey) {
        await queryRunner.dropForeignKey('chat_rooms', creatorForeignKey);
      }
    }
    await queryRunner.dropTable('chat_rooms');
  }
}
