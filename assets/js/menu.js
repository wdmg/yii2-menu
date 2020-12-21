var DragMenu = new function() {

    var self = this;
    var dragObject = {};
    var dragMenu = document.getElementById('dragMenu');
    var menuItems = document.getElementById('menuItems');
    var menuSources = document.getElementById('menuSources');
    var panels = menuSources.querySelectorAll(".panel");
    var formTemplate = document.getElementById('itemFormTemplate');
    var itemTemplate = document.getElementById('menuItemTemplate');
    var addMenuItemForm = document.getElementById('addMenuItemForm');

    const removeElements = (elms) => elms.forEach(elem => elem.remove());

    const transformData = (list, json = true) => {
        let tree = [];

        /**
         * Наполнение дерева значениями
         *
         * @param {HTMLLIElement} e   LI-элемент с data-id
         * @param {Array}         ref Ссылка на дерево, куда добавлять свойства
         */
        function push(e, ref, node = 'UL') {

            let itemForm = e.querySelector('form[data-key]');
            let pointer = { // Берём атрибут id элемента
                id: itemForm.getAttribute('data-key') || null,
                //source_type: itemForm.getAttribute('data-type') || null,
                name: itemForm.querySelector('input[name="MenuItems[name]"]').value || null,
                title: itemForm.querySelector('input[name="MenuItems[title]"]').value || null,
                source_id: itemForm.querySelector('input[name="MenuItems[source_id]"]').value || null,
                source_type: itemForm.querySelector('input[name="MenuItems[source_type]"]').value || null,
                source_url: itemForm.querySelector('input[name="MenuItems[source_url]"]').value || null,
                only_auth: itemForm.querySelector('input[name="MenuItems[only_auth]"]').value || null,
                target_blank: itemForm.querySelector('input[name="MenuItems[target_blank]"]').value || null,
            };

            if (e.childElementCount) { // Если есть потомки
                pointer.children = []; // Создаём свойство для них
                Array.from(e.children).forEach(i => { // Перебираем... хм... детей (по косточкам!)
                    if (i.nodeName === node.toUpperCase()) { // Если есть ещё один контейнер UL, перебираем его
                        Array.from(i.children).forEach(e => {
                            push(e, pointer.children); // Вызываем push на новых li, но ссылка на древо теперь - это массив children указателя
                        });
                    }
                });
            }

            ref.push(pointer);
        }

        // Проходимся по всем li переданного ul
        Array.from(list.children).forEach(e => {
            push(e, tree, 'UL');
        });

        return json ? JSON.stringify(tree) : tree;
    }

    const toWrap = (elem, wrapper) => {
        wrapper = wrapper || document.createElement('div');
        elem.parentNode.appendChild(wrapper);
        return wrapper.appendChild(elem);
    };

    /**
     * @param {String} HTML representing a single element
     * @return {Element}
     */
    const htmlToElement = (html) => {
        var template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    /**
     * @param {String} HTML representing any number of sibling elements
     * @return {NodeList}
     */
    const htmlToElements = (html) => {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.childNodes;
    }

    const fillTemplate = (str, obj) => {
        do {
            var beforeReplace = str;
            str = str.replace(/{{\s*([^}\s]+)\s*}}/g, function(wholeMatch, key) {
                var substitution = obj[$.trim(key)];
                return (substitution === undefined ? wholeMatch : substitution);
            });
            var afterReplace = str !== beforeReplace;
        } while (afterReplace);

        return str;
    };

    const getCoords = (elem) => {
        let box = elem.getBoundingClientRect();
        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };
    }

    var addMenuItem = (item, parent = null) => {
        if (menuItems && itemTemplate && 'content' in document.createElement('template')) {

            if (menuItems.classList.contains('no-items')) {
                menuItems.classList.remove('no-items');
                menuItems.innerHTML = "";
            }

            let data = item;
            data.form = fillTemplate(formTemplate.innerHTML, data);

            let html = fillTemplate(itemTemplate.innerHTML, data);
            if (html) {
                if (parent) {

                    let list = document.createElement('ul');
                    list.classList.add('menu-items');
                    list.setAttribute('role', "tablist");

                    let listItem = htmlToElement(html);
                    listItem.classList.add('sub-item');
                    list.append(listItem);

                    menuItems.querySelector('[data-id="' + parent + '"]').append(list);
                } else {
                    menuItems.append(htmlToElement(html));
                }
            }

            return self.onAddSuccess(dragObject, menuItems);

        }
        return self.onAddFailture(dragObject, menuItems);
    };

    if (addMenuItemForm.length) {
        let addButton = addMenuItemForm.querySelector('button[data-rel="add"]');
        addButton.addEventListener("click", (event) => {

            let collapseToggler = menuSources.querySelector('#source-link a[data-toggle="collapse"]');

            //console.log(collapseToggler);

            let item = {
                'id': null,
                'source': collapseToggler.dataset.type || null,
                'source_name': collapseToggler.dataset.name || null,
                'name': addMenuItemForm.querySelector('input[name="MenuItems[name]"]').value || false,
                'title': addMenuItemForm.querySelector('input[name="MenuItems[title]"]').value || false,
                'source_id': null,
                'source_type': addMenuItemForm.querySelector('input[name="MenuItems[source_type]"]').value || false,
                'source_url': addMenuItemForm.querySelector('input[name="MenuItems[source_url]"]').value || false,
                'only_auth': addMenuItemForm.querySelector('input[name="MenuItems[only_auth]"]').value || false,
                'target_blank': addMenuItemForm.querySelector('input[name="MenuItems[target_blank]"]').value || false,
            };

            if (addMenuItem(item))
                addMenuItemForm.reset();

        });
    }

    var sourcesList = [...panels].filter(panel => {
        if (panel.children.length) {

            let addButton = panel.querySelector('button[data-rel="add"]');
            let selectAll = panel.querySelector('input[type="checkbox"][name="select-all"]');
            let items = panel.querySelectorAll('.source-list input[type="checkbox"]');


            if (addButton && items) {

                items.forEach(item => {
                    item.onchange = (event) => {
                        event.preventDefault();
                        if (panel.querySelectorAll('input[type="checkbox"]:checked:not([name="select-all"])').length)
                            addButton.removeAttribute('disabled');
                        else
                            addButton.setAttribute('disabled', true);
                    }
                });

                addButton.onclick = (event) => {
                    event.preventDefault();
                    let sourcesItems = [...items].filter(item => {
                        if (item.checked) {
                            addMenuItem(item.dataset);
                        }
                    });

                    items.forEach(checkbox => {
                        checkbox.checked = false;
                    });
                }
            }

            if (selectAll && items) {
                selectAll.onchange = (event) => {
                    event.preventDefault();
                    let target = event.target.checked;
                    items.forEach(checkbox => {
                        if (target) {
                            checkbox.checked = true;
                        } else {
                            checkbox.checked = false;
                        }
                        checkbox.onchange(event);
                    });
                }
            }
        }
    });


    var createDroppable = (e) => {
        let top = e.clientY || e.targetTouches[0].pageY;
        let left = e.clientX || e.targetTouches[0].pageX;
        let elem = document.elementFromPoint(left, top);
        let droppable = document.createElement('div');
        droppable.classList.add('droppable');

        if ((dragObject.avatar.getBoundingClientRect().left - elem.getBoundingClientRect().left) >= (dragObject.avatar.offsetWidth*0.1))
            droppable.classList.add('sub-item');
        else
            droppable.classList.remove('sub-item');

        let itemText = dragObject.avatar.querySelector('.panel-title a[data-toggle="collapse"]').dataset['name'];
        let droppableText = document.createTextNode(itemText.trim());
        droppable.appendChild(droppableText);

        droppable.style.width = dragObject.avatar.offsetWidth + 'px';
        droppable.style.height = dragObject.avatar.offsetHeight + 'px';

        if (!droppable.isEqualNode(dragObject.droppable)) {
            removeElements(menuItems.querySelectorAll(".droppable:not(.delete-area)"));
            dragObject.droppable = null;
        }
        dragObject.droppable = droppable;

        let target = elem.closest('.draggable');

        if (target && typeof target !== "undefined") {

            ////console.log('target', target);

            removeElements(menuItems.querySelectorAll(".droppable:not(.delete-area)"));

            let top = e.clientY || e.targetTouches[0].pageY;
            let left = e.clientX || e.targetTouches[0].pageX;
            if (top >= (target.getBoundingClientRect().top + (target.offsetHeight/1.5))) {


                if ((dragObject.avatar.getBoundingClientRect().left - elem.getBoundingClientRect().left) >= (dragObject.avatar.offsetWidth*0.1))
                    target.querySelector('.collapse').after(droppable);
                else
                    target.after(droppable);

                if (target.classList.contains('sub-item'))
                    droppable.classList.add('sub-item');

                ////console.log('after');

            } else if (top < (target.getBoundingClientRect().top + (target.offsetHeight/1.5))) {

                if ((dragObject.avatar.getBoundingClientRect().left - elem.getBoundingClientRect().left) >= (dragObject.avatar.offsetWidth*0.1))
                    target.querySelector('.collapse').after(droppable);
                else
                    target.before(droppable);

                if (document.getElementById('menuItems').firstChild.isEqualNode(droppable))
                    droppable.classList.remove('sub-item');

                if (target.classList.contains('sub-item')) {
                    droppable.remove();
                    return false;
                }

                ////console.log('before');

            }

            dragObject.avatar.style.width = droppable.offsetWidth + 'px';
            dragObject.avatar.style.height = droppable.offsetHeight + 'px';
        }
    }
    var createAvatar = (e) => {

        // запомнить старые свойства, чтобы вернуться к ним при отмене переноса
        var avatar = dragObject.elem;
        var old = {
            parent: avatar.parentNode,
            nextSibling: avatar.nextSibling,
            position: avatar.position || '',
            left: avatar.left || '',
            top: avatar.top || '',
            zIndex: avatar.zIndex || ''
        };

        // функция для отмены переноса
        avatar.rollback = () => {
            old.parent.insertBefore(avatar, old.nextSibling);
            avatar.style.position = old.position;
            avatar.style.left = old.left;
            avatar.style.top = old.top;
            avatar.style.zIndex = old.zIndex;
            ////console.log('Drag cancel, rollback');
            /*setTimeout(function() {
                document.querySelector('.droppable.delete-area').classList.remove('show');
            }, 500);*/
        };

        return avatar;
    }
    var startDrag = (e) => {
        ////console.log('startDrag');

        let avatar = dragObject.avatar;
        avatar.style.width = dragObject.avatar.offsetWidth + 'px';
        avatar.style.height = dragObject.avatar.offsetHeight + 'px';

        // инициировать начало переноса
        avatar.classList.add('drag-in');
        document.body.appendChild(avatar);

        let deleteArea = document.querySelector(".droppable.delete-area");
        if (deleteArea)
            deleteArea.classList.add('show');

    }
    var finishDrag = (e) => {
        ////console.log('finishDrag');

        let avatar = dragObject.avatar;
        let dropElem = findDroppable(e);

        if (!dropElem)
            avatar.rollback();

        avatar.style = '';
        avatar.classList.remove('drag-in');

        let droppable = dragMenu.querySelector(".droppable");
        if (droppable.classList.contains('delete-area')) {
            dragObject = {};
            avatar.remove();
        } else if (droppable.classList.contains('sub-item')) {

            let list = droppable.parentNode.querySelector("ul");
            if (!list) {
                list = document.createElement('ul');
                list.classList.add('menu-items');
                list.setAttribute('role', "tablist");
                droppable.parentNode.appendChild(list);
            }

            avatar.classList.add('sub-item');
            droppable.replaceWith(avatar);
            list.appendChild(avatar);
        } else {
            avatar.classList.remove('sub-item');
            droppable.replaceWith(avatar);
        }

        // selects all <ul> elements, then filters the collection
        let lists = menuItems.querySelectorAll('ul');
        // keep only those elements with no child-elements
        let emptyList = [...lists].filter(elem => {
            return elem.children.length === 0;
        });

        for (let empty of emptyList)
            empty.remove();

        //dragObject.data = transformData(menuItems.querySelector(".menu-items"));
        dragObject.data = transformData(menuItems);
        removeElements(menuItems.querySelectorAll(".droppable:not(.delete-area)"));

        let deleteArea = document.querySelector(".droppable.delete-area");
        setTimeout(function() {
            if (deleteArea)
                deleteArea.classList.remove('show');
        }, 500);

        if (!dropElem)
            self.onDragCancel(dragObject);
        else
            self.onDragEnd(dragObject, dropElem);
    }
    var findDroppable = (e) => {
        // спрячем переносимый элемент
        dragObject.avatar.hidden = true;

        let top = e.clientY || e.changedTouches[0].pageY;
        let left = e.clientX || e.changedTouches[0].pageX;

        // получить самый вложенный элемент под курсором мыши
        let elem = document.elementFromPoint(left, top);

        // показать переносимый элемент обратно
        dragObject.avatar.hidden = false;

        if (elem == null) // такое возможно, если курсор мыши "вылетел" за границу окна
            return null;

        return elem.closest('.droppable');
    }


    var onMouseDown = (e) => {

        if (e.type === "mousedown" && e.which != 1)
            return;

        var elem = e.target.closest('.draggable');
        if (!elem)
            return;

        dragObject.elem = elem;

        // запомним, что элемент нажат на текущих координатах pageX/pageY
        dragObject.downX = e.pageX || e.targetTouches[0].pageX;
        dragObject.downY = e.pageY || e.targetTouches[0].pageY;

        return false;
    }
    var onMouseMove = (e) => {
        if (!dragObject.elem) return; // элемент не зажат

        if (!dragObject.avatar) { // если перенос не начат...

            let moveX = 0;
            let moveY = 0;
            if (e.type === "touchmove") {
                moveX = e.targetTouches[0].pageX - dragObject.downX;
                moveY = e.targetTouches[0].pageY - dragObject.downY;
            } else {
                moveX = e.pageX - dragObject.downX;
                moveY = e.pageY - dragObject.downY;
            }

            // если мышь передвинулась в нажатом состоянии недостаточно далеко
            if (Math.abs(moveX) < 5 && Math.abs(moveY) < 5)
                return;

            // начинаем перенос
            dragObject.avatar = createAvatar(e); // создать аватар
            if (!dragObject.avatar) { // отмена переноса, нельзя "захватить" за эту часть элемента
                dragObject = {};
                return;
            }

            // аватар создан успешно
            // создать вспомогательные свойства shiftX/shiftY
            let coords = getCoords(dragObject.avatar);
            dragObject.shiftX = dragObject.downX - coords.left;
            dragObject.shiftY = dragObject.downY - coords.top;

            startDrag(e); // отобразить начало переноса
        }

        // отобразить перенос объекта при каждом движении мыши
        if (e.type === "touchmove") {
            dragObject.avatar.style.left = (e.changedTouches[0].pageX - dragObject.shiftX) + 'px';
            dragObject.avatar.style.top = (e.changedTouches[0].pageY - dragObject.shiftY) + 'px';
        } else {
            dragObject.avatar.style.left = (e.pageX - dragObject.shiftX) + 'px';
            dragObject.avatar.style.top = (e.pageY - dragObject.shiftY) + 'px';
        }

        createDroppable(e);
        return false;
    }
    var onMouseUp = (e) => {
        if (dragObject.avatar) // если перенос идет
            finishDrag(e);

        // перенос либо не начинался, либо завершился
        // в любом случае очистим "состояние переноса" dragObject
        dragObject = {};
    }

    this.getItemsData = function() {
        return transformData(menuItems);
    };

    this.buildMenuItems = function(data) {
        let items = [...data].filter(item => {
            if (typeof item == "object") {
                //console.log(item);
                let parent_id = item.parent_id

                if (item.source_type && !item.source_name)
                    item.source_name = menuSources.querySelector('.panel .panel-heading a[data-id="'+item.source_type+'"]').dataset.name;

                addMenuItem(item, parent_id);
            }
        });
    };

    this.onInit = function(menuItems) { };
    this.onDragEnd = function(dragObject, dropElem) {};
    this.onDragCancel = function(dragObject) {};

    this.onAddSuccess = function(dragObject, menuItems) {};
    this.onAddFailture = function(dragObject, menuItems) {};

    document.addEventListener("DOMContentLoaded", function(event) {
        if (dragMenu && menuItems) {
            //console.log('dragMenu.onload');
            dragMenu.onmousedown = onMouseDown;
            dragMenu.ontouchstart = onMouseDown;
            dragMenu.onmousemove = onMouseMove;
            dragMenu.ontouchmove = onMouseMove;
            dragMenu.onmouseup = onMouseUp;
            dragMenu.ontouchend = onMouseUp;
            self.onInit();
        }
    });
}

DragMenu.onDragCancel = function (dragObject) {
    if (dragObject.data) {
        let form = document.getElementById('addMenuForm');
        form.querySelector('input#menu-items').value = dragObject.data;
    }
};

DragMenu.onDragEnd = function (dragObject, dropElem) {
    if (dragObject.data) {
        let form = document.getElementById('addMenuForm');
        form.querySelector('input#menu-items').value = dragObject.data;
    }
};

DragMenu.onAddSuccess = function (dragObject, menuItems) {
    let form = document.getElementById('addMenuForm');
    form.querySelector('input#menu-items').value = this.getItemsData();
};

DragMenu.onInit = function () {
    let form = document.getElementById('addMenuForm');
    let data = JSON.parse(form.querySelector('input#menu-items').value);
    //console.log(data);
    this.buildMenuItems(data);
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBEcmFnTWVudSA9IG5ldyBmdW5jdGlvbigpIHtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZHJhZ09iamVjdCA9IHt9O1xuICAgIHZhciBkcmFnTWVudSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkcmFnTWVudScpO1xuICAgIHZhciBtZW51SXRlbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJyk7XG4gICAgdmFyIG1lbnVTb3VyY2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVTb3VyY2VzJyk7XG4gICAgdmFyIHBhbmVscyA9IG1lbnVTb3VyY2VzLnF1ZXJ5U2VsZWN0b3JBbGwoXCIucGFuZWxcIik7XG4gICAgdmFyIGZvcm1UZW1wbGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpdGVtRm9ybVRlbXBsYXRlJyk7XG4gICAgdmFyIGl0ZW1UZW1wbGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51SXRlbVRlbXBsYXRlJyk7XG4gICAgdmFyIGFkZE1lbnVJdGVtRm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51SXRlbUZvcm0nKTtcblxuICAgIGNvbnN0IHJlbW92ZUVsZW1lbnRzID0gKGVsbXMpID0+IGVsbXMuZm9yRWFjaChlbGVtID0+IGVsZW0ucmVtb3ZlKCkpO1xuXG4gICAgY29uc3QgdHJhbnNmb3JtRGF0YSA9IChsaXN0LCBqc29uID0gdHJ1ZSkgPT4ge1xuICAgICAgICBsZXQgdHJlZSA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDQndCw0L/QvtC70L3QtdC90LjQtSDQtNC10YDQtdCy0LAg0LfQvdCw0YfQtdC90LjRj9C80LhcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtIVE1MTElFbGVtZW50fSBlICAgTEkt0Y3Qu9C10LzQtdC90YIg0YEgZGF0YS1pZFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSAgICAgICAgIHJlZiDQodGB0YvQu9C60LAg0L3QsCDQtNC10YDQtdCy0L4sINC60YPQtNCwINC00L7QsdCw0LLQu9GP0YLRjCDRgdCy0L7QudGB0YLQstCwXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBwdXNoKGUsIHJlZiwgbm9kZSA9ICdVTCcpIHtcblxuICAgICAgICAgICAgbGV0IGl0ZW1Gb3JtID0gZS5xdWVyeVNlbGVjdG9yKCdmb3JtW2RhdGEta2V5XScpO1xuICAgICAgICAgICAgbGV0IHBvaW50ZXIgPSB7IC8vINCR0LXRgNGR0Lwg0LDRgtGA0LjQsdGD0YIgaWQg0Y3Qu9C10LzQtdC90YLQsFxuICAgICAgICAgICAgICAgIGlkOiBpdGVtRm9ybS5nZXRBdHRyaWJ1dGUoJ2RhdGEta2V5JykgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAvL3NvdXJjZV90eXBlOiBpdGVtRm9ybS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdHlwZScpIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgbmFtZTogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tuYW1lXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgdGl0bGU6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbdGl0bGVdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBzb3VyY2VfaWQ6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbc291cmNlX2lkXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgc291cmNlX3R5cGU6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbc291cmNlX3R5cGVdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3NvdXJjZV91cmxdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBvbmx5X2F1dGg6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbb25seV9hdXRoXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgdGFyZ2V0X2JsYW5rOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RhcmdldF9ibGFua11cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGUuY2hpbGRFbGVtZW50Q291bnQpIHsgLy8g0JXRgdC70Lgg0LXRgdGC0Ywg0L/QvtGC0L7QvNC60LhcbiAgICAgICAgICAgICAgICBwb2ludGVyLmNoaWxkcmVuID0gW107IC8vINCh0L7Qt9C00LDRkdC8INGB0LLQvtC50YHRgtCy0L4g0LTQu9GPINC90LjRhVxuICAgICAgICAgICAgICAgIEFycmF5LmZyb20oZS5jaGlsZHJlbikuZm9yRWFjaChpID0+IHsgLy8g0J/QtdGA0LXQsdC40YDQsNC10LwuLi4g0YXQvC4uLiDQtNC10YLQtdC5ICjQv9C+INC60L7RgdGC0L7Rh9C60LDQvCEpXG4gICAgICAgICAgICAgICAgICAgIGlmIChpLm5vZGVOYW1lID09PSBub2RlLnRvVXBwZXJDYXNlKCkpIHsgLy8g0JXRgdC70Lgg0LXRgdGC0Ywg0LXRidGRINC+0LTQuNC9INC60L7QvdGC0LXQudC90LXRgCBVTCwg0L/QtdGA0LXQsdC40YDQsNC10Lwg0LXQs9C+XG4gICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKGkuY2hpbGRyZW4pLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaChlLCBwb2ludGVyLmNoaWxkcmVuKTsgLy8g0JLRi9C30YvQstCw0LXQvCBwdXNoINC90LAg0L3QvtCy0YvRhSBsaSwg0L3QviDRgdGB0YvQu9C60LAg0L3QsCDQtNGA0LXQstC+INGC0LXQv9C10YDRjCAtINGN0YLQviDQvNCw0YHRgdC40LIgY2hpbGRyZW4g0YPQutCw0LfQsNGC0LXQu9GPXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWYucHVzaChwb2ludGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vINCf0YDQvtGF0L7QtNC40LzRgdGPINC/0L4g0LLRgdC10LwgbGkg0L/QtdGA0LXQtNCw0L3QvdC+0LPQviB1bFxuICAgICAgICBBcnJheS5mcm9tKGxpc3QuY2hpbGRyZW4pLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgICBwdXNoKGUsIHRyZWUsICdVTCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ganNvbiA/IEpTT04uc3RyaW5naWZ5KHRyZWUpIDogdHJlZTtcbiAgICB9XG5cbiAgICBjb25zdCB0b1dyYXAgPSAoZWxlbSwgd3JhcHBlcikgPT4ge1xuICAgICAgICB3cmFwcGVyID0gd3JhcHBlciB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuICAgICAgICByZXR1cm4gd3JhcHBlci5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IEhUTUwgcmVwcmVzZW50aW5nIGEgc2luZ2xlIGVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtFbGVtZW50fVxuICAgICAqL1xuICAgIGNvbnN0IGh0bWxUb0VsZW1lbnQgPSAoaHRtbCkgPT4ge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICBodG1sID0gaHRtbC50cmltKCk7IC8vIE5ldmVyIHJldHVybiBhIHRleHQgbm9kZSBvZiB3aGl0ZXNwYWNlIGFzIHRoZSByZXN1bHRcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuZmlyc3RDaGlsZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gSFRNTCByZXByZXNlbnRpbmcgYW55IG51bWJlciBvZiBzaWJsaW5nIGVsZW1lbnRzXG4gICAgICogQHJldHVybiB7Tm9kZUxpc3R9XG4gICAgICovXG4gICAgY29uc3QgaHRtbFRvRWxlbWVudHMgPSAoaHRtbCkgPT4ge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUuY29udGVudC5jaGlsZE5vZGVzO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGxUZW1wbGF0ZSA9IChzdHIsIG9iaikgPT4ge1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB2YXIgYmVmb3JlUmVwbGFjZSA9IHN0cjtcbiAgICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC97e1xccyooW159XFxzXSspXFxzKn19L2csIGZ1bmN0aW9uKHdob2xlTWF0Y2gsIGtleSkge1xuICAgICAgICAgICAgICAgIHZhciBzdWJzdGl0dXRpb24gPSBvYmpbJC50cmltKGtleSldO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3Vic3RpdHV0aW9uID09PSB1bmRlZmluZWQgPyB3aG9sZU1hdGNoIDogc3Vic3RpdHV0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGFmdGVyUmVwbGFjZSA9IHN0ciAhPT0gYmVmb3JlUmVwbGFjZTtcbiAgICAgICAgfSB3aGlsZSAoYWZ0ZXJSZXBsYWNlKTtcblxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH07XG5cbiAgICBjb25zdCBnZXRDb29yZHMgPSAoZWxlbSkgPT4ge1xuICAgICAgICBsZXQgYm94ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcDogYm94LnRvcCArIHBhZ2VZT2Zmc2V0LFxuICAgICAgICAgICAgbGVmdDogYm94LmxlZnQgKyBwYWdlWE9mZnNldFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBhZGRNZW51SXRlbSA9IChpdGVtLCBwYXJlbnQgPSBudWxsKSA9PiB7XG4gICAgICAgIGlmIChtZW51SXRlbXMgJiYgaXRlbVRlbXBsYXRlICYmICdjb250ZW50JyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpKSB7XG5cbiAgICAgICAgICAgIGlmIChtZW51SXRlbXMuY2xhc3NMaXN0LmNvbnRhaW5zKCduby1pdGVtcycpKSB7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zLmNsYXNzTGlzdC5yZW1vdmUoJ25vLWl0ZW1zJyk7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBkYXRhID0gaXRlbTtcbiAgICAgICAgICAgIGRhdGEuZm9ybSA9IGZpbGxUZW1wbGF0ZShmb3JtVGVtcGxhdGUuaW5uZXJIVE1MLCBkYXRhKTtcblxuICAgICAgICAgICAgbGV0IGh0bWwgPSBmaWxsVGVtcGxhdGUoaXRlbVRlbXBsYXRlLmlubmVySFRNTCwgZGF0YSk7XG4gICAgICAgICAgICBpZiAoaHRtbCkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QuY2xhc3NMaXN0LmFkZCgnbWVudS1pdGVtcycpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnNldEF0dHJpYnV0ZSgncm9sZScsIFwidGFibGlzdFwiKTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgbGlzdEl0ZW0gPSBodG1sVG9FbGVtZW50KGh0bWwpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0SXRlbS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0LmFwcGVuZChsaXN0SXRlbSk7XG5cbiAgICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWlkPVwiJyArIHBhcmVudCArICdcIl0nKS5hcHBlbmQobGlzdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zLmFwcGVuZChodG1sVG9FbGVtZW50KGh0bWwpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzZWxmLm9uQWRkU3VjY2VzcyhkcmFnT2JqZWN0LCBtZW51SXRlbXMpO1xuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGYub25BZGRGYWlsdHVyZShkcmFnT2JqZWN0LCBtZW51SXRlbXMpO1xuICAgIH07XG5cbiAgICBpZiAoYWRkTWVudUl0ZW1Gb3JtLmxlbmd0aCkge1xuICAgICAgICBsZXQgYWRkQnV0dG9uID0gYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbltkYXRhLXJlbD1cImFkZFwiXScpO1xuICAgICAgICBhZGRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgY29sbGFwc2VUb2dnbGVyID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvcignI3NvdXJjZS1saW5rIGFbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScpO1xuXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGNvbGxhcHNlVG9nZ2xlcik7XG5cbiAgICAgICAgICAgIGxldCBpdGVtID0ge1xuICAgICAgICAgICAgICAgICdpZCc6IG51bGwsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZSc6IGNvbGxhcHNlVG9nZ2xlci5kYXRhc2V0LnR5cGUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAnc291cmNlX25hbWUnOiBjb2xsYXBzZVRvZ2dsZXIuZGF0YXNldC5uYW1lIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgJ25hbWUnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tuYW1lXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICd0aXRsZSc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RpdGxlXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfaWQnOiBudWxsLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfdHlwZSc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3NvdXJjZV90eXBlXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfdXJsJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbc291cmNlX3VybF1cIl0nKS52YWx1ZSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAnb25seV9hdXRoJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbb25seV9hdXRoXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICd0YXJnZXRfYmxhbmsnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0YXJnZXRfYmxhbmtdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoYWRkTWVudUl0ZW0oaXRlbSkpXG4gICAgICAgICAgICAgICAgYWRkTWVudUl0ZW1Gb3JtLnJlc2V0KCk7XG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIHNvdXJjZXNMaXN0ID0gWy4uLnBhbmVsc10uZmlsdGVyKHBhbmVsID0+IHtcbiAgICAgICAgaWYgKHBhbmVsLmNoaWxkcmVuLmxlbmd0aCkge1xuXG4gICAgICAgICAgICBsZXQgYWRkQnV0dG9uID0gcGFuZWwucXVlcnlTZWxlY3RvcignYnV0dG9uW2RhdGEtcmVsPVwiYWRkXCJdJyk7XG4gICAgICAgICAgICBsZXQgc2VsZWN0QWxsID0gcGFuZWwucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdW25hbWU9XCJzZWxlY3QtYWxsXCJdJyk7XG4gICAgICAgICAgICBsZXQgaXRlbXMgPSBwYW5lbC5xdWVyeVNlbGVjdG9yQWxsKCcuc291cmNlLWxpc3QgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJyk7XG5cblxuICAgICAgICAgICAgaWYgKGFkZEJ1dHRvbiAmJiBpdGVtcykge1xuXG4gICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYW5lbC5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl06Y2hlY2tlZDpub3QoW25hbWU9XCJzZWxlY3QtYWxsXCJdKScpLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGFkZEJ1dHRvbi5vbmNsaWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzb3VyY2VzSXRlbXMgPSBbLi4uaXRlbXNdLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRNZW51SXRlbShpdGVtLmRhdGFzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGNoZWNrYm94ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VsZWN0QWxsICYmIGl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0QWxsLm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0YXJnZXQgPSBldmVudC50YXJnZXQuY2hlY2tlZDtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChjaGVja2JveCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94Lm9uY2hhbmdlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblxuICAgIHZhciBjcmVhdGVEcm9wcGFibGUgPSAoZSkgPT4ge1xuICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgbGV0IGxlZnQgPSBlLmNsaWVudFggfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQobGVmdCwgdG9wKTtcbiAgICAgICAgbGV0IGRyb3BwYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LmFkZCgnZHJvcHBhYmxlJyk7XG5cbiAgICAgICAgaWYgKChkcmFnT2JqZWN0LmF2YXRhci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IC0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0KSA+PSAoZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0V2lkdGgqMC4xKSlcbiAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICBsZXQgaXRlbVRleHQgPSBkcmFnT2JqZWN0LmF2YXRhci5xdWVyeVNlbGVjdG9yKCcucGFuZWwtdGl0bGUgYVtkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdJykuZGF0YXNldFsnbmFtZSddO1xuICAgICAgICBsZXQgZHJvcHBhYmxlVGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGl0ZW1UZXh0LnRyaW0oKSk7XG4gICAgICAgIGRyb3BwYWJsZS5hcHBlbmRDaGlsZChkcm9wcGFibGVUZXh0KTtcblxuICAgICAgICBkcm9wcGFibGUuc3R5bGUud2lkdGggPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCArICdweCc7XG4gICAgICAgIGRyb3BwYWJsZS5zdHlsZS5oZWlnaHQgPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRIZWlnaHQgKyAncHgnO1xuXG4gICAgICAgIGlmICghZHJvcHBhYmxlLmlzRXF1YWxOb2RlKGRyYWdPYmplY3QuZHJvcHBhYmxlKSkge1xuICAgICAgICAgICAgcmVtb3ZlRWxlbWVudHMobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZHJvcHBhYmxlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkcmFnT2JqZWN0LmRyb3BwYWJsZSA9IGRyb3BwYWJsZTtcblxuICAgICAgICBsZXQgdGFyZ2V0ID0gZWxlbS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG5cbiAgICAgICAgaWYgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgIC8vLy9jb25zb2xlLmxvZygndGFyZ2V0JywgdGFyZ2V0KTtcblxuICAgICAgICAgICAgcmVtb3ZlRWxlbWVudHMobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcblxuICAgICAgICAgICAgbGV0IHRvcCA9IGUuY2xpZW50WSB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgICAgICBsZXQgbGVmdCA9IGUuY2xpZW50WCB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgICAgICBpZiAodG9wID49ICh0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgKHRhcmdldC5vZmZzZXRIZWlnaHQvMS41KSkpIHtcblxuXG4gICAgICAgICAgICAgICAgaWYgKChkcmFnT2JqZWN0LmF2YXRhci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IC0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0KSA+PSAoZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0V2lkdGgqMC4xKSlcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYXBzZScpLmFmdGVyKGRyb3BwYWJsZSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuYWZ0ZXIoZHJvcHBhYmxlKTtcblxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKVxuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcblxuICAgICAgICAgICAgICAgIC8vLy9jb25zb2xlLmxvZygnYWZ0ZXInKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCAodGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICh0YXJnZXQub2Zmc2V0SGVpZ2h0LzEuNSkpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5iZWZvcmUoZHJvcHBhYmxlKTtcblxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJykuZmlyc3RDaGlsZC5pc0VxdWFsTm9kZShkcm9wcGFibGUpKVxuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vLy9jb25zb2xlLmxvZygnYmVmb3JlJyk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUud2lkdGggPSBkcm9wcGFibGUub2Zmc2V0V2lkdGggKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUuaGVpZ2h0ID0gZHJvcHBhYmxlLm9mZnNldEhlaWdodCArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNyZWF0ZUF2YXRhciA9IChlKSA9PiB7XG5cbiAgICAgICAgLy8g0LfQsNC/0L7QvNC90LjRgtGMINGB0YLQsNGA0YvQtSDRgdCy0L7QudGB0YLQstCwLCDRh9GC0L7QsdGLINCy0LXRgNC90YPRgtGM0YHRjyDQuiDQvdC40Lwg0L/RgNC4INC+0YLQvNC10L3QtSDQv9C10YDQtdC90L7RgdCwXG4gICAgICAgIHZhciBhdmF0YXIgPSBkcmFnT2JqZWN0LmVsZW07XG4gICAgICAgIHZhciBvbGQgPSB7XG4gICAgICAgICAgICBwYXJlbnQ6IGF2YXRhci5wYXJlbnROb2RlLFxuICAgICAgICAgICAgbmV4dFNpYmxpbmc6IGF2YXRhci5uZXh0U2libGluZyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhdmF0YXIucG9zaXRpb24gfHwgJycsXG4gICAgICAgICAgICBsZWZ0OiBhdmF0YXIubGVmdCB8fCAnJyxcbiAgICAgICAgICAgIHRvcDogYXZhdGFyLnRvcCB8fCAnJyxcbiAgICAgICAgICAgIHpJbmRleDogYXZhdGFyLnpJbmRleCB8fCAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vINGE0YPQvdC60YbQuNGPINC00LvRjyDQvtGC0LzQtdC90Ysg0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICBhdmF0YXIucm9sbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBvbGQucGFyZW50Lmluc2VydEJlZm9yZShhdmF0YXIsIG9sZC5uZXh0U2libGluZyk7XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUucG9zaXRpb24gPSBvbGQucG9zaXRpb247XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUubGVmdCA9IG9sZC5sZWZ0O1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnRvcCA9IG9sZC50b3A7XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUuekluZGV4ID0gb2xkLnpJbmRleDtcbiAgICAgICAgICAgIC8vLy9jb25zb2xlLmxvZygnRHJhZyBjYW5jZWwsIHJvbGxiYWNrJyk7XG4gICAgICAgICAgICAvKnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRyb3BwYWJsZS5kZWxldGUtYXJlYScpLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgICAgICAgICAgIH0sIDUwMCk7Ki9cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYXZhdGFyO1xuICAgIH1cbiAgICB2YXIgc3RhcnREcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy8vL2NvbnNvbGUubG9nKCdzdGFydERyYWcnKTtcblxuICAgICAgICBsZXQgYXZhdGFyID0gZHJhZ09iamVjdC5hdmF0YXI7XG4gICAgICAgIGF2YXRhci5zdHlsZS53aWR0aCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldEhlaWdodCArICdweCc7XG5cbiAgICAgICAgLy8g0LjQvdC40YbQuNC40YDQvtCy0LDRgtGMINC90LDRh9Cw0LvQviDQv9C10YDQtdC90L7RgdCwXG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QuYWRkKCdkcmFnLWluJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcblxuICAgICAgICBsZXQgZGVsZXRlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhXCIpO1xuICAgICAgICBpZiAoZGVsZXRlQXJlYSlcbiAgICAgICAgICAgIGRlbGV0ZUFyZWEuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuXG4gICAgfVxuICAgIHZhciBmaW5pc2hEcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy8vL2NvbnNvbGUubG9nKCdmaW5pc2hEcmFnJyk7XG5cbiAgICAgICAgbGV0IGF2YXRhciA9IGRyYWdPYmplY3QuYXZhdGFyO1xuICAgICAgICBsZXQgZHJvcEVsZW0gPSBmaW5kRHJvcHBhYmxlKGUpO1xuXG4gICAgICAgIGlmICghZHJvcEVsZW0pXG4gICAgICAgICAgICBhdmF0YXIucm9sbGJhY2soKTtcblxuICAgICAgICBhdmF0YXIuc3R5bGUgPSAnJztcbiAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5yZW1vdmUoJ2RyYWctaW4nKTtcblxuICAgICAgICBsZXQgZHJvcHBhYmxlID0gZHJhZ01lbnUucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGVcIik7XG4gICAgICAgIGlmIChkcm9wcGFibGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdkZWxldGUtYXJlYScpKSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgICAgICAgICBhdmF0YXIucmVtb3ZlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZHJvcHBhYmxlLmNsYXNzTGlzdC5jb250YWlucygnc3ViLWl0ZW0nKSkge1xuXG4gICAgICAgICAgICBsZXQgbGlzdCA9IGRyb3BwYWJsZS5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoXCJ1bFwiKTtcbiAgICAgICAgICAgIGlmICghbGlzdCkge1xuICAgICAgICAgICAgICAgIGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICAgICAgICAgIGxpc3QuY2xhc3NMaXN0LmFkZCgnbWVudS1pdGVtcycpO1xuICAgICAgICAgICAgICAgIGxpc3Quc2V0QXR0cmlidXRlKCdyb2xlJywgXCJ0YWJsaXN0XCIpO1xuICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGxpc3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdmF0YXIuY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcbiAgICAgICAgICAgIGRyb3BwYWJsZS5yZXBsYWNlV2l0aChhdmF0YXIpO1xuICAgICAgICAgICAgbGlzdC5hcHBlbmRDaGlsZChhdmF0YXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5yZW1vdmUoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICBkcm9wcGFibGUucmVwbGFjZVdpdGgoYXZhdGFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNlbGVjdHMgYWxsIDx1bD4gZWxlbWVudHMsIHRoZW4gZmlsdGVycyB0aGUgY29sbGVjdGlvblxuICAgICAgICBsZXQgbGlzdHMgPSBtZW51SXRlbXMucXVlcnlTZWxlY3RvckFsbCgndWwnKTtcbiAgICAgICAgLy8ga2VlcCBvbmx5IHRob3NlIGVsZW1lbnRzIHdpdGggbm8gY2hpbGQtZWxlbWVudHNcbiAgICAgICAgbGV0IGVtcHR5TGlzdCA9IFsuLi5saXN0c10uZmlsdGVyKGVsZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW0uY2hpbGRyZW4ubGVuZ3RoID09PSAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGxldCBlbXB0eSBvZiBlbXB0eUxpc3QpXG4gICAgICAgICAgICBlbXB0eS5yZW1vdmUoKTtcblxuICAgICAgICAvL2RyYWdPYmplY3QuZGF0YSA9IHRyYW5zZm9ybURhdGEobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3IoXCIubWVudS1pdGVtc1wiKSk7XG4gICAgICAgIGRyYWdPYmplY3QuZGF0YSA9IHRyYW5zZm9ybURhdGEobWVudUl0ZW1zKTtcbiAgICAgICAgcmVtb3ZlRWxlbWVudHMobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcblxuICAgICAgICBsZXQgZGVsZXRlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhXCIpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGRlbGV0ZUFyZWEpXG4gICAgICAgICAgICAgICAgZGVsZXRlQXJlYS5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgICAgIH0sIDUwMCk7XG5cbiAgICAgICAgaWYgKCFkcm9wRWxlbSlcbiAgICAgICAgICAgIHNlbGYub25EcmFnQ2FuY2VsKGRyYWdPYmplY3QpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzZWxmLm9uRHJhZ0VuZChkcmFnT2JqZWN0LCBkcm9wRWxlbSk7XG4gICAgfVxuICAgIHZhciBmaW5kRHJvcHBhYmxlID0gKGUpID0+IHtcbiAgICAgICAgLy8g0YHQv9GA0Y/Rh9C10Lwg0L/QtdGA0LXQvdC+0YHQuNC80YvQuSDRjdC70LXQvNC10L3RglxuICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5oaWRkZW4gPSB0cnVlO1xuXG4gICAgICAgIGxldCB0b3AgPSBlLmNsaWVudFkgfHwgZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgbGV0IGxlZnQgPSBlLmNsaWVudFggfHwgZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWDtcblxuICAgICAgICAvLyDQv9C+0LvRg9GH0LjRgtGMINGB0LDQvNGL0Lkg0LLQu9C+0LbQtdC90L3Ri9C5INGN0LvQtdC80LXQvdGCINC/0L7QtCDQutGD0YDRgdC+0YDQvtC8INC80YvRiNC4XG4gICAgICAgIGxldCBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChsZWZ0LCB0b3ApO1xuXG4gICAgICAgIC8vINC/0L7QutCw0LfQsNGC0Ywg0L/QtdGA0LXQvdC+0YHQuNC80YvQuSDRjdC70LXQvNC10L3RgiDQvtCx0YDQsNGC0L3QvlxuICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5oaWRkZW4gPSBmYWxzZTtcblxuICAgICAgICBpZiAoZWxlbSA9PSBudWxsKSAvLyDRgtCw0LrQvtC1INCy0L7Qt9C80L7QttC90L4sINC10YHQu9C4INC60YPRgNGB0L7RgCDQvNGL0YjQuCBcItCy0YvQu9C10YLQtdC7XCIg0LfQsCDQs9GA0LDQvdC40YbRgyDQvtC60L3QsFxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgcmV0dXJuIGVsZW0uY2xvc2VzdCgnLmRyb3BwYWJsZScpO1xuICAgIH1cblxuXG4gICAgdmFyIG9uTW91c2VEb3duID0gKGUpID0+IHtcblxuICAgICAgICBpZiAoZS50eXBlID09PSBcIm1vdXNlZG93blwiICYmIGUud2hpY2ggIT0gMSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB2YXIgZWxlbSA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5kcmFnZ2FibGUnKTtcbiAgICAgICAgaWYgKCFlbGVtKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGRyYWdPYmplY3QuZWxlbSA9IGVsZW07XG5cbiAgICAgICAgLy8g0LfQsNC/0L7QvNC90LjQvCwg0YfRgtC+INGN0LvQtdC80LXQvdGCINC90LDQttCw0YIg0L3QsCDRgtC10LrRg9GJ0LjRhSDQutC+0L7RgNC00LjQvdCw0YLQsNGFIHBhZ2VYL3BhZ2VZXG4gICAgICAgIGRyYWdPYmplY3QuZG93blggPSBlLnBhZ2VYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgZHJhZ09iamVjdC5kb3duWSA9IGUucGFnZVkgfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIG9uTW91c2VNb3ZlID0gKGUpID0+IHtcbiAgICAgICAgaWYgKCFkcmFnT2JqZWN0LmVsZW0pIHJldHVybjsgLy8g0Y3Qu9C10LzQtdC90YIg0L3QtSDQt9Cw0LbQsNGCXG5cbiAgICAgICAgaWYgKCFkcmFnT2JqZWN0LmF2YXRhcikgeyAvLyDQtdGB0LvQuCDQv9C10YDQtdC90L7RgSDQvdC1INC90LDRh9Cw0YIuLi5cblxuICAgICAgICAgICAgbGV0IG1vdmVYID0gMDtcbiAgICAgICAgICAgIGxldCBtb3ZlWSA9IDA7XG4gICAgICAgICAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICAgICAgICAgICAgbW92ZVggPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVggLSBkcmFnT2JqZWN0LmRvd25YO1xuICAgICAgICAgICAgICAgIG1vdmVZID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZIC0gZHJhZ09iamVjdC5kb3duWTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZVggPSBlLnBhZ2VYIC0gZHJhZ09iamVjdC5kb3duWDtcbiAgICAgICAgICAgICAgICBtb3ZlWSA9IGUucGFnZVkgLSBkcmFnT2JqZWN0LmRvd25ZO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDQtdGB0LvQuCDQvNGL0YjRjCDQv9C10YDQtdC00LLQuNC90YPQu9Cw0YHRjCDQsiDQvdCw0LbQsNGC0L7QvCDRgdC+0YHRgtC+0Y/QvdC40Lgg0L3QtdC00L7RgdGC0LDRgtC+0YfQvdC+INC00LDQu9C10LrQvlxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKG1vdmVYKSA8IDUgJiYgTWF0aC5hYnMobW92ZVkpIDwgNSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0L/QtdGA0LXQvdC+0YFcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyID0gY3JlYXRlQXZhdGFyKGUpOyAvLyDRgdC+0LfQtNCw0YLRjCDQsNCy0LDRgtCw0YBcbiAgICAgICAgICAgIGlmICghZHJhZ09iamVjdC5hdmF0YXIpIHsgLy8g0L7RgtC80LXQvdCwINC/0LXRgNC10L3QvtGB0LAsINC90LXQu9GM0LfRjyBcItC30LDRhdCy0LDRgtC40YLRjFwiINC30LAg0Y3RgtGDINGH0LDRgdGC0Ywg0Y3Qu9C10LzQtdC90YLQsFxuICAgICAgICAgICAgICAgIGRyYWdPYmplY3QgPSB7fTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vINCw0LLQsNGC0LDRgCDRgdC+0LfQtNCw0L0g0YPRgdC/0LXRiNC90L5cbiAgICAgICAgICAgIC8vINGB0L7Qt9C00LDRgtGMINCy0YHQv9C+0LzQvtCz0LDRgtC10LvRjNC90YvQtSDRgdCy0L7QudGB0YLQstCwIHNoaWZ0WC9zaGlmdFlcbiAgICAgICAgICAgIGxldCBjb29yZHMgPSBnZXRDb29yZHMoZHJhZ09iamVjdC5hdmF0YXIpO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5zaGlmdFggPSBkcmFnT2JqZWN0LmRvd25YIC0gY29vcmRzLmxlZnQ7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LnNoaWZ0WSA9IGRyYWdPYmplY3QuZG93blkgLSBjb29yZHMudG9wO1xuXG4gICAgICAgICAgICBzdGFydERyYWcoZSk7IC8vINC+0YLQvtCx0YDQsNC30LjRgtGMINC90LDRh9Cw0LvQviDQv9C10YDQtdC90L7RgdCwXG4gICAgICAgIH1cblxuICAgICAgICAvLyDQvtGC0L7QsdGA0LDQt9C40YLRjCDQv9C10YDQtdC90L7RgSDQvtCx0YrQtdC60YLQsCDQv9GA0Lgg0LrQsNC20LTQvtC8INC00LLQuNC20LXQvdC40Lgg0LzRi9GI0LhcbiAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUubGVmdCA9IChlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VYIC0gZHJhZ09iamVjdC5zaGlmdFgpICsgJ3B4JztcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLnRvcCA9IChlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZIC0gZHJhZ09iamVjdC5zaGlmdFkpICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmxlZnQgPSAoZS5wYWdlWCAtIGRyYWdPYmplY3Quc2hpZnRYKSArICdweCc7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS50b3AgPSAoZS5wYWdlWSAtIGRyYWdPYmplY3Quc2hpZnRZKSArICdweCc7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGVEcm9wcGFibGUoZSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIG9uTW91c2VVcCA9IChlKSA9PiB7XG4gICAgICAgIGlmIChkcmFnT2JqZWN0LmF2YXRhcikgLy8g0LXRgdC70Lgg0L/QtdGA0LXQvdC+0YEg0LjQtNC10YJcbiAgICAgICAgICAgIGZpbmlzaERyYWcoZSk7XG5cbiAgICAgICAgLy8g0L/QtdGA0LXQvdC+0YEg0LvQuNCx0L4g0L3QtSDQvdCw0YfQuNC90LDQu9GB0Y8sINC70LjQsdC+INC30LDQstC10YDRiNC40LvRgdGPXG4gICAgICAgIC8vINCyINC70Y7QsdC+0Lwg0YHQu9GD0YfQsNC1INC+0YfQuNGB0YLQuNC8IFwi0YHQvtGB0YLQvtGP0L3QuNC1INC/0LXRgNC10L3QvtGB0LBcIiBkcmFnT2JqZWN0XG4gICAgICAgIGRyYWdPYmplY3QgPSB7fTtcbiAgICB9XG5cbiAgICB0aGlzLmdldEl0ZW1zRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtRGF0YShtZW51SXRlbXMpO1xuICAgIH07XG5cbiAgICB0aGlzLmJ1aWxkTWVudUl0ZW1zID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBsZXQgaXRlbXMgPSBbLi4uZGF0YV0uZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGl0ZW0pO1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnRfaWQgPSBpdGVtLnBhcmVudF9pZFxuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uc291cmNlX3R5cGUgJiYgIWl0ZW0uc291cmNlX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc291cmNlX25hbWUgPSBtZW51U291cmNlcy5xdWVyeVNlbGVjdG9yKCcucGFuZWwgLnBhbmVsLWhlYWRpbmcgYVtkYXRhLWlkPVwiJytpdGVtLnNvdXJjZV90eXBlKydcIl0nKS5kYXRhc2V0Lm5hbWU7XG5cbiAgICAgICAgICAgICAgICBhZGRNZW51SXRlbShpdGVtLCBwYXJlbnRfaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbkluaXQgPSBmdW5jdGlvbihtZW51SXRlbXMpIHsgfTtcbiAgICB0aGlzLm9uRHJhZ0VuZCA9IGZ1bmN0aW9uKGRyYWdPYmplY3QsIGRyb3BFbGVtKSB7fTtcbiAgICB0aGlzLm9uRHJhZ0NhbmNlbCA9IGZ1bmN0aW9uKGRyYWdPYmplY3QpIHt9O1xuXG4gICAgdGhpcy5vbkFkZFN1Y2Nlc3MgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHt9O1xuICAgIHRoaXMub25BZGRGYWlsdHVyZSA9IGZ1bmN0aW9uKGRyYWdPYmplY3QsIG1lbnVJdGVtcykge307XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZHJhZ01lbnUgJiYgbWVudUl0ZW1zKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdkcmFnTWVudS5vbmxvYWQnKTtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9ubW91c2Vkb3duID0gb25Nb3VzZURvd247XG4gICAgICAgICAgICBkcmFnTWVudS5vbnRvdWNoc3RhcnQgPSBvbk1vdXNlRG93bjtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9ubW91c2Vtb3ZlID0gb25Nb3VzZU1vdmU7XG4gICAgICAgICAgICBkcmFnTWVudS5vbnRvdWNobW92ZSA9IG9uTW91c2VNb3ZlO1xuICAgICAgICAgICAgZHJhZ01lbnUub25tb3VzZXVwID0gb25Nb3VzZVVwO1xuICAgICAgICAgICAgZHJhZ01lbnUub250b3VjaGVuZCA9IG9uTW91c2VVcDtcbiAgICAgICAgICAgIHNlbGYub25Jbml0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuRHJhZ01lbnUub25EcmFnQ2FuY2VsID0gZnVuY3Rpb24gKGRyYWdPYmplY3QpIHtcbiAgICBpZiAoZHJhZ09iamVjdC5kYXRhKSB7XG4gICAgICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgICAgIGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlID0gZHJhZ09iamVjdC5kYXRhO1xuICAgIH1cbn07XG5cbkRyYWdNZW51Lm9uRHJhZ0VuZCA9IGZ1bmN0aW9uIChkcmFnT2JqZWN0LCBkcm9wRWxlbSkge1xuICAgIGlmIChkcmFnT2JqZWN0LmRhdGEpIHtcbiAgICAgICAgbGV0IGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkTWVudUZvcm0nKTtcbiAgICAgICAgZm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dCNtZW51LWl0ZW1zJykudmFsdWUgPSBkcmFnT2JqZWN0LmRhdGE7XG4gICAgfVxufTtcblxuRHJhZ01lbnUub25BZGRTdWNjZXNzID0gZnVuY3Rpb24gKGRyYWdPYmplY3QsIG1lbnVJdGVtcykge1xuICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgZm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dCNtZW51LWl0ZW1zJykudmFsdWUgPSB0aGlzLmdldEl0ZW1zRGF0YSgpO1xufTtcblxuRHJhZ01lbnUub25Jbml0ID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgbGV0IGRhdGEgPSBKU09OLnBhcnNlKGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlKTtcbiAgICAvL2NvbnNvbGUubG9nKGRhdGEpO1xuICAgIHRoaXMuYnVpbGRNZW51SXRlbXMoZGF0YSk7XG59OyJdfQ==
