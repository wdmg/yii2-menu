<?php

use yii\helpers\Html;
use yii\helpers\Url;
use yii\grid\GridView;
use yii\web\View;
use yii\widgets\Pjax;
use yii\bootstrap\Modal;
use wdmg\widgets\SelectInput;

/* @var $this yii\web\View */

$bundle = \wdmg\media\MediaAsset::register($this);

$this->title = Yii::t('app/modules/menu', 'Menu');
$this->params['breadcrumbs'][] = $this->title;

?>
<div class="page-header">
    <h1><?= Html::encode($this->title) ?> <small class="text-muted pull-right">[v.<?= $this->context->module->version ?>]</small></h1>
</div>
<div class="media-list-index">
    <?php Pjax::begin([
        'id' => "pageContainer"
    ]); ?>
    <?= GridView::widget([
        'id' => "mediaList",
        'dataProvider' => $dataProvider,
        'filterModel' => $searchModel,
        'layout' => '{summary}<br\/>{items}<br\/>{summary}<br\/><div class="text-center">{pager}</div>',
        'columns' => [
            ['class' => 'yii\grid\SerialColumn'],

             'id',
             'title',
             'description',
             'alias',

            [
                'attribute' => 'status',
                'format' => 'html',
                'filter' => SelectInput::widget([
                    'model' => $searchModel,
                    'attribute' => 'status',
                    'items' => $searchModel->getStatusesList(true),
                    'options' => [
                        'class' => 'form-control'
                    ]
                ]),
                'headerOptions' => [
                    'class' => 'text-center'
                ],
                'contentOptions' => [
                    'class' => 'text-center'
                ],
                'value' => function($data) {
                    if ($data->status == $data::STATUS_PUBLISHED) {
                        return '<span class="label label-success">' . Yii::t('app/modules/menu', 'Published') . '</span>';
                    } elseif ($data->status == $data::STATUS_DRAFT) {
                        return '<span class="label label-default">' . Yii::t('app/modules/menu', 'Draft') . '</span>';
                    } else {
                        return $data->status;
                    }
                }
            ],
            [
                'attribute' => 'created',
                'label' => Yii::t('app/modules/menu','Created'),
                'format' => 'html',
                'contentOptions' => [
                    'class' => 'text-center',
                    'style' => 'min-width:146px'
                ],
                'value' => function($data) {

                    $output = "";
                    if ($user = $data->createdBy) {
                        $output = Html::a($user->username, ['../admin/users/view/?id='.$user->id], [
                            'target' => '_blank',
                            'data-pjax' => 0
                        ]);
                    } else if ($data->created_by) {
                        $output = $data->created_by;
                    }

                    if (!empty($output))
                        $output .= ", ";

                    $output .= Yii::$app->formatter->format($data->created_at, 'datetime');
                    return $output;
                }
            ],

            [
                'class' => 'yii\grid\ActionColumn',
                'header' => Yii::t('app/modules/menu','Actions'),
                'headerOptions' => [
                    'class' => 'text-center'
                ],
                'contentOptions' => [
                    'class' => 'text-center'
                ],
                'buttons' => [
                    'view' => function($url, $data, $key) {
                        return Html::a('<span class="glyphicon glyphicon-eye-open"></span> ',
                            [
                                'list/view',
                                'id' => $data->id
                            ], [
                                'data-toggle' => 'modal',
                                'data-target' => '#menuPreview',
                                'data-id' => $data->id,
                                'data-pjax' => '0'
                            ]
                        );
                    }
                ]
            ],

        ],
        'pager' => [
            'options' => [
                'class' => 'pagination',
            ],
            'maxButtonCount' => 5,
            'activePageCssClass' => 'active',
            'prevPageCssClass' => '',
            'nextPageCssClass' => '',
            'firstPageCssClass' => 'previous',
            'lastPageCssClass' => 'next',
            'firstPageLabel' => Yii::t('app/modules/menu', 'First page'),
            'lastPageLabel'  => Yii::t('app/modules/menu', 'Last page'),
            'prevPageLabel'  => Yii::t('app/modules/menu', '&larr; Prev page'),
            'nextPageLabel'  => Yii::t('app/modules/menu', 'Next page &rarr;')
        ],
    ]); ?>
    <hr/>
    <div>
        <?= Html::a(Yii::t('app/modules/menu', 'Add new menu'), ['list/create'], [
            'class' => 'btn btn-success pull-right'
        ]) ?>
    </div>
    <?php Pjax::end(); ?>
</div>

<?php $this->registerJs(<<< JS
    $('body').delegate('[data-toggle="modal"][data-target]', 'click', function(event) {
        event.preventDefault();
        let target = $(this).data('target');
        if ($(target).length > 0) {
            $.get(
                $(this).attr('href'),
                function (data) {
                    if (data.length > 0) {
                        $(target).find('.modal-body').html($(data).remove('.modal-footer'));
                        if ($(data).find('.modal-footer').length > 0) {
                            $(target).find('.modal-footer').remove();
                            $(target).find('.modal-content').append($(data).find('.modal-footer'));
                        }
                        if ($(target).find('button[type="submit"]').length > 0 && $(target).find('form').length > 0) {
                            $(target).find('button[type="submit"]').on('click', function(event) {
                              $(target).find('form').submit();
                            });
                        }
                        $(target).modal();
                    }
                }  
            );
        }
    });
JS
); ?>

<?php Modal::begin([
    'id' => 'menuPreview',
    'header' => '<h4 class="modal-title">'.Yii::t('app/modules/menu', 'Menu preview').'</h4>',
    'clientOptions' => [
        'show' => false
    ]
]); ?>
<?php Modal::end(); ?>

<?php echo $this->render('../_debug'); ?>