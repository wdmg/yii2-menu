var DragMenu = new function() {

    var self = this;
    var dragObject = {};
    var menuItemsList = document.getElementById('menuItems');
    var menuSources = document.getElementById('menuSources');
    var addMenuItemForm = document.getElementById('addMenuItemForm');
    var panels = menuSources.querySelectorAll(".panel .panel-body");
    var menuItemsList = document.getElementById('menuItems');
    var formTemplate = document.getElementById('itemFormTemplate');
    var itemTemplate = document.getElementById('menuItemTemplate');

    const removeElements = (elms) => elms.forEach(elem => elem.remove());

    const transformData = (ul, json = true) => {
        let tree = [];

        /**
         * Наполнение дерева значениями
         *
         * @param {HTMLLIElement} e   LI-элемент с data-id
         * @param {Array}         ref Ссылка на дерево, куда добавлять свойства
         */
        function push(e, ref) {

            let pointer = { // Берём атрибут id элемента
                itemId: e.id
            };

            if (e.childElementCount) { // Если есть потомки
                pointer.children = []; // Создаём свойство для них
                Array.from(e.children).forEach(i => { // Перебираем... хм... детей (по косточкам!)
                    if (i.nodeName === 'UL') { // Если есть ещё один контейнер UL, перебираем его
                        Array.from(i.children).forEach(e => {
                            push(e, pointer.children); // Вызываем push на новых li, но ссылка на древо теперь - это массив children указателя
                        });
                    }
                });
            }

            ref.push(pointer);
        }

        // Проходимся по всем li переданного ul
        Array.from(ul.children).forEach(e => {
            push(e, tree);
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

        console.log(item);

        if (menuItemsList && itemTemplate && 'content' in document.createElement('template')) {

            if (menuItemsList.classList.contains('no-items')) {
                menuItemsList.classList.remove('no-items');
                menuItemsList.innerHTML = "";
            }

            //let data = item.dataset;
            let data = item;
            data.form = fillTemplate(formTemplate.innerHTML, data);

            let content = fillTemplate(itemTemplate.innerHTML, data);
            menuItemsList.append(htmlToElement(content));
        }
    };


    if (addMenuItemForm.length) {
        let addButton = addMenuItemForm.querySelector('button[data-rel="add"]');
        addButton.addEventListener("click", (event) => {
            let item = {
                'id': "1",
                'source': "links",
                'source_name': "Links",
                'name': addMenuItemForm.querySelector('input[name="MenuItems[name]"]').value,
                'title': addMenuItemForm.querySelector('input[name="MenuItems[title]"]').value,
                'url': addMenuItemForm.querySelector('input[name="MenuItems[url]"]').value,
                'only_auth': addMenuItemForm.querySelector('input[name="MenuItems[only_auth]"]').value,
                'target_blank': addMenuItemForm.querySelector('input[name="MenuItems[target_blank]"]').value,
            };
            addMenuItem(item);
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
            deleteArea.hidden = false;

    }
    var finishDrag = (e) => {
        //console.log('finishDrag');

        let avatar = dragObject.avatar;
        let dropElem = findDroppable(e);

        if (!dropElem)
            avatar.rollback();

        avatar.style = '';
        avatar.classList.remove('drag-in');

        let droppable = menuItemsList.querySelector(".droppable");
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

        dragObject.data = transformData(menuItemsList.querySelector(".menu-items"));
        removeElements(menuItemsList.querySelectorAll(".droppable:not(.delete-area)"));

        let deleteArea = document.querySelector(".droppable.delete-area");
        if (deleteArea)
            deleteArea.hidden = true;

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


    menuItemsList.onmousedown = onMouseDown;
    menuItemsList.ontouchstart = onMouseDown;
    menuItemsList.onmousemove = onMouseMove;
    menuItemsList.ontouchmove = onMouseMove;
    menuItemsList.onmouseup = onMouseUp;
    menuItemsList.ontouchend = onMouseUp;

    this.onDragEnd = function(dragObject, dropElem) {};
    this.onDragCancel = function(dragObject) {};

}

DragMenu.onDragCancel = function (dragObject) {
    if (dragObject.data) {
        document.getElementById('menuOptions').innerText = dragObject.data;
    }
};

DragMenu.onDragEnd = function (dragObject, dropElem) {
    if (dragObject.data) {
        document.getElementById('menuOptions').innerText = dragObject.data;
    }
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtZW51LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIERyYWdNZW51ID0gbmV3IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkcmFnT2JqZWN0ID0ge307XG4gICAgdmFyIG1lbnVJdGVtc0xpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJyk7XG4gICAgdmFyIG1lbnVTb3VyY2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVTb3VyY2VzJyk7XG4gICAgdmFyIGFkZE1lbnVJdGVtRm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51SXRlbUZvcm0nKTtcbiAgICB2YXIgcGFuZWxzID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvckFsbChcIi5wYW5lbCAucGFuZWwtYm9keVwiKTtcbiAgICB2YXIgbWVudUl0ZW1zTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51SXRlbXMnKTtcbiAgICB2YXIgZm9ybVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2l0ZW1Gb3JtVGVtcGxhdGUnKTtcbiAgICB2YXIgaXRlbVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtVGVtcGxhdGUnKTtcblxuICAgIGNvbnN0IHJlbW92ZUVsZW1lbnRzID0gKGVsbXMpID0+IGVsbXMuZm9yRWFjaChlbGVtID0+IGVsZW0ucmVtb3ZlKCkpO1xuXG4gICAgY29uc3QgdHJhbnNmb3JtRGF0YSA9ICh1bCwganNvbiA9IHRydWUpID0+IHtcbiAgICAgICAgbGV0IHRyZWUgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog0J3QsNC/0L7Qu9C90LXQvdC40LUg0LTQtdGA0LXQstCwINC30L3QsNGH0LXQvdC40Y/QvNC4XG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTExJRWxlbWVudH0gZSAgIExJLdGN0LvQtdC80LXQvdGCINGBIGRhdGEtaWRcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gICAgICAgICByZWYg0KHRgdGL0LvQutCwINC90LAg0LTQtdGA0LXQstC+LCDQutGD0LTQsCDQtNC+0LHQsNCy0LvRj9GC0Ywg0YHQstC+0LnRgdGC0LLQsFxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gcHVzaChlLCByZWYpIHtcblxuICAgICAgICAgICAgbGV0IHBvaW50ZXIgPSB7IC8vINCR0LXRgNGR0Lwg0LDRgtGA0LjQsdGD0YIgaWQg0Y3Qu9C10LzQtdC90YLQsFxuICAgICAgICAgICAgICAgIGl0ZW1JZDogZS5pZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGUuY2hpbGRFbGVtZW50Q291bnQpIHsgLy8g0JXRgdC70Lgg0LXRgdGC0Ywg0L/QvtGC0L7QvNC60LhcbiAgICAgICAgICAgICAgICBwb2ludGVyLmNoaWxkcmVuID0gW107IC8vINCh0L7Qt9C00LDRkdC8INGB0LLQvtC50YHRgtCy0L4g0LTQu9GPINC90LjRhVxuICAgICAgICAgICAgICAgIEFycmF5LmZyb20oZS5jaGlsZHJlbikuZm9yRWFjaChpID0+IHsgLy8g0J/QtdGA0LXQsdC40YDQsNC10LwuLi4g0YXQvC4uLiDQtNC10YLQtdC5ICjQv9C+INC60L7RgdGC0L7Rh9C60LDQvCEpXG4gICAgICAgICAgICAgICAgICAgIGlmIChpLm5vZGVOYW1lID09PSAnVUwnKSB7IC8vINCV0YHQu9C4INC10YHRgtGMINC10YnRkSDQvtC00LjQvSDQutC+0L3RgtC10LnQvdC10YAgVUwsINC/0LXRgNC10LHQuNGA0LDQtdC8INC10LPQvlxuICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShpLmNoaWxkcmVuKS5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2goZSwgcG9pbnRlci5jaGlsZHJlbik7IC8vINCS0YvQt9GL0LLQsNC10LwgcHVzaCDQvdCwINC90L7QstGL0YUgbGksINC90L4g0YHRgdGL0LvQutCwINC90LAg0LTRgNC10LLQviDRgtC10L/QtdGA0YwgLSDRjdGC0L4g0LzQsNGB0YHQuNCyIGNoaWxkcmVuINGD0LrQsNC30LDRgtC10LvRj1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVmLnB1c2gocG9pbnRlcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDQn9GA0L7RhdC+0LTQuNC80YHRjyDQv9C+INCy0YHQtdC8IGxpINC/0LXRgNC10LTQsNC90L3QvtCz0L4gdWxcbiAgICAgICAgQXJyYXkuZnJvbSh1bC5jaGlsZHJlbikuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgIHB1c2goZSwgdHJlZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBqc29uID8gSlNPTi5zdHJpbmdpZnkodHJlZSkgOiB0cmVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRvV3JhcCA9IChlbGVtLCB3cmFwcGVyKSA9PiB7XG4gICAgICAgIHdyYXBwZXIgPSB3cmFwcGVyIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlbGVtLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQod3JhcHBlcik7XG4gICAgICAgIHJldHVybiB3cmFwcGVyLmFwcGVuZENoaWxkKGVsZW0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gSFRNTCByZXByZXNlbnRpbmcgYSBzaW5nbGUgZWxlbWVudFxuICAgICAqIEByZXR1cm4ge0VsZW1lbnR9XG4gICAgICovXG4gICAgY29uc3QgaHRtbFRvRWxlbWVudCA9IChodG1sKSA9PiB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGh0bWwgPSBodG1sLnRyaW0oKTsgLy8gTmV2ZXIgcmV0dXJuIGEgdGV4dCBub2RlIG9mIHdoaXRlc3BhY2UgYXMgdGhlIHJlc3VsdFxuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUuY29udGVudC5maXJzdENoaWxkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBIVE1MIHJlcHJlc2VudGluZyBhbnkgbnVtYmVyIG9mIHNpYmxpbmcgZWxlbWVudHNcbiAgICAgKiBAcmV0dXJuIHtOb2RlTGlzdH1cbiAgICAgKi9cbiAgICBjb25zdCBodG1sVG9FbGVtZW50cyA9IChodG1sKSA9PiB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZS5jb250ZW50LmNoaWxkTm9kZXM7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsbFRlbXBsYXRlID0gKHN0ciwgb2JqKSA9PiB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciBiZWZvcmVSZXBsYWNlID0gc3RyO1xuICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL3t7XFxzKihbXn1cXHNdKylcXHMqfX0vZywgZnVuY3Rpb24od2hvbGVNYXRjaCwga2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YnN0aXR1dGlvbiA9IG9ialskLnRyaW0oa2V5KV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWJzdGl0dXRpb24gPT09IHVuZGVmaW5lZCA/IHdob2xlTWF0Y2ggOiBzdWJzdGl0dXRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgYWZ0ZXJSZXBsYWNlID0gc3RyICE9PSBiZWZvcmVSZXBsYWNlO1xuICAgICAgICB9IHdoaWxlIChhZnRlclJlcGxhY2UpO1xuXG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfTtcblxuICAgIGNvbnN0IGdldENvb3JkcyA9IChlbGVtKSA9PiB7XG4gICAgICAgIGxldCBib3ggPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9wOiBib3gudG9wICsgcGFnZVlPZmZzZXQsXG4gICAgICAgICAgICBsZWZ0OiBib3gubGVmdCArIHBhZ2VYT2Zmc2V0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGFkZE1lbnVJdGVtID0gKGl0ZW0pID0+IHtcblxuICAgICAgICBjb25zb2xlLmxvZyhpdGVtKTtcblxuICAgICAgICBpZiAobWVudUl0ZW1zTGlzdCAmJiBpdGVtVGVtcGxhdGUgJiYgJ2NvbnRlbnQnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJykpIHtcblxuICAgICAgICAgICAgaWYgKG1lbnVJdGVtc0xpc3QuY2xhc3NMaXN0LmNvbnRhaW5zKCduby1pdGVtcycpKSB7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zTGlzdC5jbGFzc0xpc3QucmVtb3ZlKCduby1pdGVtcycpO1xuICAgICAgICAgICAgICAgIG1lbnVJdGVtc0xpc3QuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9sZXQgZGF0YSA9IGl0ZW0uZGF0YXNldDtcbiAgICAgICAgICAgIGxldCBkYXRhID0gaXRlbTtcbiAgICAgICAgICAgIGRhdGEuZm9ybSA9IGZpbGxUZW1wbGF0ZShmb3JtVGVtcGxhdGUuaW5uZXJIVE1MLCBkYXRhKTtcblxuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBmaWxsVGVtcGxhdGUoaXRlbVRlbXBsYXRlLmlubmVySFRNTCwgZGF0YSk7XG4gICAgICAgICAgICBtZW51SXRlbXNMaXN0LmFwcGVuZChodG1sVG9FbGVtZW50KGNvbnRlbnQpKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGlmIChhZGRNZW51SXRlbUZvcm0ubGVuZ3RoKSB7XG4gICAgICAgIGxldCBhZGRCdXR0b24gPSBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignYnV0dG9uW2RhdGEtcmVsPVwiYWRkXCJdJyk7XG4gICAgICAgIGFkZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBsZXQgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAnaWQnOiBcIjFcIixcbiAgICAgICAgICAgICAgICAnc291cmNlJzogXCJsaW5rc1wiLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfbmFtZSc6IFwiTGlua3NcIixcbiAgICAgICAgICAgICAgICAnbmFtZSc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW25hbWVdXCJdJykudmFsdWUsXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbdGl0bGVdXCJdJykudmFsdWUsXG4gICAgICAgICAgICAgICAgJ3VybCc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3VybF1cIl0nKS52YWx1ZSxcbiAgICAgICAgICAgICAgICAnb25seV9hdXRoJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbb25seV9hdXRoXVwiXScpLnZhbHVlLFxuICAgICAgICAgICAgICAgICd0YXJnZXRfYmxhbmsnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0YXJnZXRfYmxhbmtdXCJdJykudmFsdWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYWRkTWVudUl0ZW0oaXRlbSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBzb3VyY2VzTGlzdCA9IFsuLi5wYW5lbHNdLmZpbHRlcihwYW5lbCA9PiB7XG4gICAgICAgIGlmIChwYW5lbC5jaGlsZHJlbi5sZW5ndGgpIHtcblxuICAgICAgICAgICAgbGV0IGFkZEJ1dHRvbiA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbltkYXRhLXJlbD1cImFkZFwiXScpO1xuICAgICAgICAgICAgbGV0IHNlbGVjdEFsbCA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXVtuYW1lPVwic2VsZWN0LWFsbFwiXScpO1xuICAgICAgICAgICAgbGV0IGl0ZW1zID0gcGFuZWwucXVlcnlTZWxlY3RvckFsbCgnLnNvdXJjZS1saXN0IGlucHV0W3R5cGU9XCJjaGVja2JveFwiXScpO1xuXG5cbiAgICAgICAgICAgIGlmIChhZGRCdXR0b24gJiYgaXRlbXMpIHtcblxuICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFuZWwucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOmNoZWNrZWQ6bm90KFtuYW1lPVwic2VsZWN0LWFsbFwiXSknKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBhZGRCdXR0b24ub25jbGljayA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc291cmNlc0l0ZW1zID0gWy4uLml0ZW1zXS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkTWVudUl0ZW0oaXRlbS5kYXRhc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChjaGVja2JveCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGVjdEFsbCAmJiBpdGVtcykge1xuICAgICAgICAgICAgICAgIHNlbGVjdEFsbC5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5vbmNoYW5nZShldmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgXG4gICAgdmFyIGNyZWF0ZURyb3BwYWJsZSA9IChlKSA9PiB7XG4gICAgICAgIGxldCB0b3AgPSBlLmNsaWVudFkgfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICBsZXQgbGVmdCA9IGUuY2xpZW50WCB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgIGxldCBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChsZWZ0LCB0b3ApO1xuICAgICAgICBsZXQgZHJvcHBhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdkcm9wcGFibGUnKTtcblxuICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5hZGQoJ3N1Yi1pdGVtJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QucmVtb3ZlKCdzdWItaXRlbScpO1xuXG4gICAgICAgIGxldCBpdGVtVGV4dCA9IGRyYWdPYmplY3QuYXZhdGFyLnF1ZXJ5U2VsZWN0b3IoJy5wYW5lbC10aXRsZSBhW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nKS5kYXRhc2V0WyduYW1lJ107XG4gICAgICAgIGxldCBkcm9wcGFibGVUZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoaXRlbVRleHQudHJpbSgpKTtcbiAgICAgICAgZHJvcHBhYmxlLmFwcGVuZENoaWxkKGRyb3BwYWJsZVRleHQpO1xuXG4gICAgICAgIGRyb3BwYWJsZS5zdHlsZS53aWR0aCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgZHJvcHBhYmxlLnN0eWxlLmhlaWdodCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldEhlaWdodCArICdweCc7XG5cbiAgICAgICAgaWYgKCFkcm9wcGFibGUuaXNFcXVhbE5vZGUoZHJhZ09iamVjdC5kcm9wcGFibGUpKSB7XG4gICAgICAgICAgICByZW1vdmVFbGVtZW50cyhtZW51SXRlbXNMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZHJvcHBhYmxlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkcmFnT2JqZWN0LmRyb3BwYWJsZSA9IGRyb3BwYWJsZTtcblxuICAgICAgICBsZXQgdGFyZ2V0ID0gZWxlbS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG5cbiAgICAgICAgaWYgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3RhcmdldCcsIHRhcmdldCk7XG5cbiAgICAgICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtc0xpc3QucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgIGlmICh0b3AgPj0gKHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyAodGFyZ2V0Lm9mZnNldEhlaWdodC8xLjUpKSkge1xuXG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5hZnRlcihkcm9wcGFibGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpXG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnYWZ0ZXInKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCAodGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICh0YXJnZXQub2Zmc2V0SGVpZ2h0LzEuNSkpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5iZWZvcmUoZHJvcHBhYmxlKTtcblxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJykuZmlyc3RDaGlsZC5pc0VxdWFsTm9kZShkcm9wcGFibGUpKVxuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2JlZm9yZScpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLndpZHRoID0gZHJvcHBhYmxlLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyb3BwYWJsZS5vZmZzZXRIZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBjcmVhdGVBdmF0YXIgPSAoZSkgPT4ge1xuXG4gICAgICAgIC8vINC30LDQv9C+0LzQvdC40YLRjCDRgdGC0LDRgNGL0LUg0YHQstC+0LnRgdGC0LLQsCwg0YfRgtC+0LHRiyDQstC10YDQvdGD0YLRjNGB0Y8g0Log0L3QuNC8INC/0YDQuCDQvtGC0LzQtdC90LUg0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICB2YXIgYXZhdGFyID0gZHJhZ09iamVjdC5lbGVtO1xuICAgICAgICB2YXIgb2xkID0ge1xuICAgICAgICAgICAgcGFyZW50OiBhdmF0YXIucGFyZW50Tm9kZSxcbiAgICAgICAgICAgIG5leHRTaWJsaW5nOiBhdmF0YXIubmV4dFNpYmxpbmcsXG4gICAgICAgICAgICBwb3NpdGlvbjogYXZhdGFyLnBvc2l0aW9uIHx8ICcnLFxuICAgICAgICAgICAgbGVmdDogYXZhdGFyLmxlZnQgfHwgJycsXG4gICAgICAgICAgICB0b3A6IGF2YXRhci50b3AgfHwgJycsXG4gICAgICAgICAgICB6SW5kZXg6IGF2YXRhci56SW5kZXggfHwgJydcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDRhNGD0L3QutGG0LjRjyDQtNC70Y8g0L7RgtC80LXQvdGLINC/0LXRgNC10L3QvtGB0LBcbiAgICAgICAgYXZhdGFyLnJvbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgb2xkLnBhcmVudC5pbnNlcnRCZWZvcmUoYXZhdGFyLCBvbGQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnBvc2l0aW9uID0gb2xkLnBvc2l0aW9uO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLmxlZnQgPSBvbGQubGVmdDtcbiAgICAgICAgICAgIGF2YXRhci5zdHlsZS50b3AgPSBvbGQudG9wO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnpJbmRleCA9IG9sZC56SW5kZXg7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdEcmFnIGNhbmNlbCwgcm9sbGJhY2snKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYXZhdGFyO1xuICAgIH1cbiAgICB2YXIgc3RhcnREcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc3RhcnREcmFnJyk7XG5cbiAgICAgICAgbGV0IGF2YXRhciA9IGRyYWdPYmplY3QuYXZhdGFyO1xuICAgICAgICBhdmF0YXIuc3R5bGUud2lkdGggPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCArICdweCc7XG4gICAgICAgIGF2YXRhci5zdHlsZS5oZWlnaHQgPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRIZWlnaHQgKyAncHgnO1xuXG4gICAgICAgIC8vINC40L3QuNGG0LjQuNGA0L7QstCw0YLRjCDQvdCw0YfQsNC70L4g0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICBhdmF0YXIuY2xhc3NMaXN0LmFkZCgnZHJhZy1pbicpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGF2YXRhcik7XG5cbiAgICAgICAgbGV0IGRlbGV0ZUFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmRyb3BwYWJsZS5kZWxldGUtYXJlYVwiKTtcbiAgICAgICAgaWYgKGRlbGV0ZUFyZWEpXG4gICAgICAgICAgICBkZWxldGVBcmVhLmhpZGRlbiA9IGZhbHNlO1xuXG4gICAgfVxuICAgIHZhciBmaW5pc2hEcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZmluaXNoRHJhZycpO1xuXG4gICAgICAgIGxldCBhdmF0YXIgPSBkcmFnT2JqZWN0LmF2YXRhcjtcbiAgICAgICAgbGV0IGRyb3BFbGVtID0gZmluZERyb3BwYWJsZShlKTtcblxuICAgICAgICBpZiAoIWRyb3BFbGVtKVxuICAgICAgICAgICAgYXZhdGFyLnJvbGxiYWNrKCk7XG5cbiAgICAgICAgYXZhdGFyLnN0eWxlID0gJyc7XG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnLWluJyk7XG5cbiAgICAgICAgbGV0IGRyb3BwYWJsZSA9IG1lbnVJdGVtc0xpc3QucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGVcIik7XG4gICAgICAgIGlmIChkcm9wcGFibGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdkZWxldGUtYXJlYScpKSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgICAgICAgICBhdmF0YXIucmVtb3ZlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZHJvcHBhYmxlLmNsYXNzTGlzdC5jb250YWlucygnc3ViLWl0ZW0nKSkge1xuXG4gICAgICAgICAgICBsZXQgbGlzdCA9IGRyb3BwYWJsZS5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoXCJ1bFwiKTtcbiAgICAgICAgICAgIGlmICghbGlzdCkge1xuICAgICAgICAgICAgICAgIGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICAgICAgICAgIGxpc3QuY2xhc3NMaXN0LmFkZCgnbWVudS1pdGVtcycpO1xuICAgICAgICAgICAgICAgIGxpc3Quc2V0QXR0cmlidXRlKCdyb2xlJywgXCJ0YWJsaXN0XCIpO1xuICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGxpc3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdmF0YXIuY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcbiAgICAgICAgICAgIGRyb3BwYWJsZS5yZXBsYWNlV2l0aChhdmF0YXIpO1xuICAgICAgICAgICAgbGlzdC5hcHBlbmRDaGlsZChhdmF0YXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5yZW1vdmUoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICBkcm9wcGFibGUucmVwbGFjZVdpdGgoYXZhdGFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNlbGVjdHMgYWxsIDx1bD4gZWxlbWVudHMsIHRoZW4gZmlsdGVycyB0aGUgY29sbGVjdGlvblxuICAgICAgICBsZXQgbGlzdHMgPSBtZW51SXRlbXNMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3VsJyk7XG4gICAgICAgIC8vIGtlZXAgb25seSB0aG9zZSBlbGVtZW50cyB3aXRoIG5vIGNoaWxkLWVsZW1lbnRzXG4gICAgICAgIGxldCBlbXB0eUxpc3QgPSBbLi4ubGlzdHNdLmZpbHRlcihlbGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmNoaWxkcmVuLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZm9yIChsZXQgZW1wdHkgb2YgZW1wdHlMaXN0KVxuICAgICAgICAgICAgZW1wdHkucmVtb3ZlKCk7XG5cbiAgICAgICAgZHJhZ09iamVjdC5kYXRhID0gdHJhbnNmb3JtRGF0YShtZW51SXRlbXNMaXN0LnF1ZXJ5U2VsZWN0b3IoXCIubWVudS1pdGVtc1wiKSk7XG4gICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtc0xpc3QucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgIGxldCBkZWxldGVBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGUuZGVsZXRlLWFyZWFcIik7XG4gICAgICAgIGlmIChkZWxldGVBcmVhKVxuICAgICAgICAgICAgZGVsZXRlQXJlYS5oaWRkZW4gPSB0cnVlO1xuXG4gICAgICAgIGlmICghZHJvcEVsZW0pXG4gICAgICAgICAgICBzZWxmLm9uRHJhZ0NhbmNlbChkcmFnT2JqZWN0KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2VsZi5vbkRyYWdFbmQoZHJhZ09iamVjdCwgZHJvcEVsZW0pO1xuICAgIH1cbiAgICB2YXIgZmluZERyb3BwYWJsZSA9IChlKSA9PiB7XG4gICAgICAgIC8vINGB0L/RgNGP0YfQtdC8INC/0LXRgNC10L3QvtGB0LjQvNGL0Lkg0Y3Qu9C10LzQtdC90YJcbiAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuaGlkZGVuID0gdHJ1ZTtcblxuICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVg7XG5cbiAgICAgICAgLy8g0L/QvtC70YPRh9C40YLRjCDRgdCw0LzRi9C5INCy0LvQvtC20LXQvdC90YvQuSDRjdC70LXQvNC10L3RgiDQv9C+0LQg0LrRg9GA0YHQvtGA0L7QvCDQvNGL0YjQuFxuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQobGVmdCwgdG9wKTtcblxuICAgICAgICAvLyDQv9C+0LrQsNC30LDRgtGMINC/0LXRgNC10L3QvtGB0LjQvNGL0Lkg0Y3Qu9C10LzQtdC90YIg0L7QsdGA0LDRgtC90L5cbiAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuaGlkZGVuID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGVsZW0gPT0gbnVsbCkgLy8g0YLQsNC60L7QtSDQstC+0LfQvNC+0LbQvdC+LCDQtdGB0LvQuCDQutGD0YDRgdC+0YAg0LzRi9GI0LggXCLQstGL0LvQtdGC0LXQu1wiINC30LAg0LPRgNCw0L3QuNGG0YMg0L7QutC90LBcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgIHJldHVybiBlbGVtLmNsb3Nlc3QoJy5kcm9wcGFibGUnKTtcbiAgICB9XG5cbiAgICBcbiAgICB2YXIgb25Nb3VzZURvd24gPSAoZSkgPT4ge1xuXG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwibW91c2Vkb3duXCIgJiYgZS53aGljaCAhPSAxKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBlbGVtID0gZS50YXJnZXQuY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuICAgICAgICBpZiAoIWVsZW0pIHJldHVybjtcblxuICAgICAgICBkcmFnT2JqZWN0LmVsZW0gPSBlbGVtO1xuXG4gICAgICAgIC8vINC30LDQv9C+0LzQvdC40LwsINGH0YLQviDRjdC70LXQvNC10L3RgiDQvdCw0LbQsNGCINC90LAg0YLQtdC60YPRidC40YUg0LrQvtC+0YDQtNC40L3QsNGC0LDRhSBwYWdlWC9wYWdlWVxuICAgICAgICBkcmFnT2JqZWN0LmRvd25YID0gZS5wYWdlWCB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgIGRyYWdPYmplY3QuZG93blkgPSBlLnBhZ2VZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBvbk1vdXNlTW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGlmICghZHJhZ09iamVjdC5lbGVtKSByZXR1cm47IC8vINGN0LvQtdC80LXQvdGCINC90LUg0LfQsNC20LDRglxuXG4gICAgICAgIGlmICghZHJhZ09iamVjdC5hdmF0YXIpIHsgLy8g0LXRgdC70Lgg0L/QtdGA0LXQvdC+0YEg0L3QtSDQvdCw0YfQsNGCLi4uXG5cbiAgICAgICAgICAgIGxldCBtb3ZlWCA9IDA7XG4gICAgICAgICAgICBsZXQgbW92ZVkgPSAwO1xuICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgICAgICAgICAgIG1vdmVYID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYIC0gZHJhZ09iamVjdC5kb3duWDtcbiAgICAgICAgICAgICAgICBtb3ZlWSA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3QuZG93blk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVYID0gZS5wYWdlWCAtIGRyYWdPYmplY3QuZG93blg7XG4gICAgICAgICAgICAgICAgbW92ZVkgPSBlLnBhZ2VZIC0gZHJhZ09iamVjdC5kb3duWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g0LXRgdC70Lgg0LzRi9GI0Ywg0L/QtdGA0LXQtNCy0LjQvdGD0LvQsNGB0Ywg0LIg0L3QsNC20LDRgtC+0Lwg0YHQvtGB0YLQvtGP0L3QuNC4INC90LXQtNC+0YHRgtCw0YLQvtGH0L3QviDQtNCw0LvQtdC60L5cbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhtb3ZlWCkgPCA1ICYmIE1hdGguYWJzKG1vdmVZKSA8IDUpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INC/0LXRgNC10L3QvtGBXG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhciA9IGNyZWF0ZUF2YXRhcihlKTsgLy8g0YHQvtC30LTQsNGC0Ywg0LDQstCw0YLQsNGAXG4gICAgICAgICAgICBpZiAoIWRyYWdPYmplY3QuYXZhdGFyKSB7IC8vINC+0YLQvNC10L3QsCDQv9C10YDQtdC90L7RgdCwLCDQvdC10LvRjNC30Y8gXCLQt9Cw0YXQstCw0YLQuNGC0YxcIiDQt9CwINGN0YLRgyDRh9Cw0YHRgtGMINGN0LvQtdC80LXQvdGC0LBcbiAgICAgICAgICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDQsNCy0LDRgtCw0YAg0YHQvtC30LTQsNC9INGD0YHQv9C10YjQvdC+XG4gICAgICAgICAgICAvLyDRgdC+0LfQtNCw0YLRjCDQstGB0L/QvtC80L7Qs9Cw0YLQtdC70YzQvdGL0LUg0YHQstC+0LnRgdGC0LLQsCBzaGlmdFgvc2hpZnRZXG4gICAgICAgICAgICBsZXQgY29vcmRzID0gZ2V0Q29vcmRzKGRyYWdPYmplY3QuYXZhdGFyKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3Quc2hpZnRYID0gZHJhZ09iamVjdC5kb3duWCAtIGNvb3Jkcy5sZWZ0O1xuICAgICAgICAgICAgZHJhZ09iamVjdC5zaGlmdFkgPSBkcmFnT2JqZWN0LmRvd25ZIC0gY29vcmRzLnRvcDtcblxuICAgICAgICAgICAgc3RhcnREcmFnKGUpOyAvLyDQvtGC0L7QsdGA0LDQt9C40YLRjCDQvdCw0YfQsNC70L4g0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICB9XG5cbiAgICAgICAgLy8g0L7RgtC+0LHRgNCw0LfQuNGC0Ywg0L/QtdGA0LXQvdC+0YEg0L7QsdGK0LXQutGC0LAg0L/RgNC4INC60LDQttC00L7QvCDQtNCy0LjQttC10L3QuNC4INC80YvRiNC4XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmxlZnQgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCAtIGRyYWdPYmplY3Quc2hpZnRYKSArICdweCc7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS50b3AgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3Quc2hpZnRZKSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS5sZWZ0ID0gKGUucGFnZVggLSBkcmFnT2JqZWN0LnNoaWZ0WCkgKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUudG9wID0gKGUucGFnZVkgLSBkcmFnT2JqZWN0LnNoaWZ0WSkgKyAncHgnO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlRHJvcHBhYmxlKGUpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBvbk1vdXNlVXAgPSAoZSkgPT4ge1xuICAgICAgICBpZiAoZHJhZ09iamVjdC5hdmF0YXIpIC8vINC10YHQu9C4INC/0LXRgNC10L3QvtGBINC40LTQtdGCXG4gICAgICAgICAgICBmaW5pc2hEcmFnKGUpO1xuXG4gICAgICAgIC8vINC/0LXRgNC10L3QvtGBINC70LjQsdC+INC90LUg0L3QsNGH0LjQvdCw0LvRgdGPLCDQu9C40LHQviDQt9Cw0LLQtdGA0YjQuNC70YHRj1xuICAgICAgICAvLyDQsiDQu9GO0LHQvtC8INGB0LvRg9GH0LDQtSDQvtGH0LjRgdGC0LjQvCBcItGB0L7RgdGC0L7Rj9C90LjQtSDQv9C10YDQtdC90L7RgdCwXCIgZHJhZ09iamVjdFxuICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgfVxuXG5cbiAgICBtZW51SXRlbXNMaXN0Lm9ubW91c2Vkb3duID0gb25Nb3VzZURvd247XG4gICAgbWVudUl0ZW1zTGlzdC5vbnRvdWNoc3RhcnQgPSBvbk1vdXNlRG93bjtcbiAgICBtZW51SXRlbXNMaXN0Lm9ubW91c2Vtb3ZlID0gb25Nb3VzZU1vdmU7XG4gICAgbWVudUl0ZW1zTGlzdC5vbnRvdWNobW92ZSA9IG9uTW91c2VNb3ZlO1xuICAgIG1lbnVJdGVtc0xpc3Qub25tb3VzZXVwID0gb25Nb3VzZVVwO1xuICAgIG1lbnVJdGVtc0xpc3Qub250b3VjaGVuZCA9IG9uTW91c2VVcDtcblxuICAgIHRoaXMub25EcmFnRW5kID0gZnVuY3Rpb24oZHJhZ09iamVjdCwgZHJvcEVsZW0pIHt9O1xuICAgIHRoaXMub25EcmFnQ2FuY2VsID0gZnVuY3Rpb24oZHJhZ09iamVjdCkge307XG5cbn1cblxuRHJhZ01lbnUub25EcmFnQ2FuY2VsID0gZnVuY3Rpb24gKGRyYWdPYmplY3QpIHtcbiAgICBpZiAoZHJhZ09iamVjdC5kYXRhKSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51T3B0aW9ucycpLmlubmVyVGV4dCA9IGRyYWdPYmplY3QuZGF0YTtcbiAgICB9XG59O1xuXG5EcmFnTWVudS5vbkRyYWdFbmQgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCwgZHJvcEVsZW0pIHtcbiAgICBpZiAoZHJhZ09iamVjdC5kYXRhKSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51T3B0aW9ucycpLmlubmVyVGV4dCA9IGRyYWdPYmplY3QuZGF0YTtcbiAgICB9XG59OyJdfQ==
