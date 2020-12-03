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

use Yii;
use yii\base\Component;

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
     * Menu of component method
     *
     * @return array|null
     */
    public function getItems($menu_id)
    {
        return $this->model->getMenuItems($menu_id);
    }
}

?>