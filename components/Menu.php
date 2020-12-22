<?php

namespace wdmg\menu\components;


/**
 * Yii2 Menu
 *
 * @category        Component
 * @version         0.0.1
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
/*
    private function buildMenuTree($items, $data = null) {

        if (!$data)
            $data = [];

        if (is_countable($items)) {
            foreach ($items as $item) {

                if (isset($item['only_auth'])) {
                    if ($item['only_auth'] && Yii::$app->user->isGuest)
                        continue;
                }

                if (isset($item['parent_id'])) {
                    $parent_id= $item['parent_id'];
                    if (isset($data[$parent_id])) {
                        $data[$parent_id]['items'][] = [
                            'label' => $item['name'],
                            'url' => ($item['source_url']) ? $item['source_url'] : '#',
                            'linkOptions' => [
                                'title' => ($item['title']) ? Html::encode($item['title']) : null,
                                'target' => ($item['target_blank']) ? "blank" : null
                            ],
                        ];
                    }
                } else {
                    $data[$item['id']] = [
                        'label' => $item['name'],
                        'url' => ($item['source_url']) ? $item['source_url'] : '#',
                        'linkOptions' => [
                            'title' => ($item['title']) ? Html::encode($item['title']) : null,
                            'target' => ($item['target_blank']) ? "blank" : null
                        ],
                    ];
                }

            }

            return $data;
        }
    }
*/
    /**
     * Menu of component method
     *
     * @return array|null
     */
    public function getItems($menu_id)
    {
        $data = [];
        $items = $this->model->getItems($menu_id);
        $items = ArrayHelper::toArray($items);

        if (is_countable($items)) {
            $menuTree = ArrayHelper::buildTree($items);
            $menuTree = ArrayHelper::changeKey($menuTree, ['name' => 'label']);
            var_export($menuTree);
            return $menuTree;
        }

        return false;
    }
}

?>