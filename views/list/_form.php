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

    <?= ($model->id) ? '<div id="menuItems" class="menu-items no-items">' . Yii::t('app/modules/menu', 'Add menu items from the right column.') . '</div>' : ''; ?>

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
        // Sidebar
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