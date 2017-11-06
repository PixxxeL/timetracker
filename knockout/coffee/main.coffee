
TIMETRACKER = {
    Settings : {
        dataStorageKey : 'timetracker-data'
    }
    Data : {
        current : 'Default'
        data : []
    }
}


formatMilliseconds = (ms) ->
    ms = (ms * .001) | 0
    seconds = ms % 60
    minutes = ((ms / 60) % 60) | 0
    hours = (ms / 60 / 60) | 0
    if seconds < 10
        seconds = "0#{seconds}"
    if minutes < 10
        minutes = "0#{minutes}"
    "#{hours}:#{minutes}:#{seconds}"


TIMETRACKER.AppViewModel = ->
    self = @
    self.data = ko.observableArray TIMETRACKER.Data.data
    self.titles = ko.computed ->
        _.keys self.data()
    self.current = ko.observable TIMETRACKER.Data.current
    self.isSelectProject = ko.observable false
    self.isToggleProject = ko.computed ->
        self.titles().length > 1
    self.diff = ko.observable 0
    self.currentTimes = ko.computed ->
        self.data()[self.current()] or []
    self.currentTimesSize = ko.computed ->
        self.currentTimes().length
    self.totalTime = ko.computed ->
        _.reduce self.currentTimes(), (memo, time) ->
            memo + (time.endTs - time.startTs)
        , 0
    self.closedTime = ko.computed ->
        _.reduce self.currentTimes(), (memo, time) ->
            diff = if time.closed then time.endTs - time.startTs else 0
            memo + diff
        , 0

    self.current.subscribe ->
        self.save()

    self.data.subscribe ->
        self.save()

    load = ->
        data = window.localStorage.getItem TIMETRACKER.Settings.dataStorageKey
        if data
            data = JSON.parse data
            self.data data.data
            self.current data.current
        null

    self.save = ->
        data = JSON.stringify {
            current : self.current()
            data : self.data()
        }
        console.log 'save', data
        window.localStorage.setItem TIMETRACKER.Settings.dataStorageKey, data
        null

    bindEvents = ->
        document.addEventListener 'mouseup', (e) ->
            select = document.querySelector('select.select-project')
            button = document.querySelector('a.swap-project')
            if not select.contains(e.target) and not button.contains(e.target)
                self.isSelectProject false
        null

    self.formatMilliseconds = formatMilliseconds

    self.selectProjectClick = (data, e) ->
        e.stopPropagation()
        null

    self.toggleSelectProject = ->
        if self.isToggleProject()
            self.isSelectProject !self.isSelectProject()
        null

    self.addProject = ->
        #if startDate
        #    return alert 'Нельзя добавить проект пока работает таймер'
        title = window.prompt('Введите название нового проекта:', '')
        if title
            title = title.trim()
        if title is null
            return
        if not title
            return window.alert 'Вы не ввели название проекта'
        if self.titles().indexOf(title) != -1
            return window.alert 'Такой проект уже существует'
        data = self.data()
        data[title] = []
        self.data data
        self.current title
        null

    self.removeProject = ->
        #if startDate
        #    return window.alert 'Нельзя удалить проект пока работает таймер'
        if window.confirm 'Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?'
            if self.current() == 'Default'
                return window.alert 'Нельзя удалить проект `Default`'
            data = self.data()
            delete data[self.current()]
            self.data data
            self.current 'Default'
        null

    self.toggleTimer = ->
        null

    load()
    bindEvents()

    self


TIMETRACKER.TimeViewModel = (params) ->
    self = @
    app = params.app
    self.startTs = ko.observable params.item.startTs
    self.endTs = ko.observable params.item.endTs
    self.desc = ko.observable params.item.desc
    self.closed = ko.observable params.item.closed
    self.diff = ko.computed ->
        formatMilliseconds self.endTs() - self.startTs()
    self.start = ko.computed ->
        new Date(self.startTs()).toLocaleString('ru-RU')
    self.end = ko.computed ->
        new Date(self.endTs()).toLocaleString('ru-RU')

    self.closed.subscribe app.save

    self


ko.components.register('time-row', {
    viewModel: TIMETRACKER.TimeViewModel
    template: { element: 'time-row-tmpl' }
})


window.onload = ->
    ko.applyBindings(new TIMETRACKER.AppViewModel(), document.getElementById('content-wrapper'))
