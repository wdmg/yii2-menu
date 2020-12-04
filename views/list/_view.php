<?php

use yii\helpers\Html;
use yii\widgets\Pjax;
use yii\widgets\ListView;
?>

<?php Pjax::begin(); ?>
<?php /*ListView::widget([
    'dataProvider' => $dataProvider,
    'layout' => '<dl class="dl-horizontal">{items}</dl>{pager}',
    'itemView' => function($data, $key, $index, $widget) use ($model) {
        return '<dt>' . $data['label'] . ' <span class="text-muted">[' . $data['name'] . ']</span></dt>' . '<dd>' . $data['content'] . '</dd>';
    }
]);*/ ?>
<?php Pjax::end(); ?>
