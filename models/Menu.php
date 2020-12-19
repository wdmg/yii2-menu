<?php

namespace wdmg\menu\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\Expression;
use yii\helpers\ArrayHelper;
use yii\helpers\Json;
use yii\behaviors\TimestampBehavior;
use yii\behaviors\BlameableBehavior;
use wdmg\validators\JsonValidator;
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

    private $module;
    public $item;
    public $items;

    /**
     * {@inheritdoc}
     */
    public function init()
    {
        parent::init();
        if (!$this->module = Yii::$app->getModule('admin/menu'))
            $this->module = Yii::$app->getModule('menu');

    }

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
            ['items', JsonValidator::class, 'message' => Yii::t('app/modules/menu', 'The value of field `{attribute}` must be a valid JSON, error: {error}.')],
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
    public function beforeValidate()
    {
        /*if (is_string($this->items) && JsonValidator::isValid($this->items)) {
            $this->items = \yii\helpers\Json::decode($this->items);
        } elseif (is_array($this->items)) {
            $this->items = \yii\helpers\Json::encode($this->items);
        }*/

        return parent::beforeValidate();
    }

    /**
     * {@inheritdoc}
     */
    public function afterFind()
    {
        $this->items = self::getItems($this->id, true);
        parent::afterFind();
    }

    /**
     * {@inheritdoc}
     */
    public function beforeSave($insert)
    {

        if (is_string($this->status))
            $this->status = intval($this->status);

        if (is_string($this->items) && JsonValidator::isValid($this->items)) {
            $this->items = \yii\helpers\Json::decode($this->items);
            $menuItems = \wdmg\helpers\ArrayHelper::flattenTree($this->items, 'children', 'parent_id');

            $errors = [];
            $allParents = [];
            foreach($menuItems as $key => $item) {

                unset($item['id']);

                $model = new MenuItems();
                $sourceTypes = $model->getTypesList(false, true);

                //$model->id = 0;
                $model->menu_id = $this->id;

                if (isset($item['parent_id'])) {
                    $parent_id = $item['parent_id'];
                    if (isset($allParents[$parent_id]))
                        $model->parent_id = $allParents[$parent_id];
                    else
                        $model->parent_id = null;
                }

                if (isset($item['name']))
                    $model->name = $item['name'];

                if (isset($item['title']))
                    $model->title = $item['title'];

                if (isset($item['url']))
                    $model->source_url = $item['url'];


                if (isset($item['type'])) {
                    if ($type = array_search($item['type'], $sourceTypes))
                        $model->source_type = array_search($item['type'], $sourceTypes);
                    else
                        $model->source_type = 0; // Default type for unrecornized menu items
                }

                if (isset($item['source_id']))
                    $model->source_id = intval($item['source_id']);

                if (isset($item['only_auth']))
                    $model->only_auth = intval($item['only_auth']);

                if (isset($item['target_blank']))
                    $model->target_blank = intval($item['target_blank']);

                if ($model->validate()) {
                    if ($model->save()) {
                        $parents[$key] = $model->id;
                    }
                } else {
                    $errors[] = $model->errors;
                }
            }

            //var_export($errors);
        }

        return parent::beforeSave($insert);
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

    public function getItems($menu_id = null, $asJson = false)
    {
        if ($menu_id)
            $items = MenuItems::find()->where(['menu_id' => $menu_id]);
        else
            $items = MenuItems::find()->where(['menu_id' => $this->id]);

        return ($asJson) ? json_encode($items->asArray()->all()) : $items->all();
    }

    public function getSourcesList($asJson = false)
    {
        $list = [];
        if (is_array($models = $this->module->supportModels)) {
            foreach ($models as $name => $class) {
                $model = new $class();

                $items = [];
                foreach ($model->getAllPublished() as $item) { // @TODO: Add condition by lang locale
                    if (!is_null($item->url) && !isset($items[$item->url])) {
                        $items[] = [
                            'id' => $item->id,
                            'name' => $item->name,
                            'title' => $item->title,
                            'url' => $item->url
                        ];
                    }
                };

                //$instance = $model->getModule(true);
                $instance = $this->module->moduleLoaded($model->moduleId, true);

                $list[] = [
                    'id' => $model->moduleId,
                    'name' => $instance->name,
                    'route' => $model->baseRoute,
                    'items' => $items,
                ];
            }
        }

        return ($asJson) ? json_encode($list) : $list;
    }
}