<?php

namespace wdmg\menu\components;


/**
 * Yii2 Menu
 *
 * @category        Component
 * @version         1.2.0
 * @author          Alexsander Vyshnyvetskyy <alex.vyshnyvetskyy@gmail.com>
 * @link            https://github.com/wdmg/yii2-menu
 * @copyright       Copyright (c) 2019 - 2023 W.D.M.Group, Ukraine
 * @license         https://opensource.org/licenses/MIT Massachusetts Institute of Technology (MIT) License
 *
 */

use wdmg\helpers\ArrayHelper;
use Yii;
use yii\base\Component;
use yii\helpers\Html;
use yii\helpers\Url;

class Menu extends Component
{

    protected $model;

    /**
     * Initialize the component
     */
    public function init()
    {
        parent::init();
        $this->model = new \wdmg\menu\models\Menu;
    }

    /**
     * Recursion to build a tree menu.
     *
     * @param array $items
     * @param int $parentId
     * @return array
     */
    private function buildTree(&$items = [], $parentId = 0) {
        $tree = [];
        foreach ($items as $item) {

            if (!isset($item['label']))
                continue;

            if (isset($item['auth'])) {
                if (boolval($item['auth']) && Yii::$app->user->isGuest)
                    continue;
            }

            if (is_object($item))
                $item = (array)$item;

            if ($item['parent'] == $parentId) {
                $children = $this->buildTree($items, $item['id']);

                $data = [
                    'label' => $item['label'],
                    'url' => ($item['url']) ? $item['url'] : '#'
                ];

                if (isset($item['title']))
                    $data['linkOptions']['title'] = $item['title'];

                if (isset($item['target']))
                    $data['linkOptions']['target'] = $item['target'];

                if ($children)
                    $data['items'] = $children;

                $tree[$item['id']] = $data;
                unset($items[$item['id']]);
            }
        }

        return $tree;
    }


    /**
     * Menu component, returns the items of the specified menu.
     *
     * @param $menuId
     * @param null $locale
     * @param bool $asTree
     * @return array|bool
     */
    public function getItems($menuId, $asTree = false, $locale = null)
    {

        if (is_null($locale) && isset(Yii::$app->language))
            $locale = Yii::$app->language;

        $items = $this->model->getItems($menuId, $locale, true, false);
        if (is_array($items)) {

            $items = ArrayHelper::toArray($items, [
                'wdmg\menu\models\MenuItems' => [
                    'id',
                    'parent' => 'parent_id',
                    'label' => 'name',
                    'title',
                    'url' => 'source_url',
                    'auth' => 'only_auth',
                    'target' => function ($model) {
                        if (boolval($model->target_blank))
                            return '_blank';

                    }
                ]
            ]);

            if ($asTree)
                return $this->buildTree($items);
            else
                return $items;

        }

        return false;
    }
}

?>