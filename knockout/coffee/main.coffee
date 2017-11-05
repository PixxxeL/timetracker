
TIMETRACKER = {
    Settings : {
        dataStorageKey : 'timetracker-data'
    }
    Data : {
        current : 'Default'
        data : []
    }
}


TIMETRACKER.AppViewModel = ->
    self = @
    self.titles = ko.pureComputed ->
        _.keys TIMETRACKER.Data.data
    self.current = ko.pureComputed ->
        TIMETRACKER.Data.current
    self.isSelectProject = ko.observable false

    load = ->
        data = window.localStorage.getItem TIMETRACKER.Settings.dataStorageKey
        if data
            TIMETRACKER.Data = JSON.parse data
        null

    save = ->
        data = JSON.stringify TIMETRACKER.Data
        window.localStorage.setItem TIMETRACKER.Settings.dataStorageKey, data
        null

    bindEvents = ->
        #document.addEventListener 'mouseup', (e) ->
        #    self.isSelectProject false
        null

    self.selectProjectClick = (data, e) ->
        e.preventDefault()
        e.stopPropagation()
        null

    self.toggleSelectProject = ->
        #if self.titles().length > 1
        #    self.isSelectProject !self.isSelectProject()
        self.isSelectProject !self.isSelectProject()
        null

    self.addProject = ->
        #if startDate
        #    return alert 'Нельзя добавить проект пока работает таймер'
        title = window.prompt('Введите название нового проекта:', '').trim()
        if not title
            return window.alert 'Вы не ввели название проекта'
        if self.titles().indexOf(title) != -1
            return window.alert 'Такой проект уже существует'
        TIMETRACKER.Data.current = title
        TIMETRACKER.Data.data[title] = []
        save()
        #renderProjectSelectList()
        #setProject()
        null

    self.removeProject = ->
        #if startDate
        #    return window.alert 'Нельзя удалить проект пока работает таймер'
        if window.confirm 'Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?'
            if TIMETRACKER.Data.current == 'Default'
                return window.alert 'Нельзя удалить проект `Default`'
            delete TIMETRACKER.Data.data[TIMETRACKER.Data.current]
            TIMETRACKER.Data.current = 'Default'
            save()
            #renderProjectSelectList()
            #setProject()
        null

    load()
    bindEvents()

    self


window.onload = ->
    ko.applyBindings(new TIMETRACKER.AppViewModel(), document.getElementById('content-wrapper'))
