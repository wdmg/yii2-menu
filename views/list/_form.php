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
            'enctype' => 'multipart/form-data',
            'data' => [
                'model' => \yii\helpers\StringHelper::basename(get_class($model))
            ]
        ]
    ]); ?>

    <?= $form->field($model, 'name'); ?>

    <?= $form->field($model, 'alias')->textInput([
        'disabled' => ($model->id && $model->status == $model::STATUS_PUBLISHED) ? true : false,
        'maxlength' => true
    ]); ?>

    <?= $form->field($model, 'description')->textarea(['rows' => 2]) ?>

    <?php if ($model->id) : ?>
        <div class="form-group drag-menu">
            <label for="menuItems"><?= Yii::t('app/modules/menu', 'Menu items') ?></label>
            <?php if ($count = count($model->getMenuItems())) : ?>
                <ul id="menuItems" class="panel-group menu-items" role="tablist" aria-multiselectable="true"></ul>
            <?php else : ?>
                <ul id="menuItems" class="panel-group menu-items no-items" role="tablist" aria-multiselectable="true"><?= Yii::t('app/modules/menu', 'Add menu items from the right column.') ?></ul>
            <?php endif; ?>
            <div class="droppable delete-area">Delete Item</div>
            <textarea id="menuOptions" class="form-control-plaintext" rows="12" readonly></textarea>
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
            <?php if ($model->item) : ?>
                <div class="panel panel-default">
                    <div class="panel-heading" role="tab" id="heading-link">
                        <h4 class="panel-title">
                            <a role="button" data-toggle="collapse" data-parent="#menuSources" href="#collapse-link" aria-expanded="true" aria-controls="collapse-link">
                                <?= Yii::t('app/modules/menu', 'Custom link') ?>
                            </a>
                        </h4>
                    </div>
                    <div id="collapse-link" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="heading-link">
                        <div class="panel-body">
                            <?php $linkForm = ActiveForm::begin([
                                'id' => "addMenuItemForm",
                                'enableAjaxValidation' => true,
                                'options' => [
                                    'enctype' => 'multipart/form-data',
                                    'data' => [
                                        'model' => \yii\helpers\StringHelper::basename(get_class($model->item))
                                    ]
                                ]
                            ]); ?>
                            <?= $linkForm->field($model->item, 'name')->textInput(); ?>
                            <?= $linkForm->field($model->item, 'title')->textInput(); ?>
                            <?= $linkForm->field($model->item, 'url')->textInput(); ?>
                            <?= $linkForm->field($model->item, 'only_auth', [
                                'template' => '{input} - {label}{error}',
                            ])->checkbox(['label' => null])->label(Yii::t('app/modules/menu', 'Only for signed users')) ?>
                            <?= $linkForm->field($model->item, 'target_blank', [
                                'template' => '{input} - {label}{error}',
                            ])->checkbox(['label' => null])->label(Yii::t('app/modules/menu', 'Open as target _blank')) ?>
                            <?= $linkForm->field($model->item, 'type')->hiddenInput(['value' => $model->item::TYPE_LINK])->label(false); ?>
                            <hr/>
                            <div class="form-group">
                                <button class="btn btn-primary btn-sm" type="button" data-rel="add" disabled="true"><?= Yii::t('app/modules/menu', 'Add to menu'); ?></button>
                            </div>
                            <?php ActiveForm::end(); ?>
                        </div>
                    </div>
                </div>
            <?php endif; ?>
            <?php
                if ($sources = $model->getSourcesList(false)) {
                    foreach ($sources as $source) { ?>
                        <div class="panel panel-default">
                            <div class="panel-heading" role="tab" id="heading-<?= $source['id']; ?>">
                                <h4 class="panel-title">
                                    <a role="button" data-toggle="collapse" data-parent="#menuSources"
                                       href="#collapse-<?= $source['id']; ?>" aria-expanded="false"
                                       aria-controls="collapseOne">
                                        <?= $source['name']; ?> <span class="text-muted">(<?= count($source['items']); ?>)</span>
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
                                                            'source_name' => $source['name'],
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
                                        <button class="btn btn-primary btn-sm" type="button" data-rel="add" disabled="true"><?= Yii::t('app/modules/menu', 'Add to menu'); ?></button>
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
    
    function afterValidateAttribute(event, attribute, messages) {
        if (attribute.name && !attribute.alias && messages.length == 0) {

            let form = $(event.target);
            let url = new URL(form.attr('action').toString(), window.location.origin);
            
            if (form.data('model'))
                url.searchParams.append('model', form.data('model'));
            
            $.ajax({
                type: form.attr('method'),
                url: url.href,
                data: form.serializeArray(),
            }).done(function(data) {
                
                console.log(data.success);
                
                if (data.success == true) {
                    form.find('button[type="submit"], button[data-rel="add"]').prop('disabled', false);
                } else {
                    form.find('button[type="submit"], button[data-rel="add"]').prop('disabled', true);
                }
                
                if (data.alias && form.find('#menu-alias').val().length == 0) {
                    form.find('#menu-alias').val(data.alias);
                    form.yiiActiveForm('validateAttribute', 'menu-alias');
                }
                
            });
            return false;
        }
    }
    
    if ($('#addMenuForm').length)
        $("#addMenuForm").on("afterValidateAttribute", afterValidateAttribute);
    
    if ($('#addMenuItemForm').length)
        $("#addMenuItemForm").on("afterValidateAttribute", afterValidateAttribute);
    
});
JS
); ?>

<?php if ($model->item) : ?>
<template id="itemFormTemplate">
    <?php $itemForm = ActiveForm::begin([
        'enableAjaxValidation' => true,
        'options' => [
            'enctype' => 'multipart/form-data',
            'data-key' => '{{source}}-{{id}}'
        ]
    ]); ?>
    <?= $itemForm->field($model->item, 'name')->textInput(['value' => '{{name}}']); ?>
    <?= $itemForm->field($model->item, 'title')->textInput(['value' => '{{title}}']); ?>
    <?= $itemForm->field($model->item, 'url')->textInput(['value' => '{{url}}']); ?>
    <?= $itemForm->field($model->item, 'only_auth', [
        'template' => '{input} - {label}{error}',
    ])->checkbox(['label' => null])->label(Yii::t('app/modules/menu', 'Only for signed users')) ?>
    <?= $itemForm->field($model->item, 'target_blank', [
        'template' => '{input} - {label}{error}',
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
                '#menuItemCollapse-{{id}}',
                ['class' => 'btn btn-link', 'role' => 'button', 'data-toggle' => "collapse"]
            ); ?>
        </div>
    </div>
    <?php ActiveForm::end(); ?>
</template>
<?php endif; ?>
<template id="menuItemTemplate">
    <li id="menuItem-{{id}}" class="panel panel-default draggable" role="presentation">
        <div class="panel-heading" role="tab" id="menuItemHeading-{{id}}">
            <h4 class="panel-title">
                <a role="button"
                   data-toggle="collapse"
                   data-parent="#menuItems"
                   data-name="{{name}}"
                   href="#menuItemCollapse-{{id}}"
                   aria-expanded="true"
                   aria-controls="menuItemCollapse-{{id}}">
                    {{name}}
                    <span class="text-muted pull-right">{{source_name}}</span>
                </a>
            </h4>
        </div>
        <div id="menuItemCollapse-{{id}}" class="panel-collapse collapse" role="tabpanel" aria-labelledby="menuItemHeading-{{id}}">
            <div class="panel-body">
                {{form}}
            </div>
        </div>
    </li>
</template>