var DragMenu = new function() {

    var self = this;
    var dragObject = {};
    var dragMenu = document.getElementById('dragMenu');
    var menuItems = document.getElementById('menuItems');
    var menuSources = document.getElementById('menuSources');
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

            let forms = menuItems.querySelectorAll('.panel form');
            var sourcesList = [...forms].filter(form => {
                if (form.children.length) {

                    form.addEventListener('change', function(event) {
                        return self.onChange(dragObject, menuItems);
                    });

                    let outOfBtn = form.querySelector('.toolbar a[data-rel="out-of"]');
                    outOfBtn.onclick = function (event) {
                        event.preventDefault();
                        let elem = form.closest('.draggable');
                        if (elem) {
                            elem.classList.remove('sub-item');
                            menuItems.append(elem);
                        }
                    }

                    let upOneBtn = form.querySelector('.toolbar a[data-rel="up-one"]');
                    upOneBtn.onclick = function (event) {
                        event.preventDefault();
                        let elem = form.closest('.draggable');
                        if (elem) {
                            let prev = elem.previousSibling;
                            if (prev) {
                                elem.parentNode.insertBefore(elem, prev);
                            }
                        }
                    }

                    let downOneBtn = form.querySelector('.toolbar a[data-rel="down-one"]');
                    downOneBtn.onclick = function (event) {
                        event.preventDefault();
                        let elem = form.closest('.draggable');
                        if (elem) {
                            let next = elem.nextSibling;
                            if (next) {
                                elem.parentNode.insertBefore(elem, next.nextSibling);
                            }
                        }
                    }

                    let removeBtn = form.querySelector('.toolbar a[data-rel="remove"]');
                    removeBtn.onclick = function (event) {
                        event.preventDefault();
                        let elem = form.closest('.draggable');
                        if (elem) {
                            elem.remove();
                        }
                    }

                }
            });

            return self.onAddSuccess(dragObject, menuItems);

        }
        return self.onAddFailture(dragObject, menuItems);
    };

    if (addMenuItemForm) {
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

    if (menuSources) {
        var panels = menuSources.querySelectorAll(".panel");
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
    }

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
        if (elem) {
            dragObject.elem = elem;
            // запомним, что элемент нажат на текущих координатах pageX/pageY
            dragObject.downX = e.pageX || e.targetTouches[0].pageX;
            dragObject.downY = e.pageY || e.targetTouches[0].pageY;
        }
        return;
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

    this.onChange = function(dragObject, menuItems) {};
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

DragMenu.onChange = function (dragObject, menuItems) {
    let form = document.getElementById('addMenuForm');
    form.querySelector('input#menu-items').value = this.getItemsData();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtZW51LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIERyYWdNZW51ID0gbmV3IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkcmFnT2JqZWN0ID0ge307XG4gICAgdmFyIGRyYWdNZW51ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RyYWdNZW51Jyk7XG4gICAgdmFyIG1lbnVJdGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51SXRlbXMnKTtcbiAgICB2YXIgbWVudVNvdXJjZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudVNvdXJjZXMnKTtcbiAgICB2YXIgZm9ybVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2l0ZW1Gb3JtVGVtcGxhdGUnKTtcbiAgICB2YXIgaXRlbVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtVGVtcGxhdGUnKTtcbiAgICB2YXIgYWRkTWVudUl0ZW1Gb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVJdGVtRm9ybScpO1xuXG4gICAgY29uc3QgcmVtb3ZlRWxlbWVudHMgPSAoZWxtcykgPT4gZWxtcy5mb3JFYWNoKGVsZW0gPT4gZWxlbS5yZW1vdmUoKSk7XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1EYXRhID0gKGxpc3QsIGpzb24gPSB0cnVlKSA9PiB7XG4gICAgICAgIGxldCB0cmVlID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqINCd0LDQv9C+0LvQvdC10L3QuNC1INC00LXRgNC10LLQsCDQt9C90LDRh9C10L3QuNGP0LzQuFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxMSUVsZW1lbnR9IGUgICBMSS3RjdC70LXQvNC10L3RgiDRgSBkYXRhLWlkXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9ICAgICAgICAgcmVmINCh0YHRi9C70LrQsCDQvdCwINC00LXRgNC10LLQviwg0LrRg9C00LAg0LTQvtCx0LDQstC70Y/RgtGMINGB0LLQvtC50YHRgtCy0LBcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHB1c2goZSwgcmVmLCBub2RlID0gJ1VMJykge1xuXG4gICAgICAgICAgICBsZXQgaXRlbUZvcm0gPSBlLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm1bZGF0YS1rZXldJyk7XG4gICAgICAgICAgICBsZXQgcG9pbnRlciA9IHsgLy8g0JHQtdGA0ZHQvCDQsNGC0YDQuNCx0YPRgiBpZCDRjdC70LXQvNC10L3RgtCwXG4gICAgICAgICAgICAgICAgaWQ6IGl0ZW1Gb3JtLmdldEF0dHJpYnV0ZSgnZGF0YS1rZXknKSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIC8vc291cmNlX3R5cGU6IGl0ZW1Gb3JtLmdldEF0dHJpYnV0ZSgnZGF0YS10eXBlJykgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW25hbWVdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB0aXRsZTogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0aXRsZV1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHNvdXJjZV9pZDogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tzb3VyY2VfaWRdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBzb3VyY2VfdHlwZTogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tzb3VyY2VfdHlwZV1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHNvdXJjZV91cmw6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbc291cmNlX3VybF1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIG9ubHlfYXV0aDogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tvbmx5X2F1dGhdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB0YXJnZXRfYmxhbms6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbdGFyZ2V0X2JsYW5rXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZS5jaGlsZEVsZW1lbnRDb3VudCkgeyAvLyDQldGB0LvQuCDQtdGB0YLRjCDQv9C+0YLQvtC80LrQuFxuICAgICAgICAgICAgICAgIHBvaW50ZXIuY2hpbGRyZW4gPSBbXTsgLy8g0KHQvtC30LTQsNGR0Lwg0YHQstC+0LnRgdGC0LLQviDQtNC70Y8g0L3QuNGFXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShlLmNoaWxkcmVuKS5mb3JFYWNoKGkgPT4geyAvLyDQn9C10YDQtdCx0LjRgNCw0LXQvC4uLiDRhdC8Li4uINC00LXRgtC10LkgKNC/0L4g0LrQvtGB0YLQvtGH0LrQsNC8ISlcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkubm9kZU5hbWUgPT09IG5vZGUudG9VcHBlckNhc2UoKSkgeyAvLyDQldGB0LvQuCDQtdGB0YLRjCDQtdGJ0ZEg0L7QtNC40L0g0LrQvtC90YLQtdC50L3QtdGAIFVMLCDQv9C10YDQtdCx0LjRgNCw0LXQvCDQtdCz0L5cbiAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oaS5jaGlsZHJlbikuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoKGUsIHBvaW50ZXIuY2hpbGRyZW4pOyAvLyDQktGL0LfRi9Cy0LDQtdC8IHB1c2gg0L3QsCDQvdC+0LLRi9GFIGxpLCDQvdC+INGB0YHRi9C70LrQsCDQvdCwINC00YDQtdCy0L4g0YLQtdC/0LXRgNGMIC0g0Y3RgtC+INC80LDRgdGB0LjQsiBjaGlsZHJlbiDRg9C60LDQt9Cw0YLQtdC70Y9cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlZi5wdXNoKHBvaW50ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g0J/RgNC+0YXQvtC00LjQvNGB0Y8g0L/QviDQstGB0LXQvCBsaSDQv9C10YDQtdC00LDQvdC90L7Qs9C+IHVsXG4gICAgICAgIEFycmF5LmZyb20obGlzdC5jaGlsZHJlbikuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgIHB1c2goZSwgdHJlZSwgJ1VMJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBqc29uID8gSlNPTi5zdHJpbmdpZnkodHJlZSkgOiB0cmVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRvV3JhcCA9IChlbGVtLCB3cmFwcGVyKSA9PiB7XG4gICAgICAgIHdyYXBwZXIgPSB3cmFwcGVyIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlbGVtLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQod3JhcHBlcik7XG4gICAgICAgIHJldHVybiB3cmFwcGVyLmFwcGVuZENoaWxkKGVsZW0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gSFRNTCByZXByZXNlbnRpbmcgYSBzaW5nbGUgZWxlbWVudFxuICAgICAqIEByZXR1cm4ge0VsZW1lbnR9XG4gICAgICovXG4gICAgY29uc3QgaHRtbFRvRWxlbWVudCA9IChodG1sKSA9PiB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGh0bWwgPSBodG1sLnRyaW0oKTsgLy8gTmV2ZXIgcmV0dXJuIGEgdGV4dCBub2RlIG9mIHdoaXRlc3BhY2UgYXMgdGhlIHJlc3VsdFxuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUuY29udGVudC5maXJzdENoaWxkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBIVE1MIHJlcHJlc2VudGluZyBhbnkgbnVtYmVyIG9mIHNpYmxpbmcgZWxlbWVudHNcbiAgICAgKiBAcmV0dXJuIHtOb2RlTGlzdH1cbiAgICAgKi9cbiAgICBjb25zdCBodG1sVG9FbGVtZW50cyA9IChodG1sKSA9PiB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZS5jb250ZW50LmNoaWxkTm9kZXM7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsbFRlbXBsYXRlID0gKHN0ciwgb2JqKSA9PiB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciBiZWZvcmVSZXBsYWNlID0gc3RyO1xuICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL3t7XFxzKihbXn1cXHNdKylcXHMqfX0vZywgZnVuY3Rpb24od2hvbGVNYXRjaCwga2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YnN0aXR1dGlvbiA9IG9ialskLnRyaW0oa2V5KV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWJzdGl0dXRpb24gPT09IHVuZGVmaW5lZCA/IHdob2xlTWF0Y2ggOiBzdWJzdGl0dXRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgYWZ0ZXJSZXBsYWNlID0gc3RyICE9PSBiZWZvcmVSZXBsYWNlO1xuICAgICAgICB9IHdoaWxlIChhZnRlclJlcGxhY2UpO1xuXG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfTtcblxuICAgIGNvbnN0IGdldENvb3JkcyA9IChlbGVtKSA9PiB7XG4gICAgICAgIGxldCBib3ggPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9wOiBib3gudG9wICsgcGFnZVlPZmZzZXQsXG4gICAgICAgICAgICBsZWZ0OiBib3gubGVmdCArIHBhZ2VYT2Zmc2V0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGFkZE1lbnVJdGVtID0gKGl0ZW0sIHBhcmVudCA9IG51bGwpID0+IHtcbiAgICAgICAgaWYgKG1lbnVJdGVtcyAmJiBpdGVtVGVtcGxhdGUgJiYgJ2NvbnRlbnQnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJykpIHtcblxuICAgICAgICAgICAgaWYgKG1lbnVJdGVtcy5jbGFzc0xpc3QuY29udGFpbnMoJ25vLWl0ZW1zJykpIHtcbiAgICAgICAgICAgICAgICBtZW51SXRlbXMuY2xhc3NMaXN0LnJlbW92ZSgnbm8taXRlbXMnKTtcbiAgICAgICAgICAgICAgICBtZW51SXRlbXMuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGRhdGEgPSBpdGVtO1xuICAgICAgICAgICAgZGF0YS5mb3JtID0gZmlsbFRlbXBsYXRlKGZvcm1UZW1wbGF0ZS5pbm5lckhUTUwsIGRhdGEpO1xuXG4gICAgICAgICAgICBsZXQgaHRtbCA9IGZpbGxUZW1wbGF0ZShpdGVtVGVtcGxhdGUuaW5uZXJIVE1MLCBkYXRhKTtcbiAgICAgICAgICAgIGlmIChodG1sKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5jbGFzc0xpc3QuYWRkKCdtZW51LWl0ZW1zJyk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3Quc2V0QXR0cmlidXRlKCdyb2xlJywgXCJ0YWJsaXN0XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBsaXN0SXRlbSA9IGh0bWxUb0VsZW1lbnQoaHRtbCk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QuYXBwZW5kKGxpc3RJdGVtKTtcblxuICAgICAgICAgICAgICAgICAgICBtZW51SXRlbXMucXVlcnlTZWxlY3RvcignW2RhdGEtaWQ9XCInICsgcGFyZW50ICsgJ1wiXScpLmFwcGVuZChsaXN0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtZW51SXRlbXMuYXBwZW5kKGh0bWxUb0VsZW1lbnQoaHRtbCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGZvcm1zID0gbWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYW5lbCBmb3JtJyk7XG4gICAgICAgICAgICB2YXIgc291cmNlc0xpc3QgPSBbLi4uZm9ybXNdLmZpbHRlcihmb3JtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZm9ybS5jaGlsZHJlbi5sZW5ndGgpIHtcblxuICAgICAgICAgICAgICAgICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5vbkNoYW5nZShkcmFnT2JqZWN0LCBtZW51SXRlbXMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgb3V0T2ZCdG4gPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy50b29sYmFyIGFbZGF0YS1yZWw9XCJvdXQtb2ZcIl0nKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0T2ZCdG4ub25jbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtID0gZm9ybS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW51SXRlbXMuYXBwZW5kKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHVwT25lQnRuID0gZm9ybS5xdWVyeVNlbGVjdG9yKCcudG9vbGJhciBhW2RhdGEtcmVsPVwidXAtb25lXCJdJyk7XG4gICAgICAgICAgICAgICAgICAgIHVwT25lQnRuLm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbSA9IGZvcm0uY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJldiA9IGVsZW0ucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWxlbSwgcHJldik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IGRvd25PbmVCdG4gPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy50b29sYmFyIGFbZGF0YS1yZWw9XCJkb3duLW9uZVwiXScpO1xuICAgICAgICAgICAgICAgICAgICBkb3duT25lQnRuLm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbSA9IGZvcm0uY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IGVsZW0ubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbGVtLCBuZXh0Lm5leHRTaWJsaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVtb3ZlQnRuID0gZm9ybS5xdWVyeVNlbGVjdG9yKCcudG9vbGJhciBhW2RhdGEtcmVsPVwicmVtb3ZlXCJdJyk7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUJ0bi5vbmNsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW0gPSBmb3JtLmNsb3Nlc3QoJy5kcmFnZ2FibGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzZWxmLm9uQWRkU3VjY2VzcyhkcmFnT2JqZWN0LCBtZW51SXRlbXMpO1xuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGYub25BZGRGYWlsdHVyZShkcmFnT2JqZWN0LCBtZW51SXRlbXMpO1xuICAgIH07XG5cbiAgICBpZiAoYWRkTWVudUl0ZW1Gb3JtKSB7XG4gICAgICAgIGxldCBhZGRCdXR0b24gPSBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignYnV0dG9uW2RhdGEtcmVsPVwiYWRkXCJdJyk7XG4gICAgICAgIGFkZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBjb2xsYXBzZVRvZ2dsZXIgPSBtZW51U291cmNlcy5xdWVyeVNlbGVjdG9yKCcjc291cmNlLWxpbmsgYVtkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdJyk7XG5cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coY29sbGFwc2VUb2dnbGVyKTtcblxuICAgICAgICAgICAgbGV0IGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgJ2lkJzogbnVsbCxcbiAgICAgICAgICAgICAgICAnc291cmNlJzogY29sbGFwc2VUb2dnbGVyLmRhdGFzZXQudHlwZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfbmFtZSc6IGNvbGxhcHNlVG9nZ2xlci5kYXRhc2V0Lm5hbWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAnbmFtZSc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW25hbWVdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbdGl0bGVdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZV9pZCc6IG51bGwsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZV90eXBlJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbc291cmNlX3R5cGVdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZV91cmwnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tzb3VyY2VfdXJsXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICdvbmx5X2F1dGgnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tvbmx5X2F1dGhdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3RhcmdldF9ibGFuayc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RhcmdldF9ibGFua11cIl0nKS52YWx1ZSB8fCBmYWxzZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChhZGRNZW51SXRlbShpdGVtKSlcbiAgICAgICAgICAgICAgICBhZGRNZW51SXRlbUZvcm0ucmVzZXQoKTtcblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobWVudVNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHBhbmVscyA9IG1lbnVTb3VyY2VzLnF1ZXJ5U2VsZWN0b3JBbGwoXCIucGFuZWxcIik7XG4gICAgICAgIHZhciBzb3VyY2VzTGlzdCA9IFsuLi5wYW5lbHNdLmZpbHRlcihwYW5lbCA9PiB7XG4gICAgICAgICAgICBpZiAocGFuZWwuY2hpbGRyZW4ubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgYWRkQnV0dG9uID0gcGFuZWwucXVlcnlTZWxlY3RvcignYnV0dG9uW2RhdGEtcmVsPVwiYWRkXCJdJyk7XG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdEFsbCA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXVtuYW1lPVwic2VsZWN0LWFsbFwiXScpO1xuICAgICAgICAgICAgICAgIGxldCBpdGVtcyA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zb3VyY2UtbGlzdCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKTtcblxuXG4gICAgICAgICAgICAgICAgaWYgKGFkZEJ1dHRvbiAmJiBpdGVtcykge1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFuZWwucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOmNoZWNrZWQ6bm90KFtuYW1lPVwic2VsZWN0LWFsbFwiXSknKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b24ub25jbGljayA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzb3VyY2VzSXRlbXMgPSBbLi4uaXRlbXNdLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZE1lbnVJdGVtKGl0ZW0uZGF0YXNldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdEFsbCAmJiBpdGVtcykge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RBbGwub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGNoZWNrYm94ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3gub25jaGFuZ2UoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBjcmVhdGVEcm9wcGFibGUgPSAoZSkgPT4ge1xuICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgbGV0IGxlZnQgPSBlLmNsaWVudFggfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQobGVmdCwgdG9wKTtcbiAgICAgICAgbGV0IGRyb3BwYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LmFkZCgnZHJvcHBhYmxlJyk7XG5cbiAgICAgICAgaWYgKChkcmFnT2JqZWN0LmF2YXRhci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IC0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0KSA+PSAoZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0V2lkdGgqMC4xKSlcbiAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICBsZXQgaXRlbVRleHQgPSBkcmFnT2JqZWN0LmF2YXRhci5xdWVyeVNlbGVjdG9yKCcucGFuZWwtdGl0bGUgYVtkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdJykuZGF0YXNldFsnbmFtZSddO1xuICAgICAgICBsZXQgZHJvcHBhYmxlVGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGl0ZW1UZXh0LnRyaW0oKSk7XG4gICAgICAgIGRyb3BwYWJsZS5hcHBlbmRDaGlsZChkcm9wcGFibGVUZXh0KTtcblxuICAgICAgICBkcm9wcGFibGUuc3R5bGUud2lkdGggPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCArICdweCc7XG4gICAgICAgIGRyb3BwYWJsZS5zdHlsZS5oZWlnaHQgPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRIZWlnaHQgKyAncHgnO1xuXG4gICAgICAgIGlmICghZHJvcHBhYmxlLmlzRXF1YWxOb2RlKGRyYWdPYmplY3QuZHJvcHBhYmxlKSkge1xuICAgICAgICAgICAgcmVtb3ZlRWxlbWVudHMobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZHJvcHBhYmxlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkcmFnT2JqZWN0LmRyb3BwYWJsZSA9IGRyb3BwYWJsZTtcblxuICAgICAgICBsZXQgdGFyZ2V0ID0gZWxlbS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG5cbiAgICAgICAgaWYgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgIC8vLy9jb25zb2xlLmxvZygndGFyZ2V0JywgdGFyZ2V0KTtcblxuICAgICAgICAgICAgcmVtb3ZlRWxlbWVudHMobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcblxuICAgICAgICAgICAgbGV0IHRvcCA9IGUuY2xpZW50WSB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgICAgICBsZXQgbGVmdCA9IGUuY2xpZW50WCB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgICAgICBpZiAodG9wID49ICh0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgKHRhcmdldC5vZmZzZXRIZWlnaHQvMS41KSkpIHtcblxuXG4gICAgICAgICAgICAgICAgaWYgKChkcmFnT2JqZWN0LmF2YXRhci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IC0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0KSA+PSAoZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0V2lkdGgqMC4xKSlcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYXBzZScpLmFmdGVyKGRyb3BwYWJsZSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuYWZ0ZXIoZHJvcHBhYmxlKTtcblxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKVxuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcblxuICAgICAgICAgICAgICAgIC8vLy9jb25zb2xlLmxvZygnYWZ0ZXInKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCAodGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICh0YXJnZXQub2Zmc2V0SGVpZ2h0LzEuNSkpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5iZWZvcmUoZHJvcHBhYmxlKTtcblxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJykuZmlyc3RDaGlsZC5pc0VxdWFsTm9kZShkcm9wcGFibGUpKVxuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vLy9jb25zb2xlLmxvZygnYmVmb3JlJyk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUud2lkdGggPSBkcm9wcGFibGUub2Zmc2V0V2lkdGggKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUuaGVpZ2h0ID0gZHJvcHBhYmxlLm9mZnNldEhlaWdodCArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNyZWF0ZUF2YXRhciA9IChlKSA9PiB7XG5cbiAgICAgICAgLy8g0LfQsNC/0L7QvNC90LjRgtGMINGB0YLQsNGA0YvQtSDRgdCy0L7QudGB0YLQstCwLCDRh9GC0L7QsdGLINCy0LXRgNC90YPRgtGM0YHRjyDQuiDQvdC40Lwg0L/RgNC4INC+0YLQvNC10L3QtSDQv9C10YDQtdC90L7RgdCwXG4gICAgICAgIHZhciBhdmF0YXIgPSBkcmFnT2JqZWN0LmVsZW07XG4gICAgICAgIHZhciBvbGQgPSB7XG4gICAgICAgICAgICBwYXJlbnQ6IGF2YXRhci5wYXJlbnROb2RlLFxuICAgICAgICAgICAgbmV4dFNpYmxpbmc6IGF2YXRhci5uZXh0U2libGluZyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhdmF0YXIucG9zaXRpb24gfHwgJycsXG4gICAgICAgICAgICBsZWZ0OiBhdmF0YXIubGVmdCB8fCAnJyxcbiAgICAgICAgICAgIHRvcDogYXZhdGFyLnRvcCB8fCAnJyxcbiAgICAgICAgICAgIHpJbmRleDogYXZhdGFyLnpJbmRleCB8fCAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vINGE0YPQvdC60YbQuNGPINC00LvRjyDQvtGC0LzQtdC90Ysg0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICBhdmF0YXIucm9sbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBvbGQucGFyZW50Lmluc2VydEJlZm9yZShhdmF0YXIsIG9sZC5uZXh0U2libGluZyk7XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUucG9zaXRpb24gPSBvbGQucG9zaXRpb247XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUubGVmdCA9IG9sZC5sZWZ0O1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnRvcCA9IG9sZC50b3A7XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUuekluZGV4ID0gb2xkLnpJbmRleDtcbiAgICAgICAgICAgIC8vLy9jb25zb2xlLmxvZygnRHJhZyBjYW5jZWwsIHJvbGxiYWNrJyk7XG4gICAgICAgICAgICAvKnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRyb3BwYWJsZS5kZWxldGUtYXJlYScpLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgICAgICAgICAgIH0sIDUwMCk7Ki9cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYXZhdGFyO1xuICAgIH1cbiAgICB2YXIgc3RhcnREcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy8vL2NvbnNvbGUubG9nKCdzdGFydERyYWcnKTtcblxuICAgICAgICBsZXQgYXZhdGFyID0gZHJhZ09iamVjdC5hdmF0YXI7XG4gICAgICAgIGF2YXRhci5zdHlsZS53aWR0aCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldEhlaWdodCArICdweCc7XG5cbiAgICAgICAgLy8g0LjQvdC40YbQuNC40YDQvtCy0LDRgtGMINC90LDRh9Cw0LvQviDQv9C10YDQtdC90L7RgdCwXG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QuYWRkKCdkcmFnLWluJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcblxuICAgICAgICBsZXQgZGVsZXRlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhXCIpO1xuICAgICAgICBpZiAoZGVsZXRlQXJlYSlcbiAgICAgICAgICAgIGRlbGV0ZUFyZWEuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuXG4gICAgfVxuICAgIHZhciBmaW5pc2hEcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy8vL2NvbnNvbGUubG9nKCdmaW5pc2hEcmFnJyk7XG5cbiAgICAgICAgbGV0IGF2YXRhciA9IGRyYWdPYmplY3QuYXZhdGFyO1xuICAgICAgICBsZXQgZHJvcEVsZW0gPSBmaW5kRHJvcHBhYmxlKGUpO1xuXG4gICAgICAgIGlmICghZHJvcEVsZW0pXG4gICAgICAgICAgICBhdmF0YXIucm9sbGJhY2soKTtcblxuICAgICAgICBhdmF0YXIuc3R5bGUgPSAnJztcbiAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5yZW1vdmUoJ2RyYWctaW4nKTtcblxuICAgICAgICBsZXQgZHJvcHBhYmxlID0gZHJhZ01lbnUucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGVcIik7XG4gICAgICAgIGlmIChkcm9wcGFibGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdkZWxldGUtYXJlYScpKSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgICAgICAgICBhdmF0YXIucmVtb3ZlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZHJvcHBhYmxlLmNsYXNzTGlzdC5jb250YWlucygnc3ViLWl0ZW0nKSkge1xuXG4gICAgICAgICAgICBsZXQgbGlzdCA9IGRyb3BwYWJsZS5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoXCJ1bFwiKTtcbiAgICAgICAgICAgIGlmICghbGlzdCkge1xuICAgICAgICAgICAgICAgIGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICAgICAgICAgIGxpc3QuY2xhc3NMaXN0LmFkZCgnbWVudS1pdGVtcycpO1xuICAgICAgICAgICAgICAgIGxpc3Quc2V0QXR0cmlidXRlKCdyb2xlJywgXCJ0YWJsaXN0XCIpO1xuICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGxpc3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdmF0YXIuY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcbiAgICAgICAgICAgIGRyb3BwYWJsZS5yZXBsYWNlV2l0aChhdmF0YXIpO1xuICAgICAgICAgICAgbGlzdC5hcHBlbmRDaGlsZChhdmF0YXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5yZW1vdmUoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICBkcm9wcGFibGUucmVwbGFjZVdpdGgoYXZhdGFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNlbGVjdHMgYWxsIDx1bD4gZWxlbWVudHMsIHRoZW4gZmlsdGVycyB0aGUgY29sbGVjdGlvblxuICAgICAgICBsZXQgbGlzdHMgPSBtZW51SXRlbXMucXVlcnlTZWxlY3RvckFsbCgndWwnKTtcbiAgICAgICAgLy8ga2VlcCBvbmx5IHRob3NlIGVsZW1lbnRzIHdpdGggbm8gY2hpbGQtZWxlbWVudHNcbiAgICAgICAgbGV0IGVtcHR5TGlzdCA9IFsuLi5saXN0c10uZmlsdGVyKGVsZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW0uY2hpbGRyZW4ubGVuZ3RoID09PSAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGxldCBlbXB0eSBvZiBlbXB0eUxpc3QpXG4gICAgICAgICAgICBlbXB0eS5yZW1vdmUoKTtcblxuICAgICAgICAvL2RyYWdPYmplY3QuZGF0YSA9IHRyYW5zZm9ybURhdGEobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3IoXCIubWVudS1pdGVtc1wiKSk7XG4gICAgICAgIGRyYWdPYmplY3QuZGF0YSA9IHRyYW5zZm9ybURhdGEobWVudUl0ZW1zKTtcbiAgICAgICAgcmVtb3ZlRWxlbWVudHMobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcblxuICAgICAgICBsZXQgZGVsZXRlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhXCIpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGRlbGV0ZUFyZWEpXG4gICAgICAgICAgICAgICAgZGVsZXRlQXJlYS5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgICAgIH0sIDUwMCk7XG5cbiAgICAgICAgaWYgKCFkcm9wRWxlbSlcbiAgICAgICAgICAgIHNlbGYub25EcmFnQ2FuY2VsKGRyYWdPYmplY3QpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzZWxmLm9uRHJhZ0VuZChkcmFnT2JqZWN0LCBkcm9wRWxlbSk7XG4gICAgfVxuICAgIHZhciBmaW5kRHJvcHBhYmxlID0gKGUpID0+IHtcbiAgICAgICAgLy8g0YHQv9GA0Y/Rh9C10Lwg0L/QtdGA0LXQvdC+0YHQuNC80YvQuSDRjdC70LXQvNC10L3RglxuICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5oaWRkZW4gPSB0cnVlO1xuXG4gICAgICAgIGxldCB0b3AgPSBlLmNsaWVudFkgfHwgZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgbGV0IGxlZnQgPSBlLmNsaWVudFggfHwgZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWDtcblxuICAgICAgICAvLyDQv9C+0LvRg9GH0LjRgtGMINGB0LDQvNGL0Lkg0LLQu9C+0LbQtdC90L3Ri9C5INGN0LvQtdC80LXQvdGCINC/0L7QtCDQutGD0YDRgdC+0YDQvtC8INC80YvRiNC4XG4gICAgICAgIGxldCBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChsZWZ0LCB0b3ApO1xuXG4gICAgICAgIC8vINC/0L7QutCw0LfQsNGC0Ywg0L/QtdGA0LXQvdC+0YHQuNC80YvQuSDRjdC70LXQvNC10L3RgiDQvtCx0YDQsNGC0L3QvlxuICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5oaWRkZW4gPSBmYWxzZTtcblxuICAgICAgICBpZiAoZWxlbSA9PSBudWxsKSAvLyDRgtCw0LrQvtC1INCy0L7Qt9C80L7QttC90L4sINC10YHQu9C4INC60YPRgNGB0L7RgCDQvNGL0YjQuCBcItCy0YvQu9C10YLQtdC7XCIg0LfQsCDQs9GA0LDQvdC40YbRgyDQvtC60L3QsFxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgcmV0dXJuIGVsZW0uY2xvc2VzdCgnLmRyb3BwYWJsZScpO1xuICAgIH1cblxuXG4gICAgdmFyIG9uTW91c2VEb3duID0gKGUpID0+IHtcblxuICAgICAgICBpZiAoZS50eXBlID09PSBcIm1vdXNlZG93blwiICYmIGUud2hpY2ggIT0gMSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB2YXIgZWxlbSA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5kcmFnZ2FibGUnKTtcbiAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZWxlbSA9IGVsZW07XG4gICAgICAgICAgICAvLyDQt9Cw0L/QvtC80L3QuNC8LCDRh9GC0L4g0Y3Qu9C10LzQtdC90YIg0L3QsNC20LDRgiDQvdCwINGC0LXQutGD0YnQuNGFINC60L7QvtGA0LTQuNC90LDRgtCw0YUgcGFnZVgvcGFnZVlcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZG93blggPSBlLnBhZ2VYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZG93blkgPSBlLnBhZ2VZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBvbk1vdXNlTW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGlmICghZHJhZ09iamVjdC5lbGVtKSByZXR1cm47IC8vINGN0LvQtdC80LXQvdGCINC90LUg0LfQsNC20LDRglxuXG4gICAgICAgIGlmICghZHJhZ09iamVjdC5hdmF0YXIpIHsgLy8g0LXRgdC70Lgg0L/QtdGA0LXQvdC+0YEg0L3QtSDQvdCw0YfQsNGCLi4uXG5cbiAgICAgICAgICAgIGxldCBtb3ZlWCA9IDA7XG4gICAgICAgICAgICBsZXQgbW92ZVkgPSAwO1xuICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgICAgICAgICAgIG1vdmVYID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYIC0gZHJhZ09iamVjdC5kb3duWDtcbiAgICAgICAgICAgICAgICBtb3ZlWSA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3QuZG93blk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVYID0gZS5wYWdlWCAtIGRyYWdPYmplY3QuZG93blg7XG4gICAgICAgICAgICAgICAgbW92ZVkgPSBlLnBhZ2VZIC0gZHJhZ09iamVjdC5kb3duWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g0LXRgdC70Lgg0LzRi9GI0Ywg0L/QtdGA0LXQtNCy0LjQvdGD0LvQsNGB0Ywg0LIg0L3QsNC20LDRgtC+0Lwg0YHQvtGB0YLQvtGP0L3QuNC4INC90LXQtNC+0YHRgtCw0YLQvtGH0L3QviDQtNCw0LvQtdC60L5cbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhtb3ZlWCkgPCA1ICYmIE1hdGguYWJzKG1vdmVZKSA8IDUpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INC/0LXRgNC10L3QvtGBXG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhciA9IGNyZWF0ZUF2YXRhcihlKTsgLy8g0YHQvtC30LTQsNGC0Ywg0LDQstCw0YLQsNGAXG4gICAgICAgICAgICBpZiAoIWRyYWdPYmplY3QuYXZhdGFyKSB7IC8vINC+0YLQvNC10L3QsCDQv9C10YDQtdC90L7RgdCwLCDQvdC10LvRjNC30Y8gXCLQt9Cw0YXQstCw0YLQuNGC0YxcIiDQt9CwINGN0YLRgyDRh9Cw0YHRgtGMINGN0LvQtdC80LXQvdGC0LBcbiAgICAgICAgICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDQsNCy0LDRgtCw0YAg0YHQvtC30LTQsNC9INGD0YHQv9C10YjQvdC+XG4gICAgICAgICAgICAvLyDRgdC+0LfQtNCw0YLRjCDQstGB0L/QvtC80L7Qs9Cw0YLQtdC70YzQvdGL0LUg0YHQstC+0LnRgdGC0LLQsCBzaGlmdFgvc2hpZnRZXG4gICAgICAgICAgICBsZXQgY29vcmRzID0gZ2V0Q29vcmRzKGRyYWdPYmplY3QuYXZhdGFyKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3Quc2hpZnRYID0gZHJhZ09iamVjdC5kb3duWCAtIGNvb3Jkcy5sZWZ0O1xuICAgICAgICAgICAgZHJhZ09iamVjdC5zaGlmdFkgPSBkcmFnT2JqZWN0LmRvd25ZIC0gY29vcmRzLnRvcDtcblxuICAgICAgICAgICAgc3RhcnREcmFnKGUpOyAvLyDQvtGC0L7QsdGA0LDQt9C40YLRjCDQvdCw0YfQsNC70L4g0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICB9XG5cbiAgICAgICAgLy8g0L7RgtC+0LHRgNCw0LfQuNGC0Ywg0L/QtdGA0LXQvdC+0YEg0L7QsdGK0LXQutGC0LAg0L/RgNC4INC60LDQttC00L7QvCDQtNCy0LjQttC10L3QuNC4INC80YvRiNC4XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmxlZnQgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCAtIGRyYWdPYmplY3Quc2hpZnRYKSArICdweCc7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS50b3AgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3Quc2hpZnRZKSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS5sZWZ0ID0gKGUucGFnZVggLSBkcmFnT2JqZWN0LnNoaWZ0WCkgKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUudG9wID0gKGUucGFnZVkgLSBkcmFnT2JqZWN0LnNoaWZ0WSkgKyAncHgnO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlRHJvcHBhYmxlKGUpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBvbk1vdXNlVXAgPSAoZSkgPT4ge1xuICAgICAgICBpZiAoZHJhZ09iamVjdC5hdmF0YXIpIC8vINC10YHQu9C4INC/0LXRgNC10L3QvtGBINC40LTQtdGCXG4gICAgICAgICAgICBmaW5pc2hEcmFnKGUpO1xuXG4gICAgICAgIC8vINC/0LXRgNC10L3QvtGBINC70LjQsdC+INC90LUg0L3QsNGH0LjQvdCw0LvRgdGPLCDQu9C40LHQviDQt9Cw0LLQtdGA0YjQuNC70YHRj1xuICAgICAgICAvLyDQsiDQu9GO0LHQvtC8INGB0LvRg9GH0LDQtSDQvtGH0LjRgdGC0LjQvCBcItGB0L7RgdGC0L7Rj9C90LjQtSDQv9C10YDQtdC90L7RgdCwXCIgZHJhZ09iamVjdFxuICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgfVxuXG4gICAgdGhpcy5nZXRJdGVtc0RhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybURhdGEobWVudUl0ZW1zKTtcbiAgICB9O1xuXG4gICAgdGhpcy5idWlsZE1lbnVJdGVtcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgbGV0IGl0ZW1zID0gWy4uLmRhdGFdLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50X2lkID0gaXRlbS5wYXJlbnRfaWRcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtLnNvdXJjZV90eXBlICYmICFpdGVtLnNvdXJjZV9uYW1lKVxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNvdXJjZV9uYW1lID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvcignLnBhbmVsIC5wYW5lbC1oZWFkaW5nIGFbZGF0YS1pZD1cIicraXRlbS5zb3VyY2VfdHlwZSsnXCJdJykuZGF0YXNldC5uYW1lO1xuXG4gICAgICAgICAgICAgICAgYWRkTWVudUl0ZW0oaXRlbSwgcGFyZW50X2lkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMub25Jbml0ID0gZnVuY3Rpb24obWVudUl0ZW1zKSB7IH07XG4gICAgdGhpcy5vbkRyYWdFbmQgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBkcm9wRWxlbSkge307XG4gICAgdGhpcy5vbkRyYWdDYW5jZWwgPSBmdW5jdGlvbihkcmFnT2JqZWN0KSB7fTtcblxuICAgIHRoaXMub25DaGFuZ2UgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHt9O1xuICAgIHRoaXMub25BZGRTdWNjZXNzID0gZnVuY3Rpb24oZHJhZ09iamVjdCwgbWVudUl0ZW1zKSB7fTtcbiAgICB0aGlzLm9uQWRkRmFpbHR1cmUgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHt9O1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGRyYWdNZW51ICYmIG1lbnVJdGVtcykge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnZHJhZ01lbnUub25sb2FkJyk7XG4gICAgICAgICAgICBkcmFnTWVudS5vbm1vdXNlZG93biA9IG9uTW91c2VEb3duO1xuICAgICAgICAgICAgZHJhZ01lbnUub250b3VjaHN0YXJ0ID0gb25Nb3VzZURvd247XG4gICAgICAgICAgICBkcmFnTWVudS5vbm1vdXNlbW92ZSA9IG9uTW91c2VNb3ZlO1xuICAgICAgICAgICAgZHJhZ01lbnUub250b3VjaG1vdmUgPSBvbk1vdXNlTW92ZTtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9ubW91c2V1cCA9IG9uTW91c2VVcDtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9udG91Y2hlbmQgPSBvbk1vdXNlVXA7XG4gICAgICAgICAgICBzZWxmLm9uSW5pdCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbkRyYWdNZW51Lm9uRHJhZ0NhbmNlbCA9IGZ1bmN0aW9uIChkcmFnT2JqZWN0KSB7XG4gICAgaWYgKGRyYWdPYmplY3QuZGF0YSkge1xuICAgICAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgICAgICBmb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0I21lbnUtaXRlbXMnKS52YWx1ZSA9IGRyYWdPYmplY3QuZGF0YTtcbiAgICB9XG59O1xuXG5EcmFnTWVudS5vbkRyYWdFbmQgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCwgZHJvcEVsZW0pIHtcbiAgICBpZiAoZHJhZ09iamVjdC5kYXRhKSB7XG4gICAgICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgICAgIGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlID0gZHJhZ09iamVjdC5kYXRhO1xuICAgIH1cbn07XG5cbkRyYWdNZW51Lm9uQ2hhbmdlID0gZnVuY3Rpb24gKGRyYWdPYmplY3QsIG1lbnVJdGVtcykge1xuICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgZm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dCNtZW51LWl0ZW1zJykudmFsdWUgPSB0aGlzLmdldEl0ZW1zRGF0YSgpO1xufTtcblxuRHJhZ01lbnUub25BZGRTdWNjZXNzID0gZnVuY3Rpb24gKGRyYWdPYmplY3QsIG1lbnVJdGVtcykge1xuICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgZm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dCNtZW51LWl0ZW1zJykudmFsdWUgPSB0aGlzLmdldEl0ZW1zRGF0YSgpO1xufTtcblxuRHJhZ01lbnUub25Jbml0ID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgbGV0IGRhdGEgPSBKU09OLnBhcnNlKGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlKTtcbiAgICAvL2NvbnNvbGUubG9nKGRhdGEpO1xuICAgIHRoaXMuYnVpbGRNZW51SXRlbXMoZGF0YSk7XG59OyJdfQ==
