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

    <div class="form-group">
        <label for="menuItems"><?= Yii::t('app/modules/menu', 'Menu items') ?></label>
        <?php if ($count = count($model->getMenuItems())) : ?>
            <div id="menuItems" class="menu-items"><?= Yii::t('app/modules/menu', 'Add menu items from the right column.') ?></div>
        <?php else : ?>
            <div id="menuItems" class="menu-items no-items"><?= Yii::t('app/modules/menu', 'Add menu items from the right column.') ?></div>
        <?php endif; ?>
    </div>

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
            <div class="panel-group" id="menuSources" role="tablist" aria-multiselectable="true">
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
                $sources = $model->getSourcesList(false);
                foreach ($sources as $source) { ?>
                    <div class="panel panel-default">
                        <div class="panel-heading" role="tab" id="heading-<?= $source['id']; ?>">
                            <h4 class="panel-title">
                                <a role="button" data-toggle="collapse" data-parent="#menuSources" href="#collapse-<?= $source['id']; ?>" aria-expanded="false" aria-controls="collapseOne">
                                    <?= $source['name']; ?> (<?= count($source['items']); ?>)
                                </a>
                            </h4>
                        </div>
                        <div id="collapse-<?= $source['id']; ?>" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading-<?= $source['id']; ?>">
                            <div class="panel-body">
                                //...
                            </div>
                        </div>
                    </div>
                    <?php
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