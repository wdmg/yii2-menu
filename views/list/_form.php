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
        <?= var_export($model->getSourcesList(true)) ?>
        <div class="accordion" id="menuSources">
            <div class="card">
                <div class="card-header p-1 p-0" id="headingOne">
                    <a href="#" class="btn btn-link btn-block text-left text-decoration-none" role="button"
                       data-toggle="collapse" data-target="#collapseOne" aria-expanded="true"
                       aria-controls="collapseOne">
                        Static Pages
                    </a>
                </div>
                <div id="collapseOne" class="collapse show" aria-labelledby="headingOne"
                     data-parent="#menuSources">
                    <div class="card-body">
                        <form>
                            <div class="form-row overflow-auto bg-light p-3" style="max-height:186px;">
                                <ul class="list-unstyled mb-0">
                                    <li class="custom-control custom-checkbox">
                                        <input type="checkbox" class="custom-control-input" id="newMenuItem1">
                                        <label class="custom-control-label" for="newMenuItem1">Home</label>
                                    </li>
                                    <li class="custom-control custom-checkbox">
                                        <input type="checkbox" class="custom-control-input" id="newMenuItem2">
                                        <label class="custom-control-label" for="newMenuItem2">About</label>
                                    </li>
                                    <li class="custom-control custom-checkbox">
                                        <input type="checkbox" class="custom-control-input" id="newMenuItem3">
                                        <label class="custom-control-label" for="newMenuItem3">Contacts</label>
                                    </li>
                                </ul>
                            </div>
                            <div class="form-row border-top mt-3 pt-3 justify-content-between">
                                <div class="form-group">
                                    <div class="col mb-2">
                                        <div class="custom-control custom-checkbox">
                                            <input type="checkbox" class="custom-control-input" id="selectAllItems">
                                            <label class="custom-control-label" for="selectAllItems"> - select
                                                all</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <button type="submit" class="btn btn-sm btn-outline-primary mb-2">Add Item
                                    </button>
                                </div>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header p-1 p-0" id="headingTwo">
                    <a href="#" class="btn btn-link btn-block text-left collapsed text-decoration-none"
                       role="button" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="false"
                       aria-controls="collapseTwo">
                        Blog Posts
                    </a>
                </div>
                <div id="collapseTwo" class="collapse" aria-labelledby="headingTwo" data-parent="#menuSources">
                    <div class="card-body">
                        ...
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header p-1 p-0" id="headingThree">
                    <a href="#" class="btn btn-link btn-block text-left collapsed text-decoration-none"
                       role="button" data-toggle="collapse" data-target="#collapseThree" aria-expanded="false"
                       aria-controls="collapseThree">
                        Custom Links
                    </a>
                </div>
                <div id="collapseThree" class="collapse" aria-labelledby="headingThree"
                     data-parent="#menuSources">
                    <div class="card-body">
                        ...
                    </div>
                </div>
            </div>
        </div>
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