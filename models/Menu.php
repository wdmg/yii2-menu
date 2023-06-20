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
use wdmg\base\models\ActiveRecordML;
use wdmg\menu\models\MenuItems;

/**
 * This is the model class for table "{{%menu}}".
 *
 * @property int $id
 * @property int $source_id
 * @property string $title
 * @property string $description
 * @property string $alias
 * @property int $status
 * @property string $locale
 * @property string $created_at
 * @property integer $created_by
 * @property string $updated_at
 * @property integer $updated_by
 */
    
class Menu extends ActiveRecordML
{

    const STATUS_DRAFT = 0;
    const STATUS_PUBLISHED = 1;

    private $module;
    public $items;
    public $use_locale;

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
            ['use_locale', 'boolean'],
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
            'source_id' => Yii::t('app/modules/menu', 'Source ID'),
            'name' => Yii::t('app/modules/menu', 'Menu name'),
            'description' => Yii::t('app/modules/menu', 'Description'),
            'alias' => Yii::t('app/modules/menu', 'Alias'),
            'items' => Yii::t('app/modules/menu', 'Items'),
            'status' => Yii::t('app/modules/menu', 'Status'),
            'locale' => Yii::t('app/modules/menu', 'Locale'),
            'use_locale' => Yii::t('app/modules/menu', '- Show elements for the current language'),
            'created_at' => Yii::t('app/modules/menu', 'Created at'),
            'created_by' => Yii::t('app/modules/menu', 'Created by'),
            'updated_at' => Yii::t('app/modules/menu', 'Updated at'),
            'updated_by' => Yii::t('app/modules/menu', 'Updated by'),
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function afterFind()
    {
        $this->items = self::getItems($this->id, $this->locale, false, true);
        parent::afterFind();
    }

    /**
     * {@inheritdoc}
     */
    public function afterSave($insert, $changedAttributes)
    {

        if (is_string($this->status))
            $this->status = intval($this->status);

        if (is_string($this->items) && JsonValidator::isValid($this->items)) {
            $this->items = \yii\helpers\Json::decode($this->items);
            $menuItems = \wdmg\helpers\ArrayHelper::flattenTree($this->items, 'children', 'parent_id');

            MenuItems::deleteAll(['menu_id' => $this->id]);

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

                if (isset($item['source_url']))
                    $model->source_url = $item['source_url'];

                if (isset($item['source_type']))
                    $model->source_type = $item['source_type'];

                if (isset($item['source_id']))
                    $model->source_id = $item['source_id'];

                if (isset($item['source_id']))
                    $model->source_id = intval($item['source_id']);

                if (isset($item['only_auth']))
                    $model->only_auth = intval($item['only_auth']);

                if (isset($item['target_blank']))
                    $model->target_blank = intval($item['target_blank']);

                if ($model->validate()) {
                    if ($model->save()) {
                        $allParents[$key] = $model->id;
                    }
                } else {
                    $errors[] = $model->errors;
                }
            }
        }

        parent::afterSave($insert, $changedAttributes);
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

    /**
     * Returns a list of menu items. If the ID is specified as a string, we will search for the menu alias,
     * otherwise, by primary key.
     *
     * @param null $menu_id
     * @param null $locale
     * @param bool $published
     * @param bool $asJson
     * @return array|false|string|\yii\db\ActiveRecord[]
     */
    public function getItems($menu_id = null, $locale = null, $published = false, $asJson = false)
        {

        if (is_int($menu_id))
            $items = MenuItems::find()->where(['menu_id' => $menu_id]);
        else if (is_string($menu_id))
            $items = MenuItems::find()->where(['alias' => $menu_id]);
        else
            $items = MenuItems::find()->where(['menu_id' => $this->id]);

        $items->joinWith('menu');

        if ($locale)
            $items->andWhere(['locale' => $locale]);

        if ($published)
            $items->andWhere(['status' => self::STATUS_PUBLISHED]);

        $items->orderBy(['id' => SORT_ASC]);
        return ($asJson) ? json_encode($items->asArray()->all()) : $items->all();
    }

    /**
     * Returns a list of supported resources for building a widget for adding new menu items.
     *
     * @param bool $asJson
     * @return array|false|string
     */
    public function getSourcesList($asJson = false)
    {
        $list = [];
        if (is_array($models = $this->module->supportModels)) {

            $cond = (isset($this->locale) && $this->use_locale) ? ['locale' => $this->locale] : [];
            $sourceTypes = MenuItems::getTypesList(false, true);
            foreach ($models as $name => $class) {
                $model = new $class();

                $items = [];
                foreach ($model->getAllPublished($cond) as $item) { // @TODO: Add condition by lang locale
                    if (!is_null($item->url) && !isset($items[$item->url])) {
                        $items[] = [
                            'id' => $item->id,
                            'name' => $item->name,
                            'title' => $item->title,
                            'url' => $item->url
                        ];
                    }
                };

                $instance = $this->module->moduleLoaded($model->moduleId, true);
                $list[] = [
                    'id' => array_search($model->moduleId, $sourceTypes),
                    'type' => $model->moduleId,
                    'name' => $instance->name,
                    'route' => $model->baseRoute,
                    'items' => $items,
                ];
            }
        }

        return ($asJson) ? json_encode($list) : $list;
    }
}