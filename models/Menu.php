<?php

namespace wdmg\menu\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\Expression;
use yii\helpers\ArrayHelper;
use yii\helpers\Json;
use yii\behaviors\TimestampBehavior;
use yii\behaviors\BlameableBehavior;
use wdmg\base\behaviors\SluggableBehavior;
use wdmg\base\models\ActiveRecord;
use wdmg\menu\models\MenuItems;

/**
 * This is the model class for table "{{%menu}}".
 *
 * @property int $id
 * @property string $title
 * @property string $description
 * @property string $alias
 * @property int $status
 * @property string $created_at
 * @property integer $created_by
 * @property string $updated_at
 * @property integer $updated_by
 */
    
class Menu extends ActiveRecord
{

    const STATUS_DRAFT = 0;
    const STATUS_PUBLISHED = 1;

    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return '{{%menu}}';
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
                'attribute' => 'name',
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
            [['name', 'alias', 'status'], 'required'],
            [['name', 'alias'], 'string', 'min' => 3, 'max' => 64],
            ['description', 'string', 'max' => 255],
            ['status', 'integer'],
            ['status', 'in', 'range' => array_keys($this->getStatusesList(false))],
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
            'name' => Yii::t('app/modules/menu', 'Menu name'),
            'description' => Yii::t('app/modules/menu', 'Description'),
            'alias' => Yii::t('app/modules/menu', 'Alias'),
            'items' => Yii::t('app/modules/menu', 'Items'),
            'status' => Yii::t('app/modules/menu', 'Status'),
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

    public function getMenuItems($menu_id = null)
    {
        if ($menu_id)
            return MenuItems::find()->where(['menu_id' => $menu_id])->all();
        else
            return MenuItems::find()->where(['menu_id' => $this->id])->all();
    }

    /**
     * @return array
     */
    public function getStatusesList($allStatuses = false)
    {
        $list = [];
        if ($allStatuses) {
            $list = [
                '*' => Yii::t('app/modules/menu', 'All statuses')
            ];
        }

        $list = ArrayHelper::merge($list, [
            self::STATUS_DRAFT => Yii::t('app/modules/menu', 'Draft'),
            self::STATUS_PUBLISHED => Yii::t('app/modules/menu', 'Published'),
        ]);

        return $list;
    }

    /**
     * @return object of \yii\db\ActiveQuery
     */
    public function getCreatedBy()
    {
        if (class_exists('\wdmg\users\models\Users'))
            return $this->hasOne(\wdmg\users\models\Users::class, ['id' => 'created_by']);
        else
            return $this->created_by;
    }

    /**
     * @return object of \yii\db\ActiveQuery
     */
    public function getUpdatedBy()
    {
        if (class_exists('\wdmg\users\models\Users'))
            return $this->hasOne(\wdmg\users\models\Users::class, ['id' => 'updated_by']);
        else
            return $this->updated_by;
    }

    /**
     * Finds the model based on its primary key value.
     * If the model is not found, null will be returned.
     *
     * @param integer/string $id or string of alias
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