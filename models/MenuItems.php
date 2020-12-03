<?php

namespace wdmg\menu\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\Expression;
use yii\helpers\ArrayHelper;
use yii\helpers\Json;
use yii\behaviors\TimestampBehavior;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\SluggableBehavior;
use wdmg\base\models\ActiveRecord;

/**
 * This is the model class for table "{{%menu}}".
 *
 * @property int $id
 * @property int $menu_id
 * @property int $parent_id
 * @property string $name
 * @property string $title
 * @property int $type
 * @property string $url
 * @property string $source
 * @property string $created_at
 * @property integer $created_by
 * @property string $updated_at
 * @property integer $updated_by
 */

class MenuItems extends ActiveRecord
{

    const TYPE_LINK = 0;
    const TYPE_PAGE = 1;
    const TYPE_NEWS = 2;
    const TYPE_BLOG = 3;

    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return '{{%menu_items}}';
    }

    /**
     * {@inheritdoc}
     */
    public function behaviors()
    {
        $behaviors = [
            'timestamp' => [
                'class' => TimestampBehavior::class,
                'attributes' => [
                    self::EVENT_BEFORE_INSERT => 'created_at',
                    self::EVENT_BEFORE_UPDATE => 'updated_at',
                ],
                'value' => new Expression('NOW()'),
            ],
            'sluggable' =>  [
                'class' => SluggableBehavior::class,
                'attribute' => ['title'],
                'slugAttribute' => 'alias',
                'skipOnEmpty' => true,
                'immutable' => true
            ],
            'blameable' =>  [
                'class' => BlameableBehavior::class,
                'createdByAttribute' => 'created_by',
                'updatedByAttribute' => 'updated_by',
            ]
        ];

        return ArrayHelper::merge(parent::behaviors(), $behaviors);
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        $rules = [
            [['title', 'alias', 'status'], 'required'],
            [['title', 'alias'], 'string', 'min' => 3, 'max' => 64],
            ['description', 'string', 'max' => 255],
            ['status', 'integer'],
            ['status', 'in', 'range' => array_keys($this->getTypesList(false))],
            ['alias', 'match', 'skipOnEmpty' => true, 'pattern' => '/^[A-Za-z0-9\-\_]+$/', 'message' => Yii::t('app/modules/menu','It allowed only Latin alphabet, numbers and the «-», «_» characters.')],
            [['created_at', 'updated_at'], 'safe'],
        ];

        if (class_exists('\wdmg\users\models\Users') && (Yii::$app->hasModule('admin/users') || Yii::$app->hasModule('users'))) {
            $rules[] = [['created_by', 'updated_by'], 'safe'];
        }

        return ArrayHelper::merge(parent::rules(), $rules);
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => Yii::t('app/modules/menu', 'ID'),
            'menu_id' => Yii::t('app/modules/menu', 'Menu ID'),
            'parent_id' => Yii::t('app/modules/menu', 'Parent ID'),
            'name' => Yii::t('app/modules/menu', 'Name'),
            'title' => Yii::t('app/modules/menu', 'Title'),
            'type' => Yii::t('app/modules/menu', 'Type'),
            'url' => Yii::t('app/modules/menu', 'Url'),
            'source' => Yii::t('app/modules/menu', 'Source'),
            'created_at' => Yii::t('app/modules/menu', 'Created at'),
            'created_by' => Yii::t('app/modules/menu', 'Created by'),
            'updated_at' => Yii::t('app/modules/menu', 'Updated at'),
            'updated_by' => Yii::t('app/modules/menu', 'Updated by'),
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function beforeSave($insert)
    {

        if (is_string($this->status))
            $this->status = intval($this->status);

        return parent::beforeSave($insert);
    }

    /**
     * @return array
     */
    public function getTypesList($allStatuses = false)
    {
        $list = [];
        if ($allStatuses) {
            $list = [
                '*' => Yii::t('app/modules/menu', 'All types')
            ];
        }

        $list = ArrayHelper::merge($list, [
            self::TYPE_LINK => Yii::t('app/modules/menu', 'Custom Link'),
            self::TYPE_PAGE => Yii::t('app/modules/menu', 'Inner Page'),
            self::TYPE_NEWS => Yii::t('app/modules/menu', 'News Item'),
            self::TYPE_BLOG => Yii::t('app/modules/menu', 'Blog Post'),
        ]);

        return $list;
    }

    /**
     * Finds the model based on its primary key value.
     * If the model is not found, null will be returned.
     *
     * @param integer/string $id or string of $alias
     * @return ActiveRecord model or null
     */
    public static function findModel($id)
    {
        if (is_integer($id)) {
            if (($model = self::findOne(['id' => intval($id)])) !== null)
                return $model;
        } else if (is_string($id)) {
            if (($model = self::findOne(['alias' => trim($id)])) !== null)
                return $model;
        }

        return null;
    }
}