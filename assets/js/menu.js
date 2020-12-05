var DragMenu = new function() {
    let menuSources = document.getElementById('menuSources');
    let panels = menuSources.querySelectorAll(".panel .panel-body");
    let sourcesList = [...panels].filter(elem => {
        if (elem.children.length) {

            let items = elem.querySelectorAll('.source-list input[type="checkbox"]');
            let addButton = elem.querySelector('button[data-rel="add"]');
            if (addButton) {

                if (items) {
                    addButton.onclick = (event) => {
                        event.preventDefault();
                        let sourcesItems = [...items].filter(item => {
                            if (item.checked) {
                                addMenuItem(item);
                            }
                        });
                    }
                }
            }

            let selectAll = elem.querySelector('input[type="checkbox"][name="select-all"]');
            if (selectAll) {
                selectAll.onchange = (event) => {
                    event.preventDefault();
                    if (event.target.checked) {
                        items.forEach(checkbox => {
                            checkbox.checked = true;
                        });
                    } else {
                        items.forEach(checkbox => {
                            checkbox.checked = false;
                        });
                    }
                }
            }
        }
    });

    /**
     * @param {String} HTML representing a single element
     * @return {Element}
     */
    let htmlToElement = (html) => {
        var template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    /**
     * @param {String} HTML representing any number of sibling elements
     * @return {NodeList}
     */
    let htmlToElements = (html) => {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.childNodes;
    }

    let fillTemplate = (str, obj) => {
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

    let menuItemsList = document.getElementById('menuItems');
    let formTemplate = document.getElementById('itemFormTemplate');
    let itemTemplate = document.getElementById('menuItemTemplate');
    let addMenuItem = (item) => {
        if (menuItemsList && itemTemplate && 'content' in document.createElement('template')) {

            if (menuItemsList.classList.contains('no-items')) {
                menuItemsList.classList.remove('no-items');
                menuItemsList.innerHTML = "";
            }

            let data = item.dataset;
            data.form = fillTemplate(formTemplate.innerHTML, data);

            let content = fillTemplate(itemTemplate.innerHTML, data);
            menuItemsList.append(htmlToElement(content));

        }
    };
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBEcmFnTWVudSA9IG5ldyBmdW5jdGlvbigpIHtcbiAgICBsZXQgbWVudVNvdXJjZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudVNvdXJjZXMnKTtcbiAgICBsZXQgcGFuZWxzID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvckFsbChcIi5wYW5lbCAucGFuZWwtYm9keVwiKTtcbiAgICBsZXQgc291cmNlc0xpc3QgPSBbLi4ucGFuZWxzXS5maWx0ZXIoZWxlbSA9PiB7XG4gICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCkge1xuXG4gICAgICAgICAgICBsZXQgaXRlbXMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zb3VyY2UtbGlzdCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKTtcbiAgICAgICAgICAgIGxldCBhZGRCdXR0b24gPSBlbGVtLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbltkYXRhLXJlbD1cImFkZFwiXScpO1xuICAgICAgICAgICAgaWYgKGFkZEJ1dHRvbikge1xuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEJ1dHRvbi5vbmNsaWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNvdXJjZXNJdGVtcyA9IFsuLi5pdGVtc10uZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkTWVudUl0ZW0oaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzZWxlY3RBbGwgPSBlbGVtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXVtuYW1lPVwic2VsZWN0LWFsbFwiXScpO1xuICAgICAgICAgICAgaWYgKHNlbGVjdEFsbCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdEFsbC5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGNoZWNrYm94ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IEhUTUwgcmVwcmVzZW50aW5nIGEgc2luZ2xlIGVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtFbGVtZW50fVxuICAgICAqL1xuICAgIGxldCBodG1sVG9FbGVtZW50ID0gKGh0bWwpID0+IHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgaHRtbCA9IGh0bWwudHJpbSgpOyAvLyBOZXZlciByZXR1cm4gYSB0ZXh0IG5vZGUgb2Ygd2hpdGVzcGFjZSBhcyB0aGUgcmVzdWx0XG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZS5jb250ZW50LmZpcnN0Q2hpbGQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IEhUTUwgcmVwcmVzZW50aW5nIGFueSBudW1iZXIgb2Ygc2libGluZyBlbGVtZW50c1xuICAgICAqIEByZXR1cm4ge05vZGVMaXN0fVxuICAgICAqL1xuICAgIGxldCBodG1sVG9FbGVtZW50cyA9IChodG1sKSA9PiB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZS5jb250ZW50LmNoaWxkTm9kZXM7XG4gICAgfVxuXG4gICAgbGV0IGZpbGxUZW1wbGF0ZSA9IChzdHIsIG9iaikgPT4ge1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB2YXIgYmVmb3JlUmVwbGFjZSA9IHN0cjtcbiAgICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC97e1xccyooW159XFxzXSspXFxzKn19L2csIGZ1bmN0aW9uKHdob2xlTWF0Y2gsIGtleSkge1xuICAgICAgICAgICAgICAgIHZhciBzdWJzdGl0dXRpb24gPSBvYmpbJC50cmltKGtleSldO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3Vic3RpdHV0aW9uID09PSB1bmRlZmluZWQgPyB3aG9sZU1hdGNoIDogc3Vic3RpdHV0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGFmdGVyUmVwbGFjZSA9IHN0ciAhPT0gYmVmb3JlUmVwbGFjZTtcbiAgICAgICAgfSB3aGlsZSAoYWZ0ZXJSZXBsYWNlKTtcblxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH07XG5cbiAgICBsZXQgbWVudUl0ZW1zTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51SXRlbXMnKTtcbiAgICBsZXQgZm9ybVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2l0ZW1Gb3JtVGVtcGxhdGUnKTtcbiAgICBsZXQgaXRlbVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtVGVtcGxhdGUnKTtcbiAgICBsZXQgYWRkTWVudUl0ZW0gPSAoaXRlbSkgPT4ge1xuICAgICAgICBpZiAobWVudUl0ZW1zTGlzdCAmJiBpdGVtVGVtcGxhdGUgJiYgJ2NvbnRlbnQnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJykpIHtcblxuICAgICAgICAgICAgaWYgKG1lbnVJdGVtc0xpc3QuY2xhc3NMaXN0LmNvbnRhaW5zKCduby1pdGVtcycpKSB7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zTGlzdC5jbGFzc0xpc3QucmVtb3ZlKCduby1pdGVtcycpO1xuICAgICAgICAgICAgICAgIG1lbnVJdGVtc0xpc3QuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGRhdGEgPSBpdGVtLmRhdGFzZXQ7XG4gICAgICAgICAgICBkYXRhLmZvcm0gPSBmaWxsVGVtcGxhdGUoZm9ybVRlbXBsYXRlLmlubmVySFRNTCwgZGF0YSk7XG5cbiAgICAgICAgICAgIGxldCBjb250ZW50ID0gZmlsbFRlbXBsYXRlKGl0ZW1UZW1wbGF0ZS5pbm5lckhUTUwsIGRhdGEpO1xuICAgICAgICAgICAgbWVudUl0ZW1zTGlzdC5hcHBlbmQoaHRtbFRvRWxlbWVudChjb250ZW50KSk7XG5cbiAgICAgICAgfVxuICAgIH07XG59Il19
