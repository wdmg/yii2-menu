<?php

use yii\db\Migration;

/**
 * Class m201203_210842_menu
 */
class m201203_210842_menu extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {

        $tableOptions = null;
        if ($this->db->driverName === 'mysql') {
            $tableOptions = 'CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE=InnoDB';
        }

        $this->createTable('{{%menu}}', [
            'id' => $this->primaryKey(),

            'title' => $this->string(64)->notNull(),
            'description' => $this->string(255)->null(),
            'alias' => $this->string(64)->notNull(),
            'status' => $this->tinyInteger(1)->null()->defaultValue(0), // 0 - draft, 1 - published

            'created_at' => $this->dateTime()->defaultExpression('CURRENT_TIMESTAMP'),
            'created_by' => $this->integer(11)->null(),
            'updated_at' => $this->datetime()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_by' => $this->integer(11)->null(),

        ], $tableOptions);

        $this->createIndex('{{%idx-menu}}', '{{%menu}}', ['title', 'alias', 'status']);

        // If exist module `Users` set foreign key `created_by`, `updated_by` to `users.id`
        if (class_exists('\wdmg\users\models\Users')) {
            $this->createIndex('{{%idx-menu-created}}','{{%menu}}', ['created_by'],false);
            $this->createIndex('{{%idx-menu-updated}}','{{%menu}}', ['updated_by'],false);
            $userTable = \wdmg\users\models\Users::tableName();
            $this->addForeignKey(
                'fk_menu_to_users1',
                '{{%menu}}',
                'created_by',
                $userTable,
                'id',
                'NO ACTION',
                'CASCADE'
            );
            $this->addForeignKey(
                'fk_menu_to_users2',
                '{{%menu}}',
                'updated_by',
                $userTable,
                'id',
                'NO ACTION',
                'CASCADE'
            );
        }
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {

        $this->dropIndex('{{%idx-menu}}', '{{%menu}}');

        if (class_exists('\wdmg\users\models\Users')) {
            $this->dropIndex('{{%idx-menu-created}}', '{{%menu}}');
            $this->dropIndex('{{%idx-menu-updated}}', '{{%menu}}');
            $userTable = \wdmg\users\models\Users::tableName();
            if (!(Yii::$app->db->getTableSchema($userTable, true) === null)) {
                $this->dropForeignKey(
                    'fk_menu_to_users1',
                    '{{%menu}}'
                );
                $this->dropForeignKey(
                    'fk_menu_to_users2',
                    '{{%menu}}'
                );
            }
        }

        $this->truncateTable('{{%menu}}');
        $this->dropTable('{{%menu}}');
    }

}
