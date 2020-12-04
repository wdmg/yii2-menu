<?php

use yii\db\Migration;

/**
 * Class m201203_210856_menu_items
 */
class m201203_210856_menu_items extends Migration
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

        $this->createTable('{{%menu_items}}', [

            'id' => $this->primaryKey(),
            'menu_id' => $this->integer(11)->notNull(),
            'parent_id' => $this->integer(11)->null(),

            'label' => $this->string(128)->notNull(),
            'title' => $this->string(255)->null(),

            'type' => $this->tinyInteger(1)->notNull()->defaultValue(1), // 1 - link, 2 - source
            'url' => $this->string(255)->notNull(),
            'source' => $this->text()->null(),

            'created_at' => $this->dateTime()->defaultExpression('CURRENT_TIMESTAMP'),
            'created_by' => $this->integer(11)->null(),
            'updated_at' => $this->datetime()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_by' => $this->integer(11)->null(),

        ], $tableOptions);


        // Setup foreign key to main menu
        $this->createIndex('{{%idx-menu_item}}', '{{%menu_items}}', ['menu_id', 'label', 'type', 'url']);
        $this->addForeignKey(
            'fk_menu_item',
            '{{%menu_items}}',
            'menu_id',
            '{{%menu}}',
            'id',
            'NO ACTION',
            'CASCADE'
        );

        // Setup foreign key to parents id
        $this->createIndex('{{%idx-menu_item-parent}}', '{{%menu_items}}', ['parent_id']);
        $this->addForeignKey(
            'fk_menu_item_to_parent',
            '{{%menu_items}}',
            'parent_id',
            '{{%menu_items}}',
            'id',
            'NO ACTION',
            'CASCADE'
        );

        // If exist module `Users` set foreign key `created_by`, `updated_by` to `users.id`
        if (class_exists('\wdmg\users\models\Users')) {
            $this->createIndex('{{%idx-menu_item-created}}','{{%menu_items}}', ['created_by'],false);
            $this->createIndex('{{%idx-menu_item-updated}}','{{%menu_items}}', ['updated_by'],false);
            $userTable = \wdmg\users\models\Users::tableName();
            $this->addForeignKey(
                'fk_menu_item_to_users1',
                '{{%menu_items}}',
                'created_by',
                $userTable,
                'id',
                'NO ACTION',
                'CASCADE'
            );
            $this->addForeignKey(
                'fk_menu_item_to_users2',
                '{{%menu_items}}',
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

        $this->dropIndex('{{%idx-menu_item}}', '{{%menu_items}}');
        $this->dropForeignKey(
            'fk_menu_item',
            '{{%menu_items}}'
        );

        $this->dropIndex('{{%idx-menu_item-parent}}', '{{%menu_items}}');
        $this->dropColumn('{{%menu_items}}', 'parent_id');
        $this->dropForeignKey(
            'fk_menu_item_to_parent',
            '{{%menu_items}}'
        );

        if (class_exists('\wdmg\users\models\Users')) {
            $this->dropIndex('{{%idx-menu_item-created}}', '{{%menu_items}}');
            $this->dropIndex('{{%idx-menu_item-updated}}', '{{%menu_items}}');
            $userTable = \wdmg\users\models\Users::tableName();
            if (!(Yii::$app->db->getTableSchema($userTable, true) === null)) {
                $this->dropForeignKey(
                    'fk_menu_item_to_users1',
                    '{{%menu_items}}'
                );
                $this->dropForeignKey(
                    'fk_menu_item_to_users2',
                    '{{%menu_items}}'
                );
            }
        }

        $this->truncateTable('{{%menu_items}}');
        $this->dropTable('{{%menu_items}}');
    }

}
