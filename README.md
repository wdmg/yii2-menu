[![Yii2](https://img.shields.io/badge/required-Yii2_v2.0.40-blue.svg)](https://packagist.org/packages/yiisoft/yii2)
[![Downloads](https://img.shields.io/packagist/dt/wdmg/yii2-menu.svg)](https://packagist.org/packages/wdmg/yii2-menu)
[![Packagist Version](https://img.shields.io/packagist/v/wdmg/yii2-menu.svg)](https://packagist.org/packages/wdmg/yii2-menu)
![Progress](https://img.shields.io/badge/progress-ready_to_use-green.svg)
[![GitHub license](https://img.shields.io/github/license/wdmg/yii2-menu.svg)](https://github.com/wdmg/yii2-menu/blob/master/LICENSE)

<img src="./docs/images/yii2-menu.png" width="100%" alt="Yii2 Menu" />

# Yii2 Menu module
Module for creating and managing menus. It has its own component for displaying menu items in the front-end.

This module is an integral part of the [Butterfly.СMS](https://butterflycms.com/) content management system, but can also be used as an standalone extension.

Copyrights (c) 2019-2023 [W.D.M.Group, Ukraine](https://wdmg.com.ua/)

# Requirements 
* PHP 5.6 or higher
* Yii2 v.2.0.40 and newest
* [Yii2 Base](https://github.com/wdmg/yii2-base) module (required)

# Installation
To install the module, run the following command in the console:

`$ composer require "wdmg/yii2-menu"`

After configure db connection, run the following command in the console:

`$ php yii menu/init`

And select the operation you want to perform:
  1) Apply all module migrations
  2) Revert all module migrations

# Migrations
In any case, you can execute the migration and create the initial data, run the following command in the console:

`$ php yii migrate --migrationPath=@vendor/wdmg/yii2-menu/migrations`

# Configure

To add a module to the project, add the following data in your configuration file:

    'modules' => [
        ...
        'menu' => [
            'class' => 'wdmg\menu\Module',
            'routePrefix' => 'admin'
        ],
        ...
    ],

# Usage examples
To build the navigation menu you may use the component method Yii::$app->menu->getItems() with `id` or `alias` of menu.
The second argument of the component function determines whether the list of menu items will be presented as a tree.

**View in frontend**

    <?php
        use yii\bootstrap\Nav;
        ...
    ?>
        
    <?php
        if ($menuItems = Yii::$app->menu->getItems(1, true)) {
            echo Nav::widget([
                'options' => ['class' => 'navbar-nav'],
                'items' => $menuItems,
            ]);
        }
    ?>
    
    // or get items by menu alias
        
    <?php
        if ($menuItems = Yii::$app->menu->getItems('glavnoye-menyu', true)) {
            echo Nav::widget([
                'options' => ['class' => 'navbar-nav'],
                'items' => $menuItems,
            ]);
        }
    ?>
    ...
    

# Routing
Use the `Module::dashboardNavItems()` method of the module to generate a navigation items list for NavBar, like this:

    <?php
        echo Nav::widget([
        'options' => ['class' => 'navbar-nav navbar-right'],
            'label' => 'Modules',
            'items' => [
                Yii::$app->getModule('menu')->dashboardNavItems(),
                ...
            ]
        ]);
    ?>


# Status and version [ready to use]
* v.1.2.1 - Fix nav menu
* v.1.2.0 - Fix node sass, update dependencies and copyrights
* v.1.1.1 - Migration error fixed
* v.1.1.0 - Multi-language implementation