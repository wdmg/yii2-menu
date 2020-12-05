<?php

use yii\helpers\Html;
use yii\helpers\Url;
use yii\widgets\ActiveForm;
use wdmg\widgets\SelectInput;

/* @var $this yii\web\View */
/* @var $model wdmg\menu\models\Menu */
/* @var $form yii\widgets\ActiveForm */
?>

<div class="menu-form row">
<?php if ($model->id) : ?>
    <div class="col-xs-12 col-sm-12 col-md-8 col-lg-9">
<?php else : ?>
    <div class="col-xs-12">
<?php endif; ?>
    <?php $form = ActiveForm::begin([
        'id' => "addMenuForm",
        'enableAjaxValidation' => true,
        'options' => [
            'enctype' => 'multipart/form-data'
        ]
    ]); ?>

    <?= $form->field($model, 'name'); ?>

    <?= $form->field($model, 'alias')->textInput([
        'disabled' => ($model->id) ? true : false,
        'maxlength' => true
    ]); ?>

    <?= $form->field($model, 'description')->textarea(['rows' => 2]) ?>

    <?php if ($model->id) : ?>
        <div class="form-group">
            <label for="menuItems"><?= Yii::t('app/modules/menu', 'Menu items') ?></label>
            <?php if ($count = count($model->getMenuItems())) : ?>
                <div id="menuItems" class="panel-group menu-items" role="tablist" aria-multiselectable="true"></div>
            <?php else : ?>
                <div id="menuItems" class="panel-group menu-items no-items" role="tablist" aria-multiselectable="true"><?= Yii::t('app/modules/menu', 'Add menu items from the right column.') ?></div>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <?= $form->field($model, 'status')->widget(SelectInput::class, [
        'items' => $model->getStatusesList(false),
        'options' => [
            'class' => 'form-control'
        ]
    ]); ?>
        <hr/>
        <div class="form-group">
            <?= Html::a(Yii::t('app/modules/menu', '&larr; Back to list'), ['list/index'], ['class' => 'btn btn-default pull-left']) ?>&nbsp;
            <?= Html::submitButton(Yii::t('app/modules/menu', 'Save'), ['class' => 'btn btn-success pull-right']) ?>
        </div>
    <?php ActiveForm::end(); ?>
    </div>
<?php if ($model->id) : ?>
    <div class="col-xs-12 col-sm-12 col-md-4 col-lg-3">
        <fieldset>
            <label for="menuSources"><?= Yii::t('app/modules/menu', 'Available items') ?></label>
            <div id="menuSources" class="panel-group menu-sources" role="tablist" aria-multiselectable="true">
                <div class="panel panel-default">
                    <div class="panel-heading" role="tab" id="heading-links">
                        <h4 class="panel-title">
                            <a role="button" data-toggle="collapse" data-parent="#menuSources" href="#collapse-links" aria-expanded="true" aria-controls="collapse-links">
                                <?= Yii::t('app/modules/menu', 'Links') ?>
                            </a>
                        </h4>
                    </div>
                    <div id="collapse-links" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="heading-links">
                        <div class="panel-body">
                            //...
                        </div>
                    </div>
                </div>
            <?php
                if ($sources = $model->getSourcesList(false)) {
                    foreach ($sources as $source) { ?>
                        <div class="panel panel-default">
                            <div class="panel-heading" role="tab" id="heading-<?= $source['id']; ?>">
                                <h4 class="panel-title">
                                    <a role="button" data-toggle="collapse" data-parent="#menuSources"
                                       href="#collapse-<?= $source['id']; ?>" aria-expanded="false"
                                       aria-controls="collapseOne">
                                        <?= $source['name']; ?> (<?= count($source['items']); ?>)
                                    </a>
                                </h4>
                            </div>
                            <div id="collapse-<?= $source['id']; ?>" class="panel-collapse collapse" role="tabpanel"
                                 aria-labelledby="heading-<?= $source['id']; ?>">
                                <div class="panel-body">
                                    <ul class="list-unstyled source-list">
                                        <?php foreach ($source['items'] as $item) { ?>
                                            <div class="checkbox">
                                                <label for="checkbox-<?= $source['id']; ?>-<?= $item['id']; ?>">
                                                    <?= Html::input('checkbox', $source['id'] . '-' . $item['id'], $item['id'], [
                                                        'id' => "checkbox-" . $source['id'] . "-" . $item['id'],
                                                        'title' => $item['title'],
                                                        'data' => [
                                                            'id' => $item['id'],
                                                            'source' => $source['id'],
                                                            'name' => $item['name'],
                                                            'title' => $item['title'],
                                                            'url' => $item['url'],
                                                        ],
                                                    ]); ?>
                                                    <?= $item['name'] . '&nbsp;<span class="pull-right">' . Html::a('Open link', $item['url'], [
                                                        'target' => '_blank',
                                                        'data' => [
                                                            'key' => $item['id'],
                                                            'pjax' => 0,
                                                        ],
                                                    ]) . '</span>'; ?>
                                                </label>
                                            </div>
                                        <?php } ?>
                                    </ul>
                                    <hr/>
                                    <div class="form-group">
                                        <div class="checkbox pull-right">
                                            <label for="selectall-<?= $source['id']; ?>">
                                                <?= Html::input('checkbox', 'select-all', 'true', [
                                                    'id' => 'selectall-'.$source['id']
                                                ]); ?>
                                                <?= Yii::t('app/modules/menu', '- Select all'); ?>
                                            </label>
                                        </div>
                                        <button class="btn btn-primary btn-sm" type="button" data-rel="add"><?= Yii::t('app/modules/menu', 'Add to menu'); ?></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <?php
                    }
                }
            ?>
            </div>
        </fieldset>
    </div>
<?php endif; ?>
</div>
<?php $this->registerJs(<<< JS
$(document).ready(function() {
    function afterValidateAttribute(event, attribute, messages)
    {
        if (attribute.name && !attribute.alias && messages.length == 0) {
            var form = $(event.target);
            $.ajax({
                    type: form.attr('method'),
                    url: form.attr('action'),
                    data: form.serializeArray(),
                }
            ).done(function(data) {
                if (data.alias && form.find('#menu-alias').val().length == 0) {
                    form.find('#menu-alias').val(data.alias);
                    form.yiiActiveForm('validateAttribute', 'menu-alias');
                }
            });
            return false;
        }
    }
    $("#addMenuForm").on("afterValidateAttribute", afterValidateAttribute);
});
JS
); ?>

<?php if ($model->item) : ?>
<template id="itemFormTemplate">
    <?php $itemForm = ActiveForm::begin([
        'id' => "menuItemForm-{{source}}-{{id}}",
        'enableAjaxValidation' => true,
        'options' => [
            'enctype' => 'multipart/form-data'
        ]
    ]); ?>
    <?= $itemForm->field($model->item, 'name')->textInput(['value' => '{{name}}']); ?>
    <?= $itemForm->field($model->item, 'title')->textInput(['value' => '{{title}}']); ?>
    <?= $itemForm->field($model->item, 'url')->textInput(['value' => '{{url}}']); ?>
    <?= $itemForm->field($model->item, 'only_auth', [
        'template' => '<div class="col-xs-12">{input} - {label}</div><div class="col-xs-12"><small>{error}</small></div>',
    ])->checkbox(['label' => null])->label(Yii::t('app/modules/menu', 'Only for signed users')) ?>
    <?= $itemForm->field($model->item, 'target_blank', [
        'template' => '<div class="col-xs-12">{input} - {label}</div><div class="col-xs-12"><small>{error}</small></div>',
    ])->checkbox(['label' => null])->label(Yii::t('app/modules/menu', 'Open as target _blank')) ?>
    <?= $itemForm->field($model->item, 'parent_id')->hiddenInput(['value' => '{{parent_id}}'])->label(false); ?>
    <?= $itemForm->field($model->item, 'menu_id')->hiddenInput(['value' => $model->id])->label(false); ?>
    <?= $itemForm->field($model->item, 'type')->hiddenInput(['value' => '{{source}}'])->label(false); ?>
    <?= $itemForm->field($model->item, 'source_id')->hiddenInput(['value' => '{{id}}'])->label(false); ?>
    <div class="form-group row">
        <label for="itemSource" class="col-sm-2 col-form-label"><?= Yii::t('app/modules/menu', 'Source of') ?>:</label>
        <div class="col-sm-10 form-control-plaintext">
            <a href="{{url}}" id="itemSource" target="_blank" data-pjax="0">{{url}}</a>
        </div>
    </div>
    <hr/>
    <div class="toolbar" role="toolbar">
        <div class="form-group" role="group">
            <?= Html::button(Yii::t('app/modules/menu', 'Save changes'), ['class' => 'btn btn-primary']) ?>
        </div>
        <div class="form-group" role="group">
            <?= Html::a(
                Yii::t('app/modules/menu', 'Out of') . ' <i class="fa fa-reply"></i>',
                '#',
                ['class' => 'btn btn-link', 'role' => 'button']
            ); ?>
            <?= Html::a(
                Yii::t('app/modules/menu', 'Up one') . ' <i class="fa fa-arrow-up"></i>',
                '#',
                ['class' => 'btn btn-link', 'role' => 'button']
            ); ?>
            <?= Html::a(
                Yii::t('app/modules/menu', 'Down one') . ' <i class="fa fa-arrow-down"></i>',
                '#',
                ['class' => 'btn btn-link', 'role' => 'button']
            ); ?>
        </div>
        <div class="form-group" role="group">
            <?= Html::a(
                Yii::t('app/modules/menu', 'Remove') . ' <i class="fa fa-trash"></i>',
                '#',
                ['class' => 'btn btn-link text-danger', 'role' => 'button']
            ); ?>
            <?= Html::a(
                Yii::t('app/modules/menu', 'Close') . ' <i class="fa fa-times"></i>',
                '#',
                ['class' => 'btn btn-link', 'role' => 'button']
            ); ?>
        </div>
    </div>
    <?php ActiveForm::end(); ?>
</template>
<?php endif; ?>
<template id="menuItemTemplate">
    <div id="menuItem-{{id}}" class="panel panel-default">
        <div class="panel-heading" role="tab" id="menuItemHeading-{{id}}">
            <h4 class="panel-title">
                <a role="button" data-toggle="collapse" data-parent="#menuItems" href="#menuItemCollapse-{{id}}" aria-expanded="true" aria-controls="menuItemCollapse-{{id}}">
                    {{name}}
                    <span class="text-muted pull-right">{{source}}</span>
                </a>
            </h4>
        </div>
        <div id="menuItemCollapse-{{id}}" class="panel-collapse collapse" role="tabpanel" aria-labelledby="menuItemHeading-{{id}}">
            <div class="panel-body">
                {{form}}
            </div>
        </div>
    </div>
</template>