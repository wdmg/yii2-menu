<?php

use yii\helpers\Html;
use yii\bootstrap\Nav;

?>
<div class="clearfix">
    <?php if ($items) {
        echo Html::tag('nav', Nav::widget([
            'options' => ['class' => 'navbar-nav'],
            'items' => $items,
        ]), ['class' => "navbar"]);
    } ?>
</div>