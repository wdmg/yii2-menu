<?php

use wdmg\helpers\StringHelper;
use yii\helpers\Html;
use wdmg\menu\MenuAsset;

$bundle = MenuAsset::register($this);

/* @var $this yii\web\View */
/* @var $model wdmg\menu\models\Menu */

$this->title = Yii::t('app/modules/menu', 'Updating menu: {name}', [
    'name' => $model->name,
]);
$this->params['breadcrumbs'][] = ['label' => Yii::t('app/modules/menu', 'All menus'), 'url' => ['list/index']];
$this->params['breadcrumbs'][] = Yii::t('app/modules/menu', 'Updating');


?>
<div class="page-header">
    <h1><?= Html::encode($this->title) ?><small class="text-muted pull-right">[v.<?= $this->context->module->version ?>]</small></h1>
</div>
<div class="menu-update">
    <?= $this->render('_form', [
        'module' => $module,
        'menuItems' => $menuItems,
        'model' => $model
    ]); ?>
</div>