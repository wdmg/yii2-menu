<?php

namespace wdmg\menu\components;


/**
 * Yii2 Menu
 *
 * @category        Component
 * @version         1.0.0
 * @author          Alexsander Vyshnyvetskyy <alex.vyshnyvetskyy@gmail.com>
 * @link            https://github.com/wdmg/yii2-menu
 * @copyright       Copyright (c) 2019 - 2020 W.D.M.Group, Ukraine
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

    private function buildTree(&$items = [], $parentId = 0) {
        $tree = [];
        foreach ($items as $item) {

            if (!isset($item['name']))
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
                    'label' => $item['name'],
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
     * Menu of component method
     *
     * @param $menuId
     * @param bool $navbarTree
     * @return array|bool
     */
    public function getItems($menuId, $asTree = false)
    {
        $items = $this->model->getItems($menuId, true, false);
        if (is_countable($items)) {
            $items = ArrayHelper::toArray($items, [
                'wdmg\menu\models\MenuItems' => [
                    'id',
                    'parent' => 'parent_id',
                    'name',
                    'title',
                    'url' => 'source_url',
                    /*'source_type',
                    'source_id',*/
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