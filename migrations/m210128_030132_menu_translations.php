<?php

use yii\db\Migration;

/**
 * Class m210128_030132_menu_translations
 */
class m210128_030132_menu_translations extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $defaultLocale = null;
        if (isset(Yii::$app->sourceLanguage))
            $defaultLocale = Yii::$app->sourceLanguage;

        if (is_null($this->getDb()->getSchema()->getTableSchema('{{%menu}}')->getColumn('source_id'))) {
            $this->addColumn('{{%menu}}', 'source_id', $this->integer(11)->null()->after('id'));

            // Setup foreign key to source id
            $this->createIndex('{{%idx-menu-source}}', '{{%menu}}', ['source_id']);
            $this->addForeignKey(
                'fk_menu_to_source',
                '{{%menu}}',
                'source_id',
                '{{%menu}}',
                'id',
                'NO ACTION',
                'CASCADE'
            );

        }

        if (is_null($this->getDb()->getSchema()->getTableSchema('{{%menu}}')->getColumn('locale'))) {
            $this->addColumn('{{%menu}}', 'locale', $this->string(10)->defaultValue($defaultLocale)->after('status'));
            $this->createIndex('{{%idx-menu-locale}}', '{{%menu}}', ['locale']);

            // If module `Translations` exist setup foreign key `locale` to `trans_langs.locale`
            if (class_exists('\wdmg\translations\models\Languages')) {
                $langsTable = \wdmg\translations\models\Languages::tableName();
                $this->addForeignKey(
                    'fk_menu_to_langs',
                    '{{%menu}}',
                    'locale',
                    $langsTable,
                    'locale',
                    'NO ACTION',
                    'CASCADE'
                );
            }
        }
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        if (!is_null($this->getDb()->getSchema()->getTableSchema('{{%menu}}')->getColumn('source_id'))) {
            $this->dropIndex('{{%idx-menu-source}}', '{{%menu}}');
            $this->dropColumn('{{%menu}}', 'source_id');
            $this->dropForeignKey(
                'fk_menu_to_source',
                '{{%menu}}'
            );
        }

        if (!is_null($this->getDb()->getSchema()->getTableSchema('{{%menu}}')->getColumn('locale'))) {
            $this->dropIndex('{{%idx-menu-locale}}', '{{%menu}}');
            $this->dropColumn('{{%menu}}', 'locale');

            if (class_exists('\wdmg\translations\models\Languages')) {
                $langsTable = \wdmg\translations\models\Languages::tableName();
                if (!(Yii::$app->db->getTableSchema($langsTable, true) === null)) {
                    $this->dropForeignKey(
                        'fk_menu_to_langs',
                        '{{%menu}}'
                    );
                }
            }
        }
    }
}
