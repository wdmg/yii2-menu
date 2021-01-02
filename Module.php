<?php

namespace wdmg\menu;

/**
 * Yii2 Menu module
 *
 * @category        Module
 * @version         1.0.1
 * @author          Alexsander Vyshnyvetskyy <alex.vyshnyvetskyy@gmail.com>
 * @link            https://github.com/wdmg/yii2-menu
 * @copyright       Copyright (c) 2019 - 2021 W.D.M.Group, Ukraine
 * @license         https://opensource.org/licenses/MIT Massachusetts Institute of Technology (MIT) License
 *
 */

use Yii;
use wdmg\base\BaseModule;
use yii\base\InvalidConfigException;

/**
 * Menu module definition class
 */
class Module extends BaseModule
{
    /**
     * {@inheritdoc}
     */
    public $controllerNamespace = 'wdmg\menu\controllers';

    /**
     * {@inheritdoc}
     */
    public $defaultRoute = "list/index";

    /**
     * @var string, the name of module
     */
    public $name = "Menu";

    /**
     * @var string, the description of module
     */
    public $description = "Menu module";

    /**
     * @var array list of supported models for displaying a sitemap
     */
    public $supportModels = [
        'pages' => 'wdmg\pages\models\Pages',
        'news' => 'wdmg\news\models\News',
        'blog' => 'wdmg\blog\models\Posts'
    ];

    /**
     * @var string the module version
     */
    private $version = "1.0.1";

    /**
     * @var integer, priority of initialization
     */
    private $priority = 8;

    /**
     * {@inheritdoc}
     */
    public function init()
    {
        parent::init();

        // Set version of current module
        $this->setVersion($this->version);

        // Set priority of current module
        $this->setPriority($this->priority);

        if (!Yii::$app instanceof \yii\console\Application) {
            // Set assets bundle, if not loaded
            if ($this->isBackend() && !$this->isConsole()) {
                if (!isset(Yii::$app->assetManager->bundles['wdmg\menu\MenuAsset']))
                    Yii::$app->assetManager->bundles['wdmg\menu\MenuAsset'] = \wdmg\menu\MenuAsset::register(Yii::$app->view);
            }
        }
    }

    /**
     * {@inheritdoc}
     */
    public function dashboardNavItems($createLink = false)
    {
        $items = [
            'label' => $this->name,
            'url' => [$this->routePrefix . '/'. $this->id],
            'icon' => 'fa fa-fw fa-stream',
            'active' => in_array(\Yii::$app->controller->module->id, [$this->id])
        ];

        return $items;
    }

    /**
     * {@inheritdoc}
     */
    public function bootstrap($app) {
        parent::bootstrap($app);

        if (isset(Yii::$app->params["menu.supportModels"]))
            $this->supportModels = Yii::$app->params["menu.supportModels"];

        if (!isset($this->supportModels))
            throw new InvalidConfigException("Required module property `supportModels` isn't set.");

        // Configure module component
        $app->setComponents([
            'menu' => [
                'class' => 'wdmg\menu\components\Menu'
            ]
        ]);
    }
}