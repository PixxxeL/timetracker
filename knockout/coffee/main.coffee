
TIMETRACKER = {
    Settings : {
        dataStorageKey : 'timetracker-data'
    }
    Data : {
        current : 'Default'
        data : {
            'Default' : []
        }
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
    self.loopCounter = 0
    self.data = ko.observable TIMETRACKER.Data.data
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
            diff = if time.closed then 0 else time.endTs - time.startTs
            memo + diff
        , 0
    self.newTime = ko.observable null

    load = ->
        data = window.localStorage.getItem TIMETRACKER.Settings.dataStorageKey
        if data
            data = JSON.parse data
            self.data data.data
            self.current data.current
        null

    save = ->
        data = JSON.stringify {
            current : self.current()
            data : self.data()
        }
        #console.log 'save', data
        window.localStorage.setItem TIMETRACKER.Settings.dataStorageKey, data
        null

    bindEvents = ->
        document.addEventListener 'mouseup', (e) ->
            select = document.querySelector('select.select-project')
            button = document.querySelector('a.swap-project')
            if not select.contains(e.target) and not button.contains(e.target)
                self.isSelectProject false
        null

    renderFrame = ->
        if self.newTime() is null
            return
        self.newTime().endTs = new Date().getTime()
        self.diff(self.newTime().endTs - self.newTime().startTs)
        self.loopCounter += 1
        if self.loopCounter % 30 is 0 # per 0.5 seconds
            newTimeSave()
        window.requestAnimationFrame renderFrame

    newTimeSave = ->
        times = self.currentTimes()
        idx = _.findIndex times, (time) -> time.startTs == self.newTime().startTs
        if idx < 0
            times.unshift self.newTime()
        else
            times[idx] = self.newTime()
        save()
        load()

    self.formatMilliseconds = formatMilliseconds

    self.selectProjectClick = (e) ->
        e.stopPropagation
        null

    self.selectProjectChange = save

    self.toggleSelectProject = ->
        if self.isToggleProject()
            self.isSelectProject !self.isSelectProject()
        null

    self.addProject = ->
        if self.newTime() isnt null
            return window.alert 'Нельзя добавить проект пока работает таймер'
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
        save()
        null

    self.removeProject = ->
        if self.newTime() isnt null
            return window.alert 'Нельзя удалить проект пока работает таймер'
        if window.confirm 'Вы действительно хотите БЕЗВОЗВРАТНО удалить проект?'
            if self.current() == 'Default'
                return window.alert 'Нельзя удалить проект `Default`'
            data = self.data()
            delete data[self.current()]
            self.data data
            self.current 'Default'
            save()
        null

    self.toggleTimer = ->
        if self.newTime() is null
            self.loopCounter = 0
            now = new Date().getTime()
            self.newTime {
                startTs : now,
                endTs : now,
                desc : window.prompt('Можете ввести пояснение:', '').trim(),
                closed : false
            };
            newTimeSave()
            window.requestAnimationFrame renderFrame
        else
            newTimeSave()
            self.newTime null
            self.diff 0
        null

    self.closeTime = (time) ->
        if self.newTime() isnt null
            return window.alert 'Нельзя учесть пока работает таймер'
        _.find self.currentTimes(), (item) ->
            if item.startTs == time.startTs()
                item.closed = time.closed()
                return
        save()
        load()

    self.removeTime = (time) ->
        if self.newTime() isnt null
            return window.alert 'Нельзя удалить пока работает таймер'
        if not confirm 'Действительно хотите удалить\nбез возможности восстановить?'
            return
        self.data()[self.current()] = _.reject self.currentTimes(), (item) ->
            item.startTs == time.startTs()
        save()
        load()
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

    self.closed.subscribe ->
        app.closeTime self

    self.remove = ->
        app.removeTime self

    self


ko.components.register 'time-row', {
    viewModel: TIMETRACKER.TimeViewModel
    template: { element: 'time-row-tmpl' }
}


window.onload = ->
    ko.applyBindings(new TIMETRACKER.AppViewModel(), document.getElementById('content-wrapper'))
