var DragMenu = new function() {

    var self = this;
    var dragObject = {};
    var dragMenu = document.getElementById('dragMenu');
    var menuItemsList = document.getElementById('menuItems');
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
                type: itemForm.getAttribute('data-type') || null,
                name: itemForm.querySelector('input[name="MenuItems[name]"]').value || null,
                title: itemForm.querySelector('input[name="MenuItems[title]"]').value || null,
                url: itemForm.querySelector('input[name="MenuItems[url]"]').value || null,
                auth: itemForm.querySelector('input[name="MenuItems[only_auth]"]').value || null,
                target: itemForm.querySelector('input[name="MenuItems[target_blank]"]').value || null,
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

    var addMenuItem = (item) => {
        if (menuItemsList && itemTemplate && 'content' in document.createElement('template')) {

            if (menuItemsList.classList.contains('no-items')) {
                menuItemsList.classList.remove('no-items');
                menuItemsList.innerHTML = "";
            }

            let data = item;
            data.form = fillTemplate(formTemplate.innerHTML, data);

            let content = fillTemplate(itemTemplate.innerHTML, data);

            menuItemsList.append(htmlToElement(content));
            return self.onAddSuccess(dragObject, menuItemsList);

        }
        return self.onAddFailture(dragObject, menuItemsList);
    };

    if (addMenuItemForm.length) {
        let addButton = addMenuItemForm.querySelector('button[data-rel="add"]');
        addButton.addEventListener("click", (event) => {

            let collapseToggler = menuSources.querySelector('#source-link a[data-toggle="collapse"]');

            console.log(collapseToggler);

            let item = {
                'id': null,
                'source': collapseToggler.dataset.type || null,
                'source_name': collapseToggler.dataset.name || null,
                'name': addMenuItemForm.querySelector('input[name="MenuItems[name]"]').value || false,
                'title': addMenuItemForm.querySelector('input[name="MenuItems[title]"]').value || false,
                'url': addMenuItemForm.querySelector('input[name="MenuItems[url]"]').value || false,
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
            removeElements(menuItemsList.querySelectorAll(".droppable:not(.delete-area)"));
            dragObject.droppable = null;
        }
        dragObject.droppable = droppable;

        let target = elem.closest('.draggable');

        if (target && typeof target !== "undefined") {

            //console.log('target', target);

            removeElements(menuItemsList.querySelectorAll(".droppable:not(.delete-area)"));

            let top = e.clientY || e.targetTouches[0].pageY;
            let left = e.clientX || e.targetTouches[0].pageX;
            if (top >= (target.getBoundingClientRect().top + (target.offsetHeight/1.5))) {


                if ((dragObject.avatar.getBoundingClientRect().left - elem.getBoundingClientRect().left) >= (dragObject.avatar.offsetWidth*0.1))
                    target.querySelector('.collapse').after(droppable);
                else
                    target.after(droppable);

                if (target.classList.contains('sub-item'))
                    droppable.classList.add('sub-item');

                //console.log('after');

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

                //console.log('before');

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
            //console.log('Drag cancel, rollback');
            /*setTimeout(function() {
                document.querySelector('.droppable.delete-area').classList.remove('show');
            }, 500);*/
        };

        return avatar;
    }
    var startDrag = (e) => {
        //console.log('startDrag');

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
        //console.log('finishDrag');

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
        let lists = menuItemsList.querySelectorAll('ul');
        // keep only those elements with no child-elements
        let emptyList = [...lists].filter(elem => {
            return elem.children.length === 0;
        });

        for (let empty of emptyList)
            empty.remove();

        //dragObject.data = transformData(menuItemsList.querySelector(".menu-items"));
        dragObject.data = transformData(menuItemsList);
        removeElements(menuItemsList.querySelectorAll(".droppable:not(.delete-area)"));

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
        if (!elem) return;

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


    dragMenu.onmousedown = onMouseDown;
    dragMenu.ontouchstart = onMouseDown;
    dragMenu.onmousemove = onMouseMove;
    dragMenu.ontouchmove = onMouseMove;
    dragMenu.onmouseup = onMouseUp;
    dragMenu.ontouchend = onMouseUp;

    this.getItemsData = function() {
        return transformData(menuItemsList);
    };

    this.onDragEnd = function(dragObject, dropElem) {};
    this.onDragCancel = function(dragObject) {};

    this.onAddSuccess = function(dragObject, menuItemsList) {};
    this.onAddFailture = function(dragObject, menuItemsList) {};

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

DragMenu.onAddSuccess = function (dragObject, menuItemsList) {
    let form = document.getElementById('addMenuForm');
    form.querySelector('input#menu-items').value = this.getItemsData();
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1lbnUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgRHJhZ01lbnUgPSBuZXcgZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRyYWdPYmplY3QgPSB7fTtcbiAgICB2YXIgZHJhZ01lbnUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHJhZ01lbnUnKTtcbiAgICB2YXIgbWVudUl0ZW1zTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51SXRlbXMnKTtcbiAgICB2YXIgbWVudVNvdXJjZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudVNvdXJjZXMnKTtcbiAgICB2YXIgcGFuZWxzID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvckFsbChcIi5wYW5lbFwiKTtcbiAgICB2YXIgZm9ybVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2l0ZW1Gb3JtVGVtcGxhdGUnKTtcbiAgICB2YXIgaXRlbVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtVGVtcGxhdGUnKTtcbiAgICB2YXIgYWRkTWVudUl0ZW1Gb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVJdGVtRm9ybScpO1xuXG4gICAgY29uc3QgcmVtb3ZlRWxlbWVudHMgPSAoZWxtcykgPT4gZWxtcy5mb3JFYWNoKGVsZW0gPT4gZWxlbS5yZW1vdmUoKSk7XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1EYXRhID0gKGxpc3QsIGpzb24gPSB0cnVlKSA9PiB7XG4gICAgICAgIGxldCB0cmVlID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqINCd0LDQv9C+0LvQvdC10L3QuNC1INC00LXRgNC10LLQsCDQt9C90LDRh9C10L3QuNGP0LzQuFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxMSUVsZW1lbnR9IGUgICBMSS3RjdC70LXQvNC10L3RgiDRgSBkYXRhLWlkXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9ICAgICAgICAgcmVmINCh0YHRi9C70LrQsCDQvdCwINC00LXRgNC10LLQviwg0LrRg9C00LAg0LTQvtCx0LDQstC70Y/RgtGMINGB0LLQvtC50YHRgtCy0LBcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHB1c2goZSwgcmVmLCBub2RlID0gJ1VMJykge1xuXG4gICAgICAgICAgICBsZXQgaXRlbUZvcm0gPSBlLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm1bZGF0YS1rZXldJyk7XG4gICAgICAgICAgICBsZXQgcG9pbnRlciA9IHsgLy8g0JHQtdGA0ZHQvCDQsNGC0YDQuNCx0YPRgiBpZCDRjdC70LXQvNC10L3RgtCwXG4gICAgICAgICAgICAgICAgaWQ6IGl0ZW1Gb3JtLmdldEF0dHJpYnV0ZSgnZGF0YS1rZXknKSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW1Gb3JtLmdldEF0dHJpYnV0ZSgnZGF0YS10eXBlJykgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW25hbWVdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB0aXRsZTogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0aXRsZV1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHVybDogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t1cmxdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBhdXRoOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW29ubHlfYXV0aF1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHRhcmdldDogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0YXJnZXRfYmxhbmtdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChlLmNoaWxkRWxlbWVudENvdW50KSB7IC8vINCV0YHQu9C4INC10YHRgtGMINC/0L7RgtC+0LzQutC4XG4gICAgICAgICAgICAgICAgcG9pbnRlci5jaGlsZHJlbiA9IFtdOyAvLyDQodC+0LfQtNCw0ZHQvCDRgdCy0L7QudGB0YLQstC+INC00LvRjyDQvdC40YVcbiAgICAgICAgICAgICAgICBBcnJheS5mcm9tKGUuY2hpbGRyZW4pLmZvckVhY2goaSA9PiB7IC8vINCf0LXRgNC10LHQuNGA0LDQtdC8Li4uINGF0LwuLi4g0LTQtdGC0LXQuSAo0L/QviDQutC+0YHRgtC+0YfQutCw0LwhKVxuICAgICAgICAgICAgICAgICAgICBpZiAoaS5ub2RlTmFtZSA9PT0gbm9kZS50b1VwcGVyQ2FzZSgpKSB7IC8vINCV0YHQu9C4INC10YHRgtGMINC10YnRkSDQvtC00LjQvSDQutC+0L3RgtC10LnQvdC10YAgVUwsINC/0LXRgNC10LHQuNGA0LDQtdC8INC10LPQvlxuICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShpLmNoaWxkcmVuKS5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2goZSwgcG9pbnRlci5jaGlsZHJlbik7IC8vINCS0YvQt9GL0LLQsNC10LwgcHVzaCDQvdCwINC90L7QstGL0YUgbGksINC90L4g0YHRgdGL0LvQutCwINC90LAg0LTRgNC10LLQviDRgtC10L/QtdGA0YwgLSDRjdGC0L4g0LzQsNGB0YHQuNCyIGNoaWxkcmVuINGD0LrQsNC30LDRgtC10LvRj1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVmLnB1c2gocG9pbnRlcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDQn9GA0L7RhdC+0LTQuNC80YHRjyDQv9C+INCy0YHQtdC8IGxpINC/0LXRgNC10LTQsNC90L3QvtCz0L4gdWxcbiAgICAgICAgQXJyYXkuZnJvbShsaXN0LmNoaWxkcmVuKS5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgcHVzaChlLCB0cmVlLCAnVUwnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGpzb24gPyBKU09OLnN0cmluZ2lmeSh0cmVlKSA6IHRyZWU7XG4gICAgfVxuXG4gICAgY29uc3QgdG9XcmFwID0gKGVsZW0sIHdyYXBwZXIpID0+IHtcbiAgICAgICAgd3JhcHBlciA9IHdyYXBwZXIgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh3cmFwcGVyKTtcbiAgICAgICAgcmV0dXJuIHdyYXBwZXIuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBIVE1MIHJlcHJlc2VudGluZyBhIHNpbmdsZSBlbGVtZW50XG4gICAgICogQHJldHVybiB7RWxlbWVudH1cbiAgICAgKi9cbiAgICBjb25zdCBodG1sVG9FbGVtZW50ID0gKGh0bWwpID0+IHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgaHRtbCA9IGh0bWwudHJpbSgpOyAvLyBOZXZlciByZXR1cm4gYSB0ZXh0IG5vZGUgb2Ygd2hpdGVzcGFjZSBhcyB0aGUgcmVzdWx0XG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZS5jb250ZW50LmZpcnN0Q2hpbGQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IEhUTUwgcmVwcmVzZW50aW5nIGFueSBudW1iZXIgb2Ygc2libGluZyBlbGVtZW50c1xuICAgICAqIEByZXR1cm4ge05vZGVMaXN0fVxuICAgICAqL1xuICAgIGNvbnN0IGh0bWxUb0VsZW1lbnRzID0gKGh0bWwpID0+IHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuY2hpbGROb2RlcztcbiAgICB9XG5cbiAgICBjb25zdCBmaWxsVGVtcGxhdGUgPSAoc3RyLCBvYmopID0+IHtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdmFyIGJlZm9yZVJlcGxhY2UgPSBzdHI7XG4gICAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgve3tcXHMqKFtefVxcc10rKVxccyp9fS9nLCBmdW5jdGlvbih3aG9sZU1hdGNoLCBrZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3Vic3RpdHV0aW9uID0gb2JqWyQudHJpbShrZXkpXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1YnN0aXR1dGlvbiA9PT0gdW5kZWZpbmVkID8gd2hvbGVNYXRjaCA6IHN1YnN0aXR1dGlvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBhZnRlclJlcGxhY2UgPSBzdHIgIT09IGJlZm9yZVJlcGxhY2U7XG4gICAgICAgIH0gd2hpbGUgKGFmdGVyUmVwbGFjZSk7XG5cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9O1xuXG4gICAgY29uc3QgZ2V0Q29vcmRzID0gKGVsZW0pID0+IHtcbiAgICAgICAgbGV0IGJveCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IGJveC50b3AgKyBwYWdlWU9mZnNldCxcbiAgICAgICAgICAgIGxlZnQ6IGJveC5sZWZ0ICsgcGFnZVhPZmZzZXRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgYWRkTWVudUl0ZW0gPSAoaXRlbSkgPT4ge1xuICAgICAgICBpZiAobWVudUl0ZW1zTGlzdCAmJiBpdGVtVGVtcGxhdGUgJiYgJ2NvbnRlbnQnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJykpIHtcblxuICAgICAgICAgICAgaWYgKG1lbnVJdGVtc0xpc3QuY2xhc3NMaXN0LmNvbnRhaW5zKCduby1pdGVtcycpKSB7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zTGlzdC5jbGFzc0xpc3QucmVtb3ZlKCduby1pdGVtcycpO1xuICAgICAgICAgICAgICAgIG1lbnVJdGVtc0xpc3QuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGRhdGEgPSBpdGVtO1xuICAgICAgICAgICAgZGF0YS5mb3JtID0gZmlsbFRlbXBsYXRlKGZvcm1UZW1wbGF0ZS5pbm5lckhUTUwsIGRhdGEpO1xuXG4gICAgICAgICAgICBsZXQgY29udGVudCA9IGZpbGxUZW1wbGF0ZShpdGVtVGVtcGxhdGUuaW5uZXJIVE1MLCBkYXRhKTtcblxuICAgICAgICAgICAgbWVudUl0ZW1zTGlzdC5hcHBlbmQoaHRtbFRvRWxlbWVudChjb250ZW50KSk7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5vbkFkZFN1Y2Nlc3MoZHJhZ09iamVjdCwgbWVudUl0ZW1zTGlzdCk7XG5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VsZi5vbkFkZEZhaWx0dXJlKGRyYWdPYmplY3QsIG1lbnVJdGVtc0xpc3QpO1xuICAgIH07XG5cbiAgICBpZiAoYWRkTWVudUl0ZW1Gb3JtLmxlbmd0aCkge1xuICAgICAgICBsZXQgYWRkQnV0dG9uID0gYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbltkYXRhLXJlbD1cImFkZFwiXScpO1xuICAgICAgICBhZGRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgY29sbGFwc2VUb2dnbGVyID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvcignI3NvdXJjZS1saW5rIGFbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb2xsYXBzZVRvZ2dsZXIpO1xuXG4gICAgICAgICAgICBsZXQgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAnaWQnOiBudWxsLFxuICAgICAgICAgICAgICAgICdzb3VyY2UnOiBjb2xsYXBzZVRvZ2dsZXIuZGF0YXNldC50eXBlIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZV9uYW1lJzogY29sbGFwc2VUb2dnbGVyLmRhdGFzZXQubmFtZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgICduYW1lJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbbmFtZV1cIl0nKS52YWx1ZSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAndGl0bGUnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0aXRsZV1cIl0nKS52YWx1ZSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAndXJsJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbdXJsXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICdvbmx5X2F1dGgnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tvbmx5X2F1dGhdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3RhcmdldF9ibGFuayc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RhcmdldF9ibGFua11cIl0nKS52YWx1ZSB8fCBmYWxzZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChhZGRNZW51SXRlbShpdGVtKSlcbiAgICAgICAgICAgICAgICBhZGRNZW51SXRlbUZvcm0ucmVzZXQoKTtcblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgc291cmNlc0xpc3QgPSBbLi4ucGFuZWxzXS5maWx0ZXIocGFuZWwgPT4ge1xuICAgICAgICBpZiAocGFuZWwuY2hpbGRyZW4ubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIGxldCBhZGRCdXR0b24gPSBwYW5lbC5xdWVyeVNlbGVjdG9yKCdidXR0b25bZGF0YS1yZWw9XCJhZGRcIl0nKTtcbiAgICAgICAgICAgIGxldCBzZWxlY3RBbGwgPSBwYW5lbC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl1bbmFtZT1cInNlbGVjdC1hbGxcIl0nKTtcbiAgICAgICAgICAgIGxldCBpdGVtcyA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zb3VyY2UtbGlzdCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKTtcblxuXG4gICAgICAgICAgICBpZiAoYWRkQnV0dG9uICYmIGl0ZW1zKSB7XG5cbiAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhbmVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXTpjaGVja2VkOm5vdChbbmFtZT1cInNlbGVjdC1hbGxcIl0pJykubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYWRkQnV0dG9uLm9uY2xpY2sgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNvdXJjZXNJdGVtcyA9IFsuLi5pdGVtc10uZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZE1lbnVJdGVtKGl0ZW0uZGF0YXNldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxlY3RBbGwgJiYgaXRlbXMpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RBbGwub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldC5jaGVja2VkO1xuICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGNoZWNrYm94ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3gub25jaGFuZ2UoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgdmFyIGNyZWF0ZURyb3BwYWJsZSA9IChlKSA9PiB7XG4gICAgICAgIGxldCB0b3AgPSBlLmNsaWVudFkgfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICBsZXQgbGVmdCA9IGUuY2xpZW50WCB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgIGxldCBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChsZWZ0LCB0b3ApO1xuICAgICAgICBsZXQgZHJvcHBhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdkcm9wcGFibGUnKTtcblxuICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5hZGQoJ3N1Yi1pdGVtJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QucmVtb3ZlKCdzdWItaXRlbScpO1xuXG4gICAgICAgIGxldCBpdGVtVGV4dCA9IGRyYWdPYmplY3QuYXZhdGFyLnF1ZXJ5U2VsZWN0b3IoJy5wYW5lbC10aXRsZSBhW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nKS5kYXRhc2V0WyduYW1lJ107XG4gICAgICAgIGxldCBkcm9wcGFibGVUZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoaXRlbVRleHQudHJpbSgpKTtcbiAgICAgICAgZHJvcHBhYmxlLmFwcGVuZENoaWxkKGRyb3BwYWJsZVRleHQpO1xuXG4gICAgICAgIGRyb3BwYWJsZS5zdHlsZS53aWR0aCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgZHJvcHBhYmxlLnN0eWxlLmhlaWdodCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldEhlaWdodCArICdweCc7XG5cbiAgICAgICAgaWYgKCFkcm9wcGFibGUuaXNFcXVhbE5vZGUoZHJhZ09iamVjdC5kcm9wcGFibGUpKSB7XG4gICAgICAgICAgICByZW1vdmVFbGVtZW50cyhtZW51SXRlbXNMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZHJvcHBhYmxlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkcmFnT2JqZWN0LmRyb3BwYWJsZSA9IGRyb3BwYWJsZTtcblxuICAgICAgICBsZXQgdGFyZ2V0ID0gZWxlbS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG5cbiAgICAgICAgaWYgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3RhcmdldCcsIHRhcmdldCk7XG5cbiAgICAgICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtc0xpc3QucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgIGlmICh0b3AgPj0gKHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyAodGFyZ2V0Lm9mZnNldEhlaWdodC8xLjUpKSkge1xuXG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5hZnRlcihkcm9wcGFibGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpXG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnYWZ0ZXInKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCAodGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICh0YXJnZXQub2Zmc2V0SGVpZ2h0LzEuNSkpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5iZWZvcmUoZHJvcHBhYmxlKTtcblxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJykuZmlyc3RDaGlsZC5pc0VxdWFsTm9kZShkcm9wcGFibGUpKVxuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2JlZm9yZScpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLndpZHRoID0gZHJvcHBhYmxlLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyb3BwYWJsZS5vZmZzZXRIZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBjcmVhdGVBdmF0YXIgPSAoZSkgPT4ge1xuXG4gICAgICAgIC8vINC30LDQv9C+0LzQvdC40YLRjCDRgdGC0LDRgNGL0LUg0YHQstC+0LnRgdGC0LLQsCwg0YfRgtC+0LHRiyDQstC10YDQvdGD0YLRjNGB0Y8g0Log0L3QuNC8INC/0YDQuCDQvtGC0LzQtdC90LUg0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICB2YXIgYXZhdGFyID0gZHJhZ09iamVjdC5lbGVtO1xuICAgICAgICB2YXIgb2xkID0ge1xuICAgICAgICAgICAgcGFyZW50OiBhdmF0YXIucGFyZW50Tm9kZSxcbiAgICAgICAgICAgIG5leHRTaWJsaW5nOiBhdmF0YXIubmV4dFNpYmxpbmcsXG4gICAgICAgICAgICBwb3NpdGlvbjogYXZhdGFyLnBvc2l0aW9uIHx8ICcnLFxuICAgICAgICAgICAgbGVmdDogYXZhdGFyLmxlZnQgfHwgJycsXG4gICAgICAgICAgICB0b3A6IGF2YXRhci50b3AgfHwgJycsXG4gICAgICAgICAgICB6SW5kZXg6IGF2YXRhci56SW5kZXggfHwgJydcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDRhNGD0L3QutGG0LjRjyDQtNC70Y8g0L7RgtC80LXQvdGLINC/0LXRgNC10L3QvtGB0LBcbiAgICAgICAgYXZhdGFyLnJvbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgb2xkLnBhcmVudC5pbnNlcnRCZWZvcmUoYXZhdGFyLCBvbGQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnBvc2l0aW9uID0gb2xkLnBvc2l0aW9uO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLmxlZnQgPSBvbGQubGVmdDtcbiAgICAgICAgICAgIGF2YXRhci5zdHlsZS50b3AgPSBvbGQudG9wO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnpJbmRleCA9IG9sZC56SW5kZXg7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdEcmFnIGNhbmNlbCwgcm9sbGJhY2snKTtcbiAgICAgICAgICAgIC8qc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhJykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgICAgICAgICAgfSwgNTAwKTsqL1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBhdmF0YXI7XG4gICAgfVxuICAgIHZhciBzdGFydERyYWcgPSAoZSkgPT4ge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdzdGFydERyYWcnKTtcblxuICAgICAgICBsZXQgYXZhdGFyID0gZHJhZ09iamVjdC5hdmF0YXI7XG4gICAgICAgIGF2YXRhci5zdHlsZS53aWR0aCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldEhlaWdodCArICdweCc7XG5cbiAgICAgICAgLy8g0LjQvdC40YbQuNC40YDQvtCy0LDRgtGMINC90LDRh9Cw0LvQviDQv9C10YDQtdC90L7RgdCwXG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QuYWRkKCdkcmFnLWluJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcblxuICAgICAgICBsZXQgZGVsZXRlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhXCIpO1xuICAgICAgICBpZiAoZGVsZXRlQXJlYSlcbiAgICAgICAgICAgIGRlbGV0ZUFyZWEuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuXG4gICAgfVxuICAgIHZhciBmaW5pc2hEcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZmluaXNoRHJhZycpO1xuXG4gICAgICAgIGxldCBhdmF0YXIgPSBkcmFnT2JqZWN0LmF2YXRhcjtcbiAgICAgICAgbGV0IGRyb3BFbGVtID0gZmluZERyb3BwYWJsZShlKTtcblxuICAgICAgICBpZiAoIWRyb3BFbGVtKVxuICAgICAgICAgICAgYXZhdGFyLnJvbGxiYWNrKCk7XG5cbiAgICAgICAgYXZhdGFyLnN0eWxlID0gJyc7XG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnLWluJyk7XG5cbiAgICAgICAgbGV0IGRyb3BwYWJsZSA9IGRyYWdNZW51LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlXCIpO1xuICAgICAgICBpZiAoZHJvcHBhYmxlLmNsYXNzTGlzdC5jb250YWlucygnZGVsZXRlLWFyZWEnKSkge1xuICAgICAgICAgICAgZHJhZ09iamVjdCA9IHt9O1xuICAgICAgICAgICAgYXZhdGFyLnJlbW92ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGRyb3BwYWJsZS5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpIHtcblxuICAgICAgICAgICAgbGV0IGxpc3QgPSBkcm9wcGFibGUucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKFwidWxcIik7XG4gICAgICAgICAgICBpZiAoIWxpc3QpIHtcbiAgICAgICAgICAgICAgICBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgICAgICAgICBsaXN0LmNsYXNzTGlzdC5hZGQoJ21lbnUtaXRlbXMnKTtcbiAgICAgICAgICAgICAgICBsaXN0LnNldEF0dHJpYnV0ZSgncm9sZScsIFwidGFibGlzdFwiKTtcbiAgICAgICAgICAgICAgICBkcm9wcGFibGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChsaXN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5hZGQoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICBkcm9wcGFibGUucmVwbGFjZVdpdGgoYXZhdGFyKTtcbiAgICAgICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF2YXRhci5jbGFzc0xpc3QucmVtb3ZlKCdzdWItaXRlbScpO1xuICAgICAgICAgICAgZHJvcHBhYmxlLnJlcGxhY2VXaXRoKGF2YXRhcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZWxlY3RzIGFsbCA8dWw+IGVsZW1lbnRzLCB0aGVuIGZpbHRlcnMgdGhlIGNvbGxlY3Rpb25cbiAgICAgICAgbGV0IGxpc3RzID0gbWVudUl0ZW1zTGlzdC5xdWVyeVNlbGVjdG9yQWxsKCd1bCcpO1xuICAgICAgICAvLyBrZWVwIG9ubHkgdGhvc2UgZWxlbWVudHMgd2l0aCBubyBjaGlsZC1lbGVtZW50c1xuICAgICAgICBsZXQgZW1wdHlMaXN0ID0gWy4uLmxpc3RzXS5maWx0ZXIoZWxlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbS5jaGlsZHJlbi5sZW5ndGggPT09IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGVtcHR5IG9mIGVtcHR5TGlzdClcbiAgICAgICAgICAgIGVtcHR5LnJlbW92ZSgpO1xuXG4gICAgICAgIC8vZHJhZ09iamVjdC5kYXRhID0gdHJhbnNmb3JtRGF0YShtZW51SXRlbXNMaXN0LnF1ZXJ5U2VsZWN0b3IoXCIubWVudS1pdGVtc1wiKSk7XG4gICAgICAgIGRyYWdPYmplY3QuZGF0YSA9IHRyYW5zZm9ybURhdGEobWVudUl0ZW1zTGlzdCk7XG4gICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtc0xpc3QucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgIGxldCBkZWxldGVBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGUuZGVsZXRlLWFyZWFcIik7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZGVsZXRlQXJlYSlcbiAgICAgICAgICAgICAgICBkZWxldGVBcmVhLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgICAgICAgfSwgNTAwKTtcblxuICAgICAgICBpZiAoIWRyb3BFbGVtKVxuICAgICAgICAgICAgc2VsZi5vbkRyYWdDYW5jZWwoZHJhZ09iamVjdCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNlbGYub25EcmFnRW5kKGRyYWdPYmplY3QsIGRyb3BFbGVtKTtcbiAgICB9XG4gICAgdmFyIGZpbmREcm9wcGFibGUgPSAoZSkgPT4ge1xuICAgICAgICAvLyDRgdC/0YDRj9GH0LXQvCDQv9C10YDQtdC90L7RgdC40LzRi9C5INGN0LvQtdC80LXQvdGCXG4gICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLmhpZGRlbiA9IHRydWU7XG5cbiAgICAgICAgbGV0IHRvcCA9IGUuY2xpZW50WSB8fCBlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICBsZXQgbGVmdCA9IGUuY2xpZW50WCB8fCBlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VYO1xuXG4gICAgICAgIC8vINC/0L7Qu9GD0YfQuNGC0Ywg0YHQsNC80YvQuSDQstC70L7QttC10L3QvdGL0Lkg0Y3Qu9C10LzQtdC90YIg0L/QvtC0INC60YPRgNGB0L7RgNC+0Lwg0LzRi9GI0LhcbiAgICAgICAgbGV0IGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGxlZnQsIHRvcCk7XG5cbiAgICAgICAgLy8g0L/QvtC60LDQt9Cw0YLRjCDQv9C10YDQtdC90L7RgdC40LzRi9C5INGN0LvQtdC80LXQvdGCINC+0LHRgNCw0YLQvdC+XG4gICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLmhpZGRlbiA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChlbGVtID09IG51bGwpIC8vINGC0LDQutC+0LUg0LLQvtC30LzQvtC20L3Qviwg0LXRgdC70Lgg0LrRg9GA0YHQvtGAINC80YvRiNC4IFwi0LLRi9C70LXRgtC10LtcIiDQt9CwINCz0YDQsNC90LjRhtGDINC+0LrQvdCwXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICByZXR1cm4gZWxlbS5jbG9zZXN0KCcuZHJvcHBhYmxlJyk7XG4gICAgfVxuXG5cbiAgICB2YXIgb25Nb3VzZURvd24gPSAoZSkgPT4ge1xuXG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwibW91c2Vkb3duXCIgJiYgZS53aGljaCAhPSAxKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBlbGVtID0gZS50YXJnZXQuY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuICAgICAgICBpZiAoIWVsZW0pIHJldHVybjtcblxuICAgICAgICBkcmFnT2JqZWN0LmVsZW0gPSBlbGVtO1xuXG4gICAgICAgIC8vINC30LDQv9C+0LzQvdC40LwsINGH0YLQviDRjdC70LXQvNC10L3RgiDQvdCw0LbQsNGCINC90LAg0YLQtdC60YPRidC40YUg0LrQvtC+0YDQtNC40L3QsNGC0LDRhSBwYWdlWC9wYWdlWVxuICAgICAgICBkcmFnT2JqZWN0LmRvd25YID0gZS5wYWdlWCB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgIGRyYWdPYmplY3QuZG93blkgPSBlLnBhZ2VZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBvbk1vdXNlTW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGlmICghZHJhZ09iamVjdC5lbGVtKSByZXR1cm47IC8vINGN0LvQtdC80LXQvdGCINC90LUg0LfQsNC20LDRglxuXG4gICAgICAgIGlmICghZHJhZ09iamVjdC5hdmF0YXIpIHsgLy8g0LXRgdC70Lgg0L/QtdGA0LXQvdC+0YEg0L3QtSDQvdCw0YfQsNGCLi4uXG5cbiAgICAgICAgICAgIGxldCBtb3ZlWCA9IDA7XG4gICAgICAgICAgICBsZXQgbW92ZVkgPSAwO1xuICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgICAgICAgICAgIG1vdmVYID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYIC0gZHJhZ09iamVjdC5kb3duWDtcbiAgICAgICAgICAgICAgICBtb3ZlWSA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3QuZG93blk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVYID0gZS5wYWdlWCAtIGRyYWdPYmplY3QuZG93blg7XG4gICAgICAgICAgICAgICAgbW92ZVkgPSBlLnBhZ2VZIC0gZHJhZ09iamVjdC5kb3duWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g0LXRgdC70Lgg0LzRi9GI0Ywg0L/QtdGA0LXQtNCy0LjQvdGD0LvQsNGB0Ywg0LIg0L3QsNC20LDRgtC+0Lwg0YHQvtGB0YLQvtGP0L3QuNC4INC90LXQtNC+0YHRgtCw0YLQvtGH0L3QviDQtNCw0LvQtdC60L5cbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhtb3ZlWCkgPCA1ICYmIE1hdGguYWJzKG1vdmVZKSA8IDUpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INC/0LXRgNC10L3QvtGBXG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhciA9IGNyZWF0ZUF2YXRhcihlKTsgLy8g0YHQvtC30LTQsNGC0Ywg0LDQstCw0YLQsNGAXG4gICAgICAgICAgICBpZiAoIWRyYWdPYmplY3QuYXZhdGFyKSB7IC8vINC+0YLQvNC10L3QsCDQv9C10YDQtdC90L7RgdCwLCDQvdC10LvRjNC30Y8gXCLQt9Cw0YXQstCw0YLQuNGC0YxcIiDQt9CwINGN0YLRgyDRh9Cw0YHRgtGMINGN0LvQtdC80LXQvdGC0LBcbiAgICAgICAgICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDQsNCy0LDRgtCw0YAg0YHQvtC30LTQsNC9INGD0YHQv9C10YjQvdC+XG4gICAgICAgICAgICAvLyDRgdC+0LfQtNCw0YLRjCDQstGB0L/QvtC80L7Qs9Cw0YLQtdC70YzQvdGL0LUg0YHQstC+0LnRgdGC0LLQsCBzaGlmdFgvc2hpZnRZXG4gICAgICAgICAgICBsZXQgY29vcmRzID0gZ2V0Q29vcmRzKGRyYWdPYmplY3QuYXZhdGFyKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3Quc2hpZnRYID0gZHJhZ09iamVjdC5kb3duWCAtIGNvb3Jkcy5sZWZ0O1xuICAgICAgICAgICAgZHJhZ09iamVjdC5zaGlmdFkgPSBkcmFnT2JqZWN0LmRvd25ZIC0gY29vcmRzLnRvcDtcblxuICAgICAgICAgICAgc3RhcnREcmFnKGUpOyAvLyDQvtGC0L7QsdGA0LDQt9C40YLRjCDQvdCw0YfQsNC70L4g0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICB9XG5cbiAgICAgICAgLy8g0L7RgtC+0LHRgNCw0LfQuNGC0Ywg0L/QtdGA0LXQvdC+0YEg0L7QsdGK0LXQutGC0LAg0L/RgNC4INC60LDQttC00L7QvCDQtNCy0LjQttC10L3QuNC4INC80YvRiNC4XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmxlZnQgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCAtIGRyYWdPYmplY3Quc2hpZnRYKSArICdweCc7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS50b3AgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3Quc2hpZnRZKSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS5sZWZ0ID0gKGUucGFnZVggLSBkcmFnT2JqZWN0LnNoaWZ0WCkgKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUudG9wID0gKGUucGFnZVkgLSBkcmFnT2JqZWN0LnNoaWZ0WSkgKyAncHgnO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlRHJvcHBhYmxlKGUpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBvbk1vdXNlVXAgPSAoZSkgPT4ge1xuICAgICAgICBpZiAoZHJhZ09iamVjdC5hdmF0YXIpIC8vINC10YHQu9C4INC/0LXRgNC10L3QvtGBINC40LTQtdGCXG4gICAgICAgICAgICBmaW5pc2hEcmFnKGUpO1xuXG4gICAgICAgIC8vINC/0LXRgNC10L3QvtGBINC70LjQsdC+INC90LUg0L3QsNGH0LjQvdCw0LvRgdGPLCDQu9C40LHQviDQt9Cw0LLQtdGA0YjQuNC70YHRj1xuICAgICAgICAvLyDQsiDQu9GO0LHQvtC8INGB0LvRg9GH0LDQtSDQvtGH0LjRgdGC0LjQvCBcItGB0L7RgdGC0L7Rj9C90LjQtSDQv9C10YDQtdC90L7RgdCwXCIgZHJhZ09iamVjdFxuICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgfVxuXG5cbiAgICBkcmFnTWVudS5vbm1vdXNlZG93biA9IG9uTW91c2VEb3duO1xuICAgIGRyYWdNZW51Lm9udG91Y2hzdGFydCA9IG9uTW91c2VEb3duO1xuICAgIGRyYWdNZW51Lm9ubW91c2Vtb3ZlID0gb25Nb3VzZU1vdmU7XG4gICAgZHJhZ01lbnUub250b3VjaG1vdmUgPSBvbk1vdXNlTW92ZTtcbiAgICBkcmFnTWVudS5vbm1vdXNldXAgPSBvbk1vdXNlVXA7XG4gICAgZHJhZ01lbnUub250b3VjaGVuZCA9IG9uTW91c2VVcDtcblxuICAgIHRoaXMuZ2V0SXRlbXNEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1EYXRhKG1lbnVJdGVtc0xpc3QpO1xuICAgIH07XG5cbiAgICB0aGlzLm9uRHJhZ0VuZCA9IGZ1bmN0aW9uKGRyYWdPYmplY3QsIGRyb3BFbGVtKSB7fTtcbiAgICB0aGlzLm9uRHJhZ0NhbmNlbCA9IGZ1bmN0aW9uKGRyYWdPYmplY3QpIHt9O1xuXG4gICAgdGhpcy5vbkFkZFN1Y2Nlc3MgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBtZW51SXRlbXNMaXN0KSB7fTtcbiAgICB0aGlzLm9uQWRkRmFpbHR1cmUgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBtZW51SXRlbXNMaXN0KSB7fTtcblxufVxuXG5EcmFnTWVudS5vbkRyYWdDYW5jZWwgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCkge1xuICAgIGlmIChkcmFnT2JqZWN0LmRhdGEpIHtcbiAgICAgICAgbGV0IGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkTWVudUZvcm0nKTtcbiAgICAgICAgZm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dCNtZW51LWl0ZW1zJykudmFsdWUgPSBkcmFnT2JqZWN0LmRhdGE7XG4gICAgfVxufTtcblxuRHJhZ01lbnUub25EcmFnRW5kID0gZnVuY3Rpb24gKGRyYWdPYmplY3QsIGRyb3BFbGVtKSB7XG4gICAgaWYgKGRyYWdPYmplY3QuZGF0YSkge1xuICAgICAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgICAgICBmb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0I21lbnUtaXRlbXMnKS52YWx1ZSA9IGRyYWdPYmplY3QuZGF0YTtcbiAgICB9XG59O1xuXG5EcmFnTWVudS5vbkFkZFN1Y2Nlc3MgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCwgbWVudUl0ZW1zTGlzdCkge1xuICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgZm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dCNtZW51LWl0ZW1zJykudmFsdWUgPSB0aGlzLmdldEl0ZW1zRGF0YSgpO1xufTsiXX0=
