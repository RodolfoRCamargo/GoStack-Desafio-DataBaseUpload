import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class AlterTableTransactiosAddFieldType1593570034298
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('repositories', 'type');
  }
}