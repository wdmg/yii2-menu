<?php

namespace wdmg\menu;
use yii\web\AssetBundle;

class MenuAsset extends AssetBundle
{
    public $sourcePath = '@vendor/wdmg/yii2-menu/assets';

    public $publishOptions = [
        'forceCopy' => YII_ENV_DEV ? true : false
    ];

    public function init()
    {
        parent::init();
        $this->css = YII_DEBUG ? ['css/menu.css'] : ['css/menu.min.css'];
        $this->js = YII_DEBUG ? ['js/menu.js'] : ['js/menu.min.js'];
        $this->depends = [\yii\web\JqueryAsset::class];
    }
}

?>