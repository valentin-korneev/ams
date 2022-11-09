const observers = {
    // global storage    
}

const getButtonSubmit = () => {
    let element = document.createElement('button')
    element.setAttribute('class', 'btn btn-primary m-1')
    element.setAttribute('type', 'submit')
    element.textContent = 'Поиск'
    return element
}

const getButtonReset = () => {
    let element = document.createElement('button')
    element.setAttribute('class', 'btn m-1')
    element.setAttribute('type', 'reset')
    element.textContent = 'Очистить'
    return element
}

const getNavLink = (tab) => {
    let element = document.createElement('button')
    element.setAttribute('class', 'nav-link')
    element.setAttribute('data-bs-toggle', 'pill')
    element.setAttribute('data-bs-target', '#pills-' + tab.id)
    element.textContent = tab.title
    return element
}

const getNavItem = (tab) => {
    let element = document.createElement('li')
    element.setAttribute('class', 'nav-item p-1')
    element.appendChild(getNavLink(tab))
    return element
}

const checkboxChange = (event) => {
    event.target.value = event.target.checked ? 'true' : 'false'
}

const observe = (event) => {
    let id = event.target.form.getAttribute('form-id') + '.' + event.target.name
    if (observers[id]) {
        observers[id].forEach((input) => {
            if ((input.value || '$') != (event.target.value || '$')) {
                input.value = event.target.value
                input.form.querySelectorAll('input').forEach((inp) => {
                    if (inp != input) {
                        inp.value = ''
                        inp.dispatchEvent(new Event('change'))
                    }
                })
                input.form.dispatchEvent(new Event('submit'))
            }
        })
    }
}

const getInput = (column) => {
    let element = document.createElement('input')
    element.setAttribute('name', column.id)
    element.setAttribute('type', column.type)
    element.addEventListener('change', observe)
    if (column.type == 'checkbox') {
        element.addEventListener('change', checkboxChange)
    }
    if (column['observe']) {
        if (observers[column['observe']]) {
            observers[column['observe']].append(element)
        } else {
            observers[column['observe']] = [element]
        }
    }
    return element
}

const getFormControl = (column) => {
    let element = getInput(column)
    element.setAttribute('class', 'form-control')
    element.setAttribute('placeholder', column.title)
    return element
}

const getFormCheckInput = (column) => {
    let element = getInput(column)
    element.setAttribute('class', 'form-check-input')
    element.setAttribute('id', column.id)
    return element
}

const getFormCheckLabel = (column) => {
    let element = document.createElement('label')
    element.setAttribute('class', 'form-check-label ms-2')
    element.setAttribute('for', column.id)
    element.textContent = column.title
    return element
}

const getFormGroup = (column) => {
    let element = document.createElement('div')
    element.setAttribute('class', 'form-group col-4')
    element.appendChild(getFormControl(column))
    return element
}

const getFormSwitch = (column) => {
    let element = document.createElement('div')
    element.setAttribute('class', 'form-switch col-4')
    element.appendChild(getFormCheckInput(column))
    element.appendChild(getFormCheckLabel(column))
    return element
}

const getFormRow = (columns) => {
    let element = document.createElement('div')
    element.setAttribute('class', 'row p-1')
    columns.forEach((column) => {
        if (column.type == 'checkbox') {
            element.appendChild(getFormSwitch(column))
        } else {
            element.appendChild(getFormGroup(column))
        }  
    })
    return element
}

const getStorageData = (key) => {
    let data = localStorage.getItem('data')
    if (data) {
        data = JSON.parse(data)
        return data[key] || []
    } else {
        return []
    }
}

const setStorageData = (key, data) => {
    let oldData = localStorage.getItem('data')
    if (oldData) {
        oldData = JSON.parse(oldData)
    } else {
        oldData = {}
    }
    oldData[key] = data
    localStorage.setItem('data', JSON.stringify(oldData))
    renderTable(key)
}

const submit = async (event) => {
    event.preventDefault()

    let formData = new FormData(event.target)
    let data = {}
    formData.forEach((value, key) => {
        data[key] = value
    })
    let formId = event.target.getAttribute('form-id')
    const response = await fetch('./data/' + formId + '.json?' + Math.random())
    let responseData = []
    if (response.status == 200) {
        responseData = await response.text()
        if (responseData) {
            responseData = JSON.parse(responseData)
        } else {
            responseData = []
        }
    }
    setStorageData(formId, responseData)
}

const getForm = (tab) => {
    let element = document.createElement('form')
    element.setAttribute('form-id', tab.id)
    for (let i = 0; i < tab.columns.length; i = i + 3) {
        element.appendChild(getFormRow(tab.columns.slice(i, i + 3)))
    }
    element.appendChild(getButtonSubmit())
    element.appendChild(getButtonReset())
    element.addEventListener('submit', submit)
    return element
}

const getTh = (column) => {
    let element = document.createElement('th')
    element.setAttribute('scope', 'col')
    element.setAttribute('id', column.id)
    element.textContent = column.title
    return element
}

const getTheadRow = (columns) => {
    let element = document.createElement('tr')
    columns.forEach((column) => {
        element.appendChild(getTh(column))
    })
    element.appendChild(getTh({ 'id': '@action', 'title': 'Действия'}))
    return element
}

const getTd = (key, value) => {
    let element = document.createElement('td')
    element.setAttribute('id', key)
    element.textContent = value
    return element
}

const _setFormByRow = (obj) => {
    let data = {}
    obj.closest('tr').childNodes.forEach((th) => data[th.id] = th.textContent)
    let formId = obj.closest('table').getAttribute('table-id')
    let form = document.querySelector('form[form-id=' + formId + ']')
    form.querySelectorAll('input').forEach((element) => {
        element.value = data[element.name]
        if (element.type == 'checkbox') {
            element.checked = element.value == 'true'
        }
        element.dispatchEvent(new Event('change'))
    })
}

const setFormByRow = (event) => {
    _setFormByRow(event.target)
}

const getTdAction = () => {
    let element = getTd(null)
    let button = document.createElement('button')
    button.setAttribute('class', 'btn btn-info')
    button.addEventListener('click', setFormByRow)
    button.textContent = 'Выбрать'
    element.appendChild(button)
    return element
}

const getTbodyRow = (order, row, with_action = true) => {
    let element = document.createElement('tr')
    order.forEach((column) => {
        if (with_action && column == '@action') {
            element.appendChild(getTdAction())
        } else {
            element.appendChild(getTd(column, row[column] || ''))
        }
    })
    return element
}

const getThead = (tab) => {
    let element = document.createElement('thead')
    element.appendChild(getTheadRow(tab.columns))
    return element
}

const getTbody = (tab) => {
    let element = document.createElement('tbody')
    return element
}

const renderTable = (key) => {
    let data = getStorageData(key)
    let thead = document.querySelector('table[table-id=' + key + '] thead')
    let order = []
    thead.childNodes[0].childNodes.forEach((child) => {
        order.push(child.id)
    })
    let tbody = document.querySelector('table[table-id=' + key + '] tbody')
    tbody.innerHTML = ''
    if (data && data.length > 0) {  
        data.forEach((row) => {
            tbody.appendChild(getTbodyRow(order, row, with_action=data.length > 1))
        })
        if (data.length == 1) {
            _setFormByRow(tbody.querySelector('td'))
        }
    } else {
        let tr = document.createElement('tr')
        let td = document.createElement('td')
        td.setAttribute('class', 'text-danger')
        td.setAttribute('colspan', order.length)
        td.textContent = 'Данные отсутствуют'
        tr.appendChild(td)
        tbody.appendChild(tr)
    }
}

const getTable = (tab) => {
    let element = document.createElement('table')
    element.setAttribute('class', 'table table-bordered border-primary mt-2')
    element.setAttribute('table-id', tab.id)
    element.appendChild(getThead(tab))
    element.appendChild(getTbody(tab))
    return element
}

const getTabPane = (tab) => {
    let element = document.createElement('div')
    element.setAttribute('class', 'tab-pane fade')
    element.setAttribute('id', 'pills-' + tab.id)
    element.appendChild(getForm(tab))
    element.appendChild(getTable(tab))
    return element
}

window.onload = async () => {
    localStorage.clear()
    const response = await fetch('./meta.json?' + Math.random())
    const tabs = await response.json()

    let nav = document.querySelector('.nav-pills')
    let tabContent = document.querySelector('.tab-content')

    tabs.forEach(tab => {
        nav.appendChild(getNavItem(tab))
        tabContent.appendChild(getTabPane(tab))
    })
}